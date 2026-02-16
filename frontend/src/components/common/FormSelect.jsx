// src/components/common/FormSelect.jsx
/**
 * @fileoverview Select de formulário VIEW/EDIT
 * 
 * @example
 * <FormSelect
 *   label="Tipo de Contato"
 *   value={contact.contact_type}
 *   onChange={(value) => handleChange('contact_type', value)}
 *   options={[
 *     { value: 'CLIENT', label: 'Cliente' },
 *     { value: 'OPPOSING', label: 'Parte Contrária' }
 *   ]}
 *   readOnly={!isEditing}
 *   displayValue={contact.contact_type_display}
 * />
 */

import './FormField.css';

/**
 * FormSelect - Select genérico VIEW/EDIT
 * @param {Object} props
 * @param {string} props.label - Label do campo
 * @param {string} props.value - Valor selecionado
 * @param {function} props.onChange - Callback: (newValue) => void
 * @param {Array<{value: string, label: string}>} props.options - Opções do select
 * @param {boolean} [props.readOnly=false] - Se true, exibe em modo leitura
 * @param {string} [props.displayValue] - Valor para exibir em modo VIEW (ex: "Cliente" em vez de "CLIENT")
 * @param {boolean} [props.required=false] - Campo obrigatório
 * @param {string} [props.className=''] - Classes CSS adicionais
 * @param {boolean} [props.disabled=false] - Desabilita o campo
 */
export default function FormSelect({
  label,
  value,
  onChange,
  options,
  readOnly = false,
  displayValue,
  required = false,
  className = '',
  disabled = false,
}) {
  return (
    <div className={`form-field ${className}`}>
      <label className="form-field-label">
        {label}
        {required && !readOnly && <span className="field-required">*</span>}
      </label>
      
      {readOnly ? (
        // VIEW mode
        <span className="form-field-value badge-type">
          {displayValue || value}
        </span>
      ) : (
        // EDIT mode
        <select
          className="form-field-input form-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
