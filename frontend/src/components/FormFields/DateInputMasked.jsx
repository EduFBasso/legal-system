import { useState, useRef, useEffect } from 'react';
import './FormFields.css';

/**
 * DateInputMasked - Input de data com máscara manual (DD/MM/YYYY)
 * Alternativa ao datepicker nativo que pode ter bugs em alguns navegadores
 */
export default function DateInputMasked({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
}) {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState('');

  // Sincronizar displayValue com value prop
  useEffect(() => {
    setDisplayValue(formatForDisplay(value));
  }, [value]);

  // Converter YYYY-MM-DD para DD/MM/YYYY para exibição
  const formatForDisplay = (isoDate) => {
    if (!isoDate || isoDate.length !== 10) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Converter DD/MM/YYYY para YYYY-MM-DD para onChange
  const formatForApi = (displayDate) => {
    if (!displayDate || displayDate.length !== 10) return '';
    const [day, month, year] = displayDate.split('/');
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) {
      return '';
    }

    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    let input = e.target.value;

    // Remover caracteres não-dígitos
    input = input.replace(/\D/g, '');

    // Limitar a 8 dígitos
    input = input.substring(0, 8);

    // Aplicar máscara DD/MM/YYYY
    let formatted = '';
    if (input.length > 0) {
      formatted = input.substring(0, 2);
      if (input.length > 2) {
        formatted += '/' + input.substring(2, 4);
      }
      if (input.length > 4) {
        formatted += '/' + input.substring(4, 8);
      }
    }

    // Atualizar display imediatamente
    setDisplayValue(formatted);

    // Se tem 10 caracteres (DD/MM/YYYY completo), converter e enviar
    if (formatted.length === 10) {
      const isoDate = formatForApi(formatted);
      if (isoDate && onChange) {
        onChange(isoDate);
      }
    }
  };

  const handleBlur = (e) => {
    const currentDisplay = displayValue;

    // Se tem data, tentar converter
    if (currentDisplay.length === 10) {
      const isoDate = formatForApi(currentDisplay);
      if (isoDate && onChange) {
        onChange(isoDate);
      }
    } else if (currentDisplay.length > 0) {
      // Se tem entrada parcial, limpar na saída
      setDisplayValue('');
    }
  };

  const handleKeyDown = (e) => {
    // Permitir tabs, backspace, delete, arrows, etc
    const allowedKeys = ['Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key)) {
      return;
    }

    // Bloquear tudo que não seja dígito ou teclas especiais
    if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
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
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className="form-input date-input-masked"
        placeholder="DD/MM/AAAA"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
        maxLength="10"
        data-testid="date-input-masked"
      />
    </div>
  );
}
