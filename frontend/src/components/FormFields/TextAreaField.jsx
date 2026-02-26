// src/components/FormFields/TextAreaField.jsx
import './FormFields.css';

/**
 * TextAreaField - TextArea padronizado
 * 
 * @param {string} label - Label do campo
 * @param {string} value - Valor do textarea
 * @param {function} onChange - Callback que recebe valor
 * @param {number} rows - Número de linhas
 * @param {boolean} required - Campo obrigatório
 * @param {boolean} disabled - Campo desabilitado
 * @param {string} className - Classes CSS adicionais
 * @param {string} placeholder - Placeholder
 */
export default function TextAreaField({ 
  label, 
  value, 
  onChange, 
  rows = 4,
  required = false,
  disabled = false,
  className = '',
  placeholder = '',
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
      <textarea
        className="form-input textarea-input"
        value={value || ''}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}
