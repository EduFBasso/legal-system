// src/components/FormFields/DateInput.jsx
import './FormFields.css';

/**
 * DateInput - Input de data formatado para PT-BR
 * 
 * @param {string} label - Label do campo
 * @param {string} value - Valor da data (formato: YYYY-MM-DD ou DD/MM/YYYY)
 * @param {function} onChange - Callback que recebe valor da data
 * @param {boolean} required - Campo obrigatório
 * @param {boolean} disabled - Campo desabilitado
 * @param {string} className - Classes CSS adicionais
 * @param {string} placeholder - Placeholder
 */
export default function DateInput({ 
  label, 
  value, 
  onChange, 
  required = false,
  disabled = false,
  className = '',
  placeholder = 'DD/MM/AAAA',
}) {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <input
        type="date"
        className="form-input date-input"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}
