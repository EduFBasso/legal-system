// src/components/FormFields/CurrencyInput.jsx
import { useState, useEffect, useRef } from 'react';
import './FormFields.css';

/**
 * CurrencyInput - Input com máscara de moeda brasileira
 * 
 * @param {string} label - Label do campo
 * @param {number|string} value - Valor numérico ou string formatada
 * @param {function} onChange - Callback que recebe valor numérico (ex: 1234.56)
 * @param {string} placeholder - Placeholder (ex: "1.000,00")
 * @param {boolean} required - Campo obrigatório
 * @param {boolean} disabled - Campo desabilitado
 * @param {string} className - Classes CSS adicionais
 */
export default function CurrencyInput({ 
  label, 
  value, 
  onChange, 
  placeholder = '0,00',
  required = false,
  disabled = false,
  className = '',
}) {
  const [isFocused, setIsFocused] = useState(false);
  const prevValueRef = useRef(value);

  // Converter valor numérico para string formatada
  const formatCurrency = (numValue) => {
    if (!numValue && numValue !== 0) return '';
    const num = typeof numValue === 'string' ? parseFloat(numValue.replace(/\D/g, '')) / 100 : numValue;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Converter string formatada para número
  const parseCurrency = (strValue) => {
    if (!strValue) return 0;
    return parseFloat(strValue.replace(/\D/g, '')) / 100 || 0;
  };

  // Inicializar e sincronizar display com value externo
  const [displayValue, setDisplayValue] = useState(() => formatCurrency(value));

  // Sincronizar display com value externo quando NÃO está focado
  useEffect(() => {
    if (!isFocused && prevValueRef.current !== value) {
      const timerId = window.setTimeout(() => {
        setDisplayValue(formatCurrency(value));
      }, 0);
      prevValueRef.current = value;

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Ao focar, garante que mostra o valor externo
    setDisplayValue(formatCurrency(value));
  };

  const handleChange = (e) => {
    const input = e.target.value;
    
    // Permitir apenas dígitos
    const digitsOnly = input.replace(/\D/g, '');
    
    // Formatar para exibição
    const formatted = formatCurrency(parseCurrency(digitsOnly));
    setDisplayValue(formatted);

    // Chamar onChange com valor numérico
    if (onChange) {
      onChange(parseCurrency(digitsOnly));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Garantir formato correto ao sair do campo
    const finalValue = formatCurrency(parseCurrency(displayValue));
    setDisplayValue(finalValue);
  };

  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}
      <div className="currency-input-wrapper">
        <span className="currency-symbol">R$</span>
        <input
          type="text"
          inputMode="decimal"
          className="form-input currency-input"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  );
}
