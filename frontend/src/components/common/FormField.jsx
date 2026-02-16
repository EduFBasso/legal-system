// src/components/common/FormField.jsx
/**
 * @fileoverview Campo de formulário genérico VIEW/EDIT
 * Encapsula a lógica de exibição e edição em um único componente
 * 
 * @example
 * <FormField
 *   label="Nome"
 *   value={contact.name}
 *   onChange={(value) => handleChange('name', value)}
 *   readOnly={!isEditing}
 *   required
 * />
 */

import './FormField.css';

/**
 * FormField - Campo genérico VIEW/EDIT
 * @param {Object} props
 * @param {string} props.label - Label do campo
 * @param {string} [props.value=''] - Valor do campo
 * @param {function} props.onChange - Callback ao mudar valor: (newValue) => void
 * @param {'text'|'email'|'tel'|'number'|'textarea'} [props.type='text'] - Tipo de input
 * @param {boolean} [props.readOnly=false] - Se true, exibe em modo leitura (VIEW)
 * @param {boolean} [props.required=false] - Se true, marca como obrigatório
 * @param {string} [props.placeholder=''] - Placeholder do input (modo EDIT)
 * @param {string} [props.emptyText='Não informado'] - Texto quando vazio (modo VIEW)
 * @param {number} [props.maxLength] - Limite de caracteres
 * @param {string} [props.className=''] - Classes CSS adicionais
 * @param {boolean} [props.disabled=false] - Desabilita o campo
 * @param {number} [props.rows=4] - Número de linhas (se type='textarea')
 */
export default function FormField({
  label,
  value = '',
  onChange,
  type = 'text',
  readOnly = false,
  required = false,
  placeholder = '',
  emptyText = 'Não informado',
  maxLength,
  className = '',
  disabled = false,
  rows = 4,
}) {
  const hasValue = value && value.toString().trim() !== '';
  
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
        type === 'textarea' ? (
          <textarea
            className="form-field-input form-field-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            rows={rows}
          />
        ) : (
          <input
            type={type}
            className="form-field-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
          />
        )
      )}
    </div>
  );
}
