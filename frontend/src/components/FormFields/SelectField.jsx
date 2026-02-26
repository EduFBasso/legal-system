// src/components/FormFields/SelectField.jsx
import './FormFields.css';

/**
 * SelectField - Campo de seleção (dropdown) padronizado
 * 
 * @param {string} label - Label do campo
 * @param {string|number} value - Valor selecionado
 * @param {function} onChange - Callback que recebe valor selecionado
 * @param {Array} options - Array de opções [{value, label}] ou array de strings
 * @param {boolean} required - Campo obrigatório
 * @param {boolean} disabled - Campo desabilitado
 * @param {string} className - Classes CSS adicionais
 * @param {string} placeholder - Placeholder (primeira opção)
 */
export default function SelectField({ 
  label, 
  value, 
  onChange, 
  options = [],
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Selecione...',
}) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Normalizar options: aceita array de strings ou objetos {value, label}
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <select
        className="form-input select-input"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {normalizedOptions.map((option, index) => (
          <option key={option.value || index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
