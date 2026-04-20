import FormField from '../ui/FormField.jsx';

const GENERATORE_OPTIONS = [
  { value: 'caldaia-gas', label: 'Caldaia a Gas' },
  { value: 'caldaia-condensazione', label: 'Caldaia a Condensazione' },
  { value: 'pompa-di-calore', label: 'Pompa di Calore' },
  { value: 'stufa-pellet', label: 'Stufa a Pellet' },
  { value: 'stufa-legna', label: 'Stufa a Legna' },
  { value: 'elettrico', label: 'Riscaldamento Elettrico' },
  { value: 'teleriscaldamento', label: 'Teleriscaldamento' },
  { value: 'altro', label: 'Altro' },
];

const EMISSIONE_OPTIONS = [
  { value: 'radiatori', label: 'Radiatori' },
  { value: 'pavimento-radiante', label: 'Pavimento Radiante' },
  { value: 'fan-coil', label: 'Fan Coil' },
  { value: 'split', label: 'Split' },
  { value: 'termoconvettori', label: 'Termoconvettori' },
  { value: 'altro', label: 'Altro' },
];

const ACS_OPTIONS = [
  { value: 'combinato', label: 'Combinato con Riscaldamento' },
  { value: 'scaldabagno-elettrico', label: 'Scaldabagno Elettrico' },
  { value: 'scaldabagno-gas', label: 'Scaldabagno a Gas' },
  { value: 'boiler-separato', label: 'Boiler Separato' },
  { value: 'pompa-calore-acs', label: 'Pompa di Calore ACS' },
  { value: 'solare-termico', label: 'Solare Termico' },
];

const RINNOVABILI_OPTIONS = [
  { value: 'solare-termico', label: 'Pannelli Solari Termici' },
  { value: 'fotovoltaico', label: 'Fotovoltaico' },
  { value: 'nessuno', label: 'Nessuno' },
];

export default function TechnicalSystems({ data, onUpdate }) {
  const handleChange = (field) => (value) => {
    onUpdate({ [field]: value });
    // Reset PV power if user deselects fotovoltaico
    if (field === 'energieRinnovabili') {
      if (!value.includes('fotovoltaico')) {
        onUpdate({ [field]: value, potenzaPV: '' });
      }
    }
  };

  const showPVPower = data.energieRinnovabili?.includes('fotovoltaico');

  return (
    <>
      <FormField
        label="Tipo Generatore"
        type="select"
        value={data.generatore}
        onChange={handleChange('generatore')}
        options={GENERATORE_OPTIONS}
        id="field-generatore"
      />

      <FormField
        label="Marca / Modello"
        type="text"
        value={data.marcaModello}
        onChange={handleChange('marcaModello')}
        placeholder="es. Vaillant ecoTEC plus"
        id="field-marca-modello"
      />

      <FormField
        label="Anno Installazione"
        type="number"
        value={data.annoInstallazione}
        onChange={handleChange('annoInstallazione')}
        placeholder="es. 2015"
        min={1960}
        max={2030}
        id="field-anno-installazione"
      />

      <FormField
        label="Sistema di Emissione"
        type="select"
        value={data.emissione}
        onChange={handleChange('emissione')}
        options={EMISSIONE_OPTIONS}
        id="field-emissione"
      />

      <FormField
        label="Acqua Calda Sanitaria (ACS)"
        type="select"
        value={data.acs}
        onChange={handleChange('acs')}
        options={ACS_OPTIONS}
        id="field-acs"
      />

      <FormField
        label="Energie Rinnovabili"
        type="multi-checkbox"
        value={data.energieRinnovabili}
        onChange={handleChange('energieRinnovabili')}
        options={RINNOVABILI_OPTIONS}
        id="field-rinnovabili"
      />

      {showPVPower && (
        <FormField
          label="Potenza Fotovoltaico (kWp)"
          type="number"
          value={data.potenzaPV}
          onChange={handleChange('potenzaPV')}
          placeholder="es. 3.5"
          min={0}
          id="field-potenza-pv"
          helper="Potenza di picco dell'impianto fotovoltaico"
        />
      )}
    </>
  );
}

export function isTechnicalSystemsComplete(data) {
  const base = !!(
    data.generatore &&
    data.annoInstallazione &&
    data.emissione &&
    data.acs &&
    data.energieRinnovabili?.length > 0
  );
  if (data.energieRinnovabili?.includes('fotovoltaico')) {
    return base && !!data.potenzaPV;
  }
  return base;
}
