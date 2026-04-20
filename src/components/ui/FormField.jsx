/**
 * Reusable form field wrapper with variants: text, number, select, textarea, multi-checkbox.
 */
export default function FormField({
  label,
  type = 'text',
  value,
  onChange,
  options,       // for select and multi-checkbox: [{ value, label }]
  placeholder,
  helper,
  required,
  min,
  max,
  id,
  hidden = false,
}) {
  if (hidden) return null;

  const fieldId = id || `field-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  // Multi-checkbox
  if (type === 'multi-checkbox') {
    const selectedValues = Array.isArray(value) ? value : [];
    const toggleValue = (optValue) => {
      const newValues = selectedValues.includes(optValue)
        ? selectedValues.filter((v) => v !== optValue)
        : [...selectedValues, optValue];
      onChange(newValues);
    };

    return (
      <div id={fieldId}>
        <label className="form-label">{label}{required && <span className="text-red-400 ml-1">*</span>}</label>
        <div className="grid grid-cols-2 gap-2">
          {options?.map((opt) => {
            const isChecked = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleValue(opt.value)}
                className={`min-h-[48px] px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 text-left ${
                  isChecked
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                id={`${fieldId}-${opt.value}`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
        {helper && <p className="text-xs text-gray-400 mt-1.5">{helper}</p>}
      </div>
    );
  }

  // Select
  if (type === 'select') {
    return (
      <div id={fieldId}>
        <label className="form-label" htmlFor={`${fieldId}-input`}>
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <select
          id={`${fieldId}-input`}
          className="form-input cursor-pointer"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Seleziona...
          </option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {helper && <p className="text-xs text-gray-400 mt-1.5">{helper}</p>}
      </div>
    );
  }

  // Textarea
  if (type === 'textarea') {
    return (
      <div id={fieldId}>
        <label className="form-label" htmlFor={`${fieldId}-input`}>
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <textarea
          id={`${fieldId}-input`}
          className="form-input min-h-[100px] resize-none"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
        {helper && <p className="text-xs text-gray-400 mt-1.5">{helper}</p>}
      </div>
    );
  }

  // Text / Number
  return (
    <div id={fieldId}>
      <label className="form-label" htmlFor={`${fieldId}-input`}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        id={`${fieldId}-input`}
        type={type}
        className="form-input"
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? e.target.value : e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        inputMode={type === 'number' ? 'numeric' : undefined}
      />
      {helper && <p className="text-xs text-gray-400 mt-1.5">{helper}</p>}
    </div>
  );
}
