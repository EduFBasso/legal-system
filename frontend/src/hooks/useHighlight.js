import { useState, useEffect, useRef } from 'react';

/**
 * Hook customizado para gerenciar destaque visual (brilho pulsante) em componentes
 * 
 * @param {Object} options - Configurações do highlight
 * @param {number} options.duration - Duração em ms do highlight (0 = permanente, padrão: 0)
 * @param {boolean} options.initialState - Estado inicial (padrão: false)
 * @param {string} options.className - Nome da classe CSS (padrão: 'pulse-active')
 * 
 * @returns {Object} Hook com estado e controles
 * @returns {boolean} isHighlighted - Se está destacado no momento
 * @returns {Function} activate - Ativa o destaque (com duração opcional)
 * @returns {Function} deactivate - Desativa o destaque
 * @returns {Function} toggle - Alterna o destaque
 * @returns {string} className - Classe CSS a ser aplicada
 * 
 * @example
 * // Uso básico - permanente até desativar manualmente
 * const { isHighlighted, activate, deactivate, className } = useHighlight();
 * <div className={isHighlighted ? className : ''}>...</div>
 * 
 * @example
 * // Com duração automática de 5 segundos
 * const highlight = useHighlight({ duration: 5000 });
 * highlight.activate(); // Desativa automaticamente após 5s
 * <div className={highlight.className}>...</div>
 * 
 * @example
 * // Com classe CSS customizada
 * const highlight = useHighlight({ className: 'custom-pulse' });
 * <div className={highlight.isHighlighted ? highlight.className : ''}>...</div>
 */
export function useHighlight({ 
  duration = 0, 
  initialState = false,
  className = 'pulse-active'
} = {}) {
  const [isHighlighted, setIsHighlighted] = useState(initialState);
  const timerRef = useRef(null);

  // Limpar timer ao desmontar componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  /**
   * Ativa o destaque
   * @param {number} customDuration - Duração customizada (opcional)
   */
  const activate = (customDuration) => {
    // Limpar timer anterior se existir
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsHighlighted(true);

    // Se tiver duração definida, desativar automaticamente
    const effectiveDuration = customDuration ?? duration;
    if (effectiveDuration > 0) {
      timerRef.current = setTimeout(() => {
        setIsHighlighted(false);
        timerRef.current = null;
      }, effectiveDuration);
    }
  };

  /**
   * Desativa o destaque
   */
  const deactivate = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHighlighted(false);
  };

  /**
   * Alterna o estado do destaque
   */
  const toggle = () => {
    if (isHighlighted) {
      deactivate();
    } else {
      activate();
    }
  };

  return {
    isHighlighted,
    activate,
    deactivate,
    toggle,
    className: isHighlighted ? className : ''
  };
}

/**
 * Versão simplificada que retorna apenas a classe CSS
 * Útil para casos mais simples onde só precisa saber se está ativo ou não
 * 
 * @example
 * const highlightClass = useHighlightClass(shouldHighlight);
 * <div className={`card ${highlightClass}`}>...</div>
 */
export function useHighlightClass(condition, className = 'pulse-active') {
  return condition ? className : '';
}

export default useHighlight;
