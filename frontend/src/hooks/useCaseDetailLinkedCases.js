import { useEffect, useState } from 'react';

/**
 * useCaseDetailLinkedCases
 * Carrega processos relacionados ao mesmo cliente principal (para a aba Vínculos).
 *
 * Mantém a lógica isolada do CaseDetailPage para reduzir acoplamento e facilitar manutenção.
 *
 * @param {Object} params
 * @param {number|null|undefined} params.clientId - ID do cliente principal do processo atual
 * @param {number|null|undefined} params.currentCaseId - ID do processo atual
 * @returns {{ linkedCases: Array, loadingLinkedCases: boolean }}
 */
export function useCaseDetailLinkedCases({ clientId, currentCaseId }) {
  const [linkedCases, setLinkedCases] = useState([]);
  const [loadingLinkedCases, setLoadingLinkedCases] = useState(false);

  useEffect(() => {
    const loadLinkedCases = async () => {
      if (!clientId || !currentCaseId) {
        setLinkedCases([]);
        return;
      }

      setLoadingLinkedCases(true);
      try {
        const { default: casesService } = await import('../services/casesService');
        const allForClient = await casesService.getAll({
          cliente_principal: clientId,
          ordering: '-data_ultima_movimentacao',
        });

        const related = Array.isArray(allForClient)
          ? allForClient.filter((c) => Number(c.id) !== Number(currentCaseId))
          : [];

        setLinkedCases(related);
      } catch {
        setLinkedCases([]);
      } finally {
        setLoadingLinkedCases(false);
      }
    };

    loadLinkedCases();
  }, [clientId, currentCaseId]);

  return { linkedCases, loadingLinkedCases };
}

export default useCaseDetailLinkedCases;
