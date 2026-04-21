import FormField from '../ui/FormField.jsx';

const PIANI_OPTIONS = [
  { value: 'seminterrato', label: 'Seminterrato' },
  { value: 'piano-terra', label: 'Piano Terra' },
  { value: '1', label: '1° Piano' },
  { value: '2', label: '2° Piano' },
  { value: '3', label: '3° Piano' },
  { value: '4', label: '4° Piano' },
  { value: '5+', label: '5° Piano o superiore' },
];

const TIPOLOGIA_OPTIONS = [
  { value: 'appartamento', label: 'Appartamento' },
  { value: 'villa', label: 'Villa' },
  { value: 'bifamiliare', label: 'Bifamiliare' },
  { value: 'villetta-a-schiera', label: 'Villetta a Schiera' },
  { value: 'edificio-commerciale', label: 'Edificio Commerciale' },
  { value: 'altro', label: 'Altro' },
];

export default function GeneralInfo({ data, onUpdate }) {
  const handleChange = (field) => (value) => {
    onUpdate({ [field]: value });
  };

  return (
    <>
      <FormField
        label="Data Sopralluogo"
        type="date"
        value={data.dataSopralluogo}
        onChange={handleChange('dataSopralluogo')}
        id="field-data-sopralluogo"
      />

      <FormField
        label="Anno di Costruzione"
        type="number"
        value={data.annoCostruzione}
        onChange={handleChange('annoCostruzione')}
        placeholder="es. 1985"
        min={1800}
        max={2030}
        id="field-anno-costruzione"
      />

      <FormField
        label="Comune"
        type="text"
        value={data.comune}
        onChange={handleChange('comune')}
        placeholder="es. Roma, Milano..."
        id="field-comune"
      />

      <FormField
        label="Piano"
        type="select"
        value={data.piano}
        onChange={handleChange('piano')}
        options={PIANI_OPTIONS}
        id="field-piano"
      />

      <FormField
        label="Tipologia Edificio"
        type="select"
        value={data.tipologiaEdificio}
        onChange={handleChange('tipologiaEdificio')}
        options={TIPOLOGIA_OPTIONS}
        id="field-tipologia"
      />

      <FormField
        label="Dati Catastali"
        type="text"
        value={data.datiCatastali}
        onChange={handleChange('datiCatastali')}
        placeholder="Foglio, Particella, Sub..."
        id="field-catastali"
        helper="Es. Foglio 12, Part. 345, Sub. 6"
      />

      <FormField
        label="Superficie Totale (m²)"
        type="number"
        value={data.superficieTotale}
        onChange={handleChange('superficieTotale')}
        placeholder="es. 85"
        min={1}
        id="field-superficie"
      />
    </>
  );
}

/**
 * Check if all required general info fields are filled.
 */
export function isGeneralInfoComplete(data) {
  return !!(
    data.annoCostruzione &&
    data.comune &&
    data.piano &&
    data.tipologiaEdificio &&
    data.superficieTotale
  );
}
