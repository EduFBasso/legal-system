// src/components/common/FormMaskedField.jsx
/**
 * @fileoverview Campo com máscara (CPF, CNPJ, telefone, CEP, etc)
 * 
 * @example
 * <FormMaskedField
 *   label="CPF"
 *   value={contact.document}
 *   onChange={(value) => handleChange('document', value)}
 *   mask={maskCPF}
 *   readOnly={!isEditing}
 *   placeholder="000.000.000-00"
 * />
 */

import './FormField.css';

/**
 * FormMaskedField - Campo com máscara VIEW/EDIT
 * @param {Object} props
 * @param {string} props.label - Label do campo
 * @param {string} [props.value=''] - Valor do campo
 * @param {function} props.onChange - Callback: (newValue) => void
 * @param {function} props.mask - Função de máscara do utils/masks.js
 * @param {boolean} [props.readOnly=false] - Se true, exibe em modo leitura
 * @param {boolean} [props.required=false] - Campo obrigatório
 * @param {string} [props.placeholder=''] - Placeholder do input
 * @param {string} [props.emptyText='Não informado'] - Texto quando vazio (VIEW)
 * @param {number} [props.maxLength] - Limite de caracteres
 * @param {string} [props.className=''] - Classes CSS adicionais
 * @param {boolean} [props.disabled=false] - Desabilita o campo
 */
export default function FormMaskedField({
  label,
  value = '',
  onChange,
  mask,
  readOnly = false,
  required = false,
  placeholder = '',
  emptyText = 'Não informado',
  maxLength,
  className = '',
  disabled = false,
}) {
  const hasValue = value && value.toString().trim() !== '';
  
  const handleChange = (e) => {
    const rawValue = e.target.value;
    const maskedValue = mask ? mask(rawValue) : rawValue;
    onChange(maskedValue);
  };
  
  return (
    <div className={`form-field ${className}`}>
      <label className="form-field-label">
        {label}
        {required && !readOnly && <span className="field-required">*</span>}
      </label>
      
      {readOnly ? (
        // VIEW mode
        <span className={`form-field-value ${!hasValue ? 'field-empty' : ''}`}>
          {hasValue ? value : emptyText}
        </span>
      ) : (
        // EDIT mode
        <input
          type="text"
          className="form-field-input"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
        />
      )}
    </div>
  );
}
