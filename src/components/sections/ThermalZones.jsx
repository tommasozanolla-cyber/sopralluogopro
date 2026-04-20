import FormField from '../ui/FormField.jsx';

const CONFINE_SUPERIORE_OPTIONS = [
  { value: 'tetto', label: 'Tetto' },
  { value: 'sottotetto-non-riscaldato', label: 'Sottotetto Non Riscaldato' },
  { value: 'unita-riscaldata', label: 'Unità Riscaldata' },
  { value: 'terrazza', label: 'Terrazza' },
];

const CONFINE_INFERIORE_OPTIONS = [
  { value: 'terreno', label: 'Terreno' },
  { value: 'garage', label: 'Garage' },
  { value: 'cantina', label: 'Cantina' },
  { value: 'unita-riscaldata', label: 'Unità Riscaldata' },
  { value: 'vespaio', label: 'Vespaio' },
];

const ORIENTAMENTO_OPTIONS = [
  { value: 'nord', label: 'Nord' },
  { value: 'sud', label: 'Sud' },
  { value: 'est', label: 'Est' },
  { value: 'ovest', label: 'Ovest' },
  { value: 'nord-est', label: 'Nord-Est' },
  { value: 'nord-ovest', label: 'Nord-Ovest' },
  { value: 'sud-est', label: 'Sud-Est' },
  { value: 'sud-ovest', label: 'Sud-Ovest' },
];

export default function ThermalZones({ data, onUpdate }) {
  const handleChange = (field) => (value) => {
    onUpdate({ [field]: value });
  };

  return (
    <>
      <FormField
        label="Confine Superiore"
        type="select"
        value={data.confineSuperiore}
        onChange={handleChange('confineSuperiore')}
        options={CONFINE_SUPERIORE_OPTIONS}
        id="field-confine-superiore"
        helper="Cosa c'è sopra l'unità?"
      />

      <FormField
        label="Confine Inferiore"
        type="select"
        value={data.confineInferiore}
        onChange={handleChange('confineInferiore')}
        options={CONFINE_INFERIORE_OPTIONS}
        id="field-confine-inferiore"
        helper="Cosa c'è sotto l'unità?"
      />

      <FormField
        label="Orientamento"
        type="multi-checkbox"
        value={data.orientamento}
        onChange={handleChange('orientamento')}
        options={ORIENTAMENTO_OPTIONS}
        id="field-orientamento"
        helper="Seleziona tutti gli orientamenti delle pareti esposte"
      />

      <FormField
        label="N° Pareti Esposte"
        type="number"
        value={data.paretiEsposte}
        onChange={handleChange('paretiEsposte')}
        placeholder="es. 2"
        min={1}
        max={4}
        id="field-pareti-esposte"
      />

      <FormField
        label="Note Aggiuntive"
        type="textarea"
        value={data.note}
        onChange={handleChange('note')}
        placeholder="Eventuali note sul contesto termico..."
        id="field-note-termiche"
      />
    </>
  );
}

export function isThermalZonesComplete(data) {
  return !!(
    data.confineSuperiore &&
    data.confineInferiore &&
    data.orientamento?.length > 0 &&
    data.paretiEsposte
  );
}
