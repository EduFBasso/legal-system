import { useMemo } from 'react';

/**
 * useUrgencyVisibility Hook - Centraliza lógica de filtragem por urgência
 * 
 * Consolida a configuração e lógica de visibilidade das 3 urgências (URGENTISSIMO, URGENTE, NORMAL)
 * Reduz código duplicado em componentes que precisam filtrar/exibir tarefas por urgência
 * 
 * @param {string|null} selectedUrgency - Urgência selecionada (null = mostrar todas)
 * @returns {object} { URGENCIES, urgencyConfig, shouldShowUrgency }
 *   - URGENCIES: ['URGENTISSIMO', 'URGENTE', 'NORMAL']
 *   - urgencyConfig: { URGENTISSIMO: { className: 'urgentissimo-section' }, ... }
 *   - shouldShowUrgency: (urgency) => boolean - determina se deve renderizar essa urgência
 * 
 * Exemplo de uso:
 * ```jsx
 * const { URGENCIES, urgencyConfig, shouldShowUrgency } = useUrgencyVisibility(selectedUrgency);
 * 
 * {URGENCIES.map(urgency => (
 *   shouldShowUrgency(urgency) && (
 *     <UrgencySection
 *       key={urgency}
 *       urgency={urgency}
 *       sectionClassName={urgencyConfig[urgency].className}
 *       // ... other props
 *     />
 *   )
 * ))}
 * ```
 */
export function useUrgencyVisibility(selectedUrgency) {
  // Lista de urgências (constante, nunca muda)
  const URGENCIES = useMemo(() => ['URGENTISSIMO', 'URGENTE', 'NORMAL'], []);

  // Configuração de cada urgência (CSS classes, labels, etc)
  const urgencyConfig = useMemo(() => ({
    URGENTISSIMO: { className: 'urgentissimo-section' },
    URGENTE: { className: 'urgente-section' },
    NORMAL: { className: 'normal-section' },
  }), []);

  // Determina se uma urgência deve ser exibida baseado no filtro
  const shouldShowUrgency = useMemo(() => (urgency) => 
    selectedUrgency === null || selectedUrgency === urgency
  , [selectedUrgency]);

  return {
    URGENCIES,
    urgencyConfig,
    shouldShowUrgency,
  };
}
