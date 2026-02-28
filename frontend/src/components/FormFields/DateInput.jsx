// src/components/FormFields/DateInput.jsx
import { useRef } from 'react';
import './FormFields.css';

/**
 * DateInput - Input de data formatado para PT-BR
 * Versão robusta com melhor controle do datepicker nativo
 * 
 * @param {string} label - Label do campo
 * @param {string} value - Valor da data (formato: YYYY-MM-DD)
 * @param {function} onChange - Callback que recebe valor da data
 * @param {boolean} required - Campo obrigatório
 * @param {boolean} disabled - Campo desabilitado
 * @param {string} className - Classes CSS adicionais
 */
export default function DateInput({ 
  label, 
  value, 
  onChange, 
  required = false,
  disabled = false,
  className = '',
}) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const newValue = e.target.value;
    console.log('DateInput onChange:', newValue);
    
    if (onChange) {
      // Chamar onChange imediatamente
      onChange(newValue);
    }
  };

  const handleFocus = () => {
    console.log('DateInput onFocus');
  };

  const handleBlur = () => {
    console.log('DateInput onBlur:', inputRef.current?.value);
    
    // Garantir que onChange foi chamado com valor atual
    if (inputRef.current?.value && onChange) {
      onChange(inputRef.current.value);
    }
  };

  const handleClick = (e) => {
    // Permitir click no input para abrir datepicker
    e.stopPropagation();
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <div className="date-input-wrapper" onClick={handleClick}>
        <input
          ref={inputRef}
          type="date"
          className="form-input date-input"
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          data-testid="date-input"
        />
      </div>
    </div>
  );
}
