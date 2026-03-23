import { SelectField, SearchableCreatableSelectField, DateInputMasked, CurrencyInput } from '../FormFields';

/**
 * EditableDetailField - Campo de detalhe que alterna entre visualização e edição inline
 * Mantém estrutura visual do agrupamento, permitindo edição no mesmo contexto
 */
function EditableDetailField({ 
  label, 
  value, 
  isEditing, 
  type = 'text', // 'text' | 'select' | 'searchable-select' | 'date' | 'currency' | 'textarea'
  onChange,
  options = [], // Para selects
  placeholder = '',
  formatDisplay = (v) => v, // Função para formatar exibição
  required = false,
  className = '',
  rows = 3, // Para textarea
  selectProps = {},
}) {
  return (
    <div className={`detail-item editable-field ${className}`} data-editing={isEditing}>
      <span className="detail-label">
        {label}
        {required && <span style={{color: '#ef4444', marginLeft: '0.25rem'}}>*</span>}
      </span>
      
      {!isEditing ? (
        // MODO VISUALIZAÇÃO
        <span className="detail-value">
          {formatDisplay(value) || '—'}
        </span>
      ) : (
        // MODO EDIÇÃO INLINE
        <div className="detail-input-wrapper">
          {type === 'text' && (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="detail-input"
            />
          )}
          
          {type === 'select' && (
            <div className="detail-select-wrapper">
              <SelectField
                value={value}
                onChange={onChange}
                options={options}
                {...selectProps}
              />
            </div>
          )}

          {type === 'searchable-select' && (
            <div className="detail-select-wrapper">
              <SearchableCreatableSelectField
                value={value}
                onChange={onChange}
                options={options}
                placeholder={placeholder || 'Pesquisar...'}
                {...selectProps}
              />
            </div>
          )}
          
          {type === 'date' && (
            <DateInputMasked
              value={value || ''}
              onChange={onChange}
            />
          )}
          
          {type === 'currency' && (
            <CurrencyInput
              value={value || 0}
              onChange={onChange}
              placeholder={placeholder}
            />
          )}
          
          {type === 'textarea' && (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="detail-textarea"
              rows={rows}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default EditableDetailField;
