import FormField from '../ui/FormField.jsx';

const VETRI_OPTIONS = [
  { value: 'singolo', label: 'Vetro Singolo' },
  { value: 'doppio', label: 'Doppio Vetro' },
  { value: 'triplo', label: 'Triplo Vetro' },
  { value: 'basso-emissivo', label: 'Basso Emissivo' },
];

const TELAIO_OPTIONS = [
  { value: 'legno', label: 'Legno' },
  { value: 'alluminio', label: 'Alluminio' },
  { value: 'alluminio-taglio-termico', label: 'Alluminio Taglio Termico' },
  { value: 'pvc', label: 'PVC' },
  { value: 'misto', label: 'Misto' },
];

const ISOLAMENTO_OPTIONS = [
  { value: 'assente', label: 'Assente' },
  { value: 'interno', label: 'Interno' },
  { value: 'esterno', label: 'Esterno (Cappotto)' },
  { value: 'intercapedine', label: 'Intercapedine' },
];

const TETTO_OPTIONS = [
  { value: 'tegole', label: 'Tegole' },
  { value: 'lamiera', label: 'Lamiera' },
  { value: 'terrazza', label: 'Terrazza Piana' },
  { value: 'legno', label: 'Legno' },
  { value: 'altro', label: 'Altro' },
];

export default function BuildingEnvelope({ data, onUpdate }) {
  const handleChange = (field) => (value) => {
    onUpdate({ [field]: value });
    // Reset insulation thickness if insulation is set to "Assente"
    if (field === 'isolamento' && value === 'assente') {
      onUpdate({ [field]: value, spessoreIsolante: '' });
    }
  };

  const showInsulationThickness = data.isolamento && data.isolamento !== 'assente';

  return (
    <>
      <FormField
        label="Tipo Vetri"
        type="select"
        value={data.tipoVetri}
        onChange={handleChange('tipoVetri')}
        options={VETRI_OPTIONS}
        id="field-tipo-vetri"
      />

      <FormField
        label="Telaio Finestre"
        type="select"
        value={data.telaio}
        onChange={handleChange('telaio')}
        options={TELAIO_OPTIONS}
        id="field-telaio"
      />

      <FormField
        label="Spessore Mura (cm)"
        type="number"
        value={data.spessoreMura}
        onChange={handleChange('spessoreMura')}
        placeholder="es. 30"
        min={5}
        max={120}
        id="field-spessore-mura"
      />

      <FormField
        label="Isolamento Termico"
        type="select"
        value={data.isolamento}
        onChange={handleChange('isolamento')}
        options={ISOLAMENTO_OPTIONS}
        id="field-isolamento"
      />

      {showInsulationThickness && (
        <FormField
          label="Spessore Isolante (cm)"
          type="number"
          value={data.spessoreIsolante}
          onChange={handleChange('spessoreIsolante')}
          placeholder="es. 10"
          min={1}
          max={30}
          id="field-spessore-isolante"
          helper="Spessore dello strato isolante"
        />
      )}

      <FormField
        label="Tipo Copertura / Tetto"
        type="select"
        value={data.tipoTetto}
        onChange={handleChange('tipoTetto')}
        options={TETTO_OPTIONS}
        id="field-tipo-tetto"
      />
    </>
  );
}

export function isBuildingEnvelopeComplete(data) {
  const base = !!(
    data.tipoVetri &&
    data.telaio &&
    data.spessoreMura &&
    data.isolamento &&
    data.tipoTetto
  );
  if (data.isolamento && data.isolamento !== 'assente') {
    return base && !!data.spessoreIsolante;
  }
  return base;
}
