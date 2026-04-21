import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import { saveAs } from 'file-saver';

// --- Technical language maps ---

const TIPOLOGIA_NARRATIVA = {
  appartamento: 'unità abitativa di tipo appartamento',
  villa: 'unità abitativa di tipo villa unifamiliare',
  bifamiliare: 'unità abitativa in edificio bifamiliare',
  'villetta-a-schiera': 'unità abitativa di tipo villetta a schiera',
  'edificio-commerciale': 'unità immobiliare a destinazione commerciale',
  altro: 'unità immobiliare',
};

const PIANO_NARRATIVA = {
  seminterrato: 'al piano seminterrato',
  'piano-terra': 'al piano terra',
  1: 'al primo piano',
  2: 'al secondo piano',
  3: 'al terzo piano',
  4: 'al quarto piano',
  '5+': 'al quinto piano o superiore',
};

const VETRI_NARRATIVA = {
  singolo: 'vetrate di tipo singolo',
  doppio: 'vetrate a doppio vetro camera',
  triplo: 'vetrate a triplo vetro camera',
  'basso-emissivo': 'vetrate basso-emissive',
};

const TELAIO_NARRATIVA = {
  legno: 'legno',
  alluminio: 'alluminio senza taglio termico',
  'alluminio-taglio-termico': 'alluminio a taglio termico',
  pvc: 'PVC',
  misto: 'materiale misto',
};

const ISOLAMENTO_NARRATIVA = {
  assente: 'prive di isolamento termico',
  interno: 'dotate di isolamento termico posizionato sul lato interno',
  esterno: 'dotate di isolamento termico a cappotto sul lato esterno',
  intercapedine: 'dotate di isolamento termico in intercapedine',
};

const TETTO_NARRATIVA = {
  tegole: 'copertura a falde con manto in tegole',
  lamiera: 'copertura con manto in lamiera',
  terrazza: 'copertura piana praticabile (lastrico solare)',
  legno: 'copertura con struttura portante in legno',
  altro: 'copertura di altra tipologia',
};

const CONFINE_SUP_NARRATIVA = {
  tetto: 'la copertura dell\'edificio (ambiente non riscaldato)',
  'sottotetto-non-riscaldato': 'un sottotetto non riscaldato',
  'unita-riscaldata': 'un\'unità immobiliare riscaldata',
  terrazza: 'una terrazza piana',
};

const CONFINE_INF_NARRATIVA = {
  terreno: 'il terreno',
  garage: 'un locale garage non riscaldato',
  cantina: 'un locale cantina non riscaldato',
  'unita-riscaldata': 'un\'unità immobiliare riscaldata',
  vespaio: 'un vespaio aerato',
};

const ORIENTAMENTO_LABELS = {
  nord: 'Nord',
  sud: 'Sud',
  est: 'Est',
  ovest: 'Ovest',
  'nord-est': 'Nord-Est',
  'nord-ovest': 'Nord-Ovest',
  'sud-est': 'Sud-Est',
  'sud-ovest': 'Sud-Ovest',
};

const GENERATORE_NARRATIVA = {
  'caldaia-gas': 'caldaia tradizionale alimentata a gas metano',
  'caldaia-condensazione': 'caldaia a condensazione',
  'pompa-di-calore': 'pompa di calore',
  'stufa-pellet': 'stufa alimentata a pellet',
  'stufa-legna': 'stufa a legna',
  elettrico: 'sistema di riscaldamento di tipo elettrico',
  teleriscaldamento: 'allaccio alla rete di teleriscaldamento',
  altro: 'generatore di altra tipologia',
};

const EMISSIONE_NARRATIVA = {
  radiatori: 'radiatori',
  'pavimento-radiante': 'sistema radiante a pavimento',
  'fan-coil': 'ventilconvettori (fan coil)',
  split: 'unità split',
  termoconvettori: 'termoconvettori',
  altro: 'terminali di altra tipologia',
};

const ACS_NARRATIVA = {
  combinato: 'sistema combinato con l\'impianto di riscaldamento',
  'scaldabagno-elettrico': 'scaldacqua elettrico ad accumulo',
  'scaldabagno-gas': 'scaldacqua istantaneo a gas',
  'boiler-separato': 'bollitore dedicato separato dall\'impianto di riscaldamento',
  'pompa-calore-acs': 'pompa di calore dedicata alla produzione di ACS',
  'solare-termico': 'impianto solare termico',
};

const RINNOVABILI_NARRATIVA = {
  'solare-termico': 'pannelli solari termici',
  fotovoltaico: 'impianto fotovoltaico',
  nessuno: 'nessun impianto da fonte rinnovabile',
};

// --- Helpers ---

function n(map, value, fallback) {
  if (!value) return fallback || '[dato non rilevato]';
  return map[value] || value;
}

function formatDate(dateStr) {
  if (!dateStr) return '[data non specificata]';
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function placeholder(value, label) {
  return value || `[${label}]`;
}

// --- Paragraph builders ---

const FONT = 'Calibri';
const BODY_SIZE = 22;     // 11pt
const HEADING_SIZE = 26;  // 13pt
const TITLE_SIZE = 32;    // 16pt
const SMALL_SIZE = 20;    // 10pt

function bodyParagraph(runs, spacing) {
  return new Paragraph({
    spacing: { before: 80, after: 120, line: 340, ...spacing },
    children: runs,
  });
}

function text(t, opts) {
  return new TextRun({ text: t, font: FONT, size: BODY_SIZE, ...opts });
}

function bold(t, opts) {
  return new TextRun({ text: t, font: FONT, size: BODY_SIZE, bold: true, ...opts });
}

function sectionHeading(number, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 160 },
    children: [
      new TextRun({
        text: `${number}. ${title}`,
        bold: true,
        font: FONT,
        size: HEADING_SIZE,
        color: '1A365D',
      }),
    ],
  });
}

/**
 * Generate and download a narrative Word report.
 * @param {{ nome, cognome, titolo_professionale, albo, numero_iscrizione }} profile
 * @param {string} clientName
 * @param {object} surveyData
 */
export async function generateWordReport(profile, clientName, surveyData) {
  const g = surveyData.generali || {};
  const inv = surveyData.involucro || {};
  const zt = surveyData.zonetermiche || {};
  const imp = surveyData.impianti || {};

  // Profile fields with placeholders
  const nome = placeholder(profile.nome, 'Nome Non Inserito');
  const cognome = placeholder(profile.cognome, 'Cognome Non Inserito');
  const fullName = [profile.nome, profile.cognome].filter(Boolean).join(' ') || '[Nome Non Inserito]';
  const titolo = placeholder(profile.titolo_professionale, 'Titolo Non Inserito');
  const albo = placeholder(profile.albo, 'Albo Non Inserito');
  const numIscrizione = placeholder(profile.numero_iscrizione, 'N. Non Inserito');

  const dataSopr = formatDate(g.dataSopralluogo);

  // ===== INTESTAZIONE PROFESSIONISTA =====
  const headerChildren = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [bold(`${titolo} ${fullName}`, { size: 24 })],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [text(`${albo} \u2014 Iscrizione n. ${numIscrizione}`, { size: SMALL_SIZE, color: '4A5568' })],
    }),
    // Separator
    new Paragraph({
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: '1A365D' } },
      children: [],
    }),
  ];

  // ===== TITOLO =====
  const titleChildren = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
      children: [
        new TextRun({
          text: 'RELAZIONE DI SOPRALLUOGO',
          bold: true,
          font: FONT,
          size: TITLE_SIZE,
          color: '1A365D',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        text('ai fini della redazione dell\'Attestato di Prestazione Energetica (APE)', {
          italics: true,
          color: '4A5568',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [bold(`Cliente: ${clientName}`)],
    }),
  ];

  // ===== 1. PREMESSA =====
  const catastali = g.datiCatastali
    ? `, identificata catastalmente al ${g.datiCatastali},`
    : '';

  const premessaParagraphs = [
    sectionHeading('1', 'Premessa'),
    bodyParagraph([
      text('Io sottoscritto '),
      bold(`${titolo} ${fullName}`),
      text(`, iscritto all'Albo dei ${albo} al n. `),
      bold(numIscrizione),
      text(`, ho eseguito in data `),
      bold(dataSopr),
      text(` il sopralluogo tecnico presso l'unità immobiliare sita nel Comune di `),
      bold(placeholder(g.comune, 'Comune Non Specificato')),
      text(`${catastali} al fine di raccogliere i dati necessari alla redazione dell'Attestato di Prestazione Energetica (APE) ai sensi del D.Lgs. 192/2005 e ss.mm.ii.`),
    ]),
    bodyParagraph([
      text('Di seguito si riportano le caratteristiche costruttive e impiantistiche rilevate nel corso del sopralluogo.'),
    ]),
  ];

  // ===== 2. DESCRIZIONE DELL'IMMOBILE =====
  const tipologia = n(TIPOLOGIA_NARRATIVA, g.tipologiaEdificio, 'unità immobiliare');
  const piano = n(PIANO_NARRATIVA, g.piano, '[piano non specificato]');
  const superficie = g.superficieTotale ? `${g.superficieTotale} m²` : '[superficie non rilevata]';
  const annoCostr = g.annoCostruzione || '[anno non rilevato]';

  const descrizioneParagraphs = [
    sectionHeading('2', 'Descrizione dell\'immobile'),
    bodyParagraph([
      text(`L'immobile oggetto del sopralluogo è una `),
      bold(tipologia),
      text(`, ubicata `),
      bold(piano),
      text(` dell'edificio, con una superficie utile complessiva pari a `),
      bold(superficie),
      text(`. L'edificio risulta costruito nell'anno `),
      bold(annoCostr),
      text('.'),
    ]),
  ];

  // ===== 3. INVOLUCRO EDILIZIO =====
  const spessoreMura = inv.spessoreMura ? `${inv.spessoreMura} cm` : '[spessore non rilevato]';
  const isolamento = n(ISOLAMENTO_NARRATIVA, inv.isolamento, '[isolamento non rilevato]');

  let isolanteExtra = '';
  if (inv.isolamento && inv.isolamento !== 'assente' && inv.spessoreIsolante) {
    isolanteExtra = `, con spessore dello strato isolante pari a ${inv.spessoreIsolante} cm`;
  }

  const tetto = n(TETTO_NARRATIVA, inv.tipoTetto, '[copertura non rilevata]');
  const vetri = n(VETRI_NARRATIVA, inv.tipoVetri, '[tipo vetro non rilevato]');
  const telaio = n(TELAIO_NARRATIVA, inv.telaio, '[telaio non rilevato]');

  const involucroParagraphs = [
    sectionHeading('3', 'Caratteristiche dell\'involucro edilizio'),
    bodyParagraph([
      text('Le strutture opache verticali presentano uno spessore murario di '),
      bold(spessoreMura),
      text(', '),
      text(isolamento),
      text(isolanteExtra),
      text('. La chiusura superiore è costituita da '),
      bold(tetto),
      text('.'),
    ]),
    bodyParagraph([
      text('I componenti trasparenti sono costituiti da '),
      bold(vetri),
      text(' con telaio in '),
      bold(telaio),
      text('.'),
    ]),
  ];

  // ===== 4. ZONE TERMICHE =====
  const confSup = n(CONFINE_SUP_NARRATIVA, zt.confineSuperiore, '[non rilevato]');
  const confInf = n(CONFINE_INF_NARRATIVA, zt.confineInferiore, '[non rilevato]');
  const numPareti = zt.paretiEsposte || '[non rilevato]';

  let orientamentoText = '[non rilevato]';
  if (zt.orientamento && zt.orientamento.length > 0) {
    const labels = zt.orientamento.map((v) => ORIENTAMENTO_LABELS[v] || v);
    if (labels.length === 1) {
      orientamentoText = labels[0];
    } else {
      orientamentoText = labels.slice(0, -1).join(', ') + ' e ' + labels[labels.length - 1];
    }
  }

  const zoneParagraphs = [
    sectionHeading('4', 'Configurazione delle zone termiche'),
    bodyParagraph([
      text('Dal punto di vista della zonizzazione termica, l\'unità immobiliare confina superiormente con '),
      bold(confSup),
      text(' e inferiormente con '),
      bold(confInf),
      text(`. Le pareti disperdenti verso l'esterno risultano essere n. `),
      bold(String(numPareti)),
      text(', con orientamento prevalente verso '),
      bold(orientamentoText),
      text('.'),
    ]),
  ];

  if (zt.note) {
    zoneParagraphs.push(
      bodyParagraph([
        text('Note aggiuntive: '),
        text(zt.note, { italics: true }),
      ])
    );
  }

  // ===== 5. IMPIANTI TECNICI =====
  const generatore = n(GENERATORE_NARRATIVA, imp.generatore, '[generatore non rilevato]');
  const marcaModello = imp.marcaModello || '[marca/modello non rilevati]';
  const annoInst = imp.annoInstallazione || '[anno non rilevato]';
  const emissione = n(EMISSIONE_NARRATIVA, imp.emissione, '[sistema di emissione non rilevato]');
  const acs = n(ACS_NARRATIVA, imp.acs, '[sistema ACS non rilevato]');

  const impiantiParagraphs = [
    sectionHeading('5', 'Impianti tecnici'),
    bodyParagraph([
      text('Il sistema di climatizzazione invernale è affidato a un generatore di tipo '),
      bold(generatore),
      text(', marca e modello '),
      bold(marcaModello),
      text(', installato nell\'anno '),
      bold(annoInst),
      text('. La distribuzione del calore avviene tramite terminali di emissione di tipo '),
      bold(emissione),
      text('.'),
    ]),
    bodyParagraph([
      text('La produzione di acqua calda sanitaria (ACS) è garantita da '),
      bold(acs),
      text('.'),
    ]),
  ];

  // Rinnovabili
  if (imp.energieRinnovabili && imp.energieRinnovabili.length > 0) {
    const hasNessuno = imp.energieRinnovabili.includes('nessuno');
    if (hasNessuno) {
      impiantiParagraphs.push(
        bodyParagraph([
          text('Per quanto concerne le fonti di energia rinnovabile, '),
          bold('non si rileva la presenza di impianti da fonte rinnovabile'),
          text('.'),
        ])
      );
    } else {
      const rinLabels = imp.energieRinnovabili.map((v) => RINNOVABILI_NARRATIVA[v] || v);
      let rinText;
      if (rinLabels.length === 1) {
        rinText = rinLabels[0];
      } else {
        rinText = rinLabels.slice(0, -1).join(', ') + ' e ' + rinLabels[rinLabels.length - 1];
      }

      const pvExtra = imp.energieRinnovabili.includes('fotovoltaico') && imp.potenzaPV
        ? ` con potenza di picco pari a ${imp.potenzaPV} kWp`
        : '';

      impiantiParagraphs.push(
        bodyParagraph([
          text('Per quanto concerne le fonti di energia rinnovabile, l\'immobile è dotato di '),
          bold(rinText),
          text(pvExtra),
          text('.'),
        ])
      );
    }
  }

  // ===== 6. CONCLUSIONI =====
  const conclusioniParagraphs = [
    sectionHeading('6', 'Conclusioni'),
    bodyParagraph([
      text('I dati sopra riportati sono stati rilevati in sede di sopralluogo e verranno utilizzati per la modellazione energetica dell\'edificio ai fini della redazione dell\'Attestato di Prestazione Energetica (APE), secondo la normativa tecnica vigente.'),
    ]),
  ];

  // ===== FIRMA =====
  const firmaParagraphs = [
    // Spacer
    new Paragraph({ spacing: { before: 500 }, children: [] }),
    bodyParagraph([text('In fede,', { italics: true })]),
    new Paragraph({ spacing: { before: 300 }, children: [] }),
    new Paragraph({
      spacing: { after: 20 },
      children: [text('________________________________________', { color: 'AAAAAA' })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [bold(`${titolo} ${fullName}`)],
    }),
    new Paragraph({
      children: [text(`${albo} \u2014 Iscrizione n. ${numIscrizione}`, { size: SMALL_SIZE, color: '4A5568' })],
    }),
  ];

  // ===== ASSEMBLAGGIO DOCUMENTO =====
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
          },
        },
        children: [
          ...headerChildren,
          ...titleChildren,
          ...premessaParagraphs,
          ...descrizioneParagraphs,
          ...involucroParagraphs,
          ...zoneParagraphs,
          ...impiantiParagraphs,
          ...conclusioniParagraphs,
          ...firmaParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = clientName.replace(/[^a-zA-Z0-9\u00C0-\u00FF]/g, '_');
  saveAs(blob, `Relazione_APE_${safeName}.docx`);
}
