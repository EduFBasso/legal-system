import { useEffect, useRef, useState } from 'react';

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
  const loadRunIdRef = useRef(0);

  useEffect(() => {
    let isActive = true;
    const runId = (loadRunIdRef.current += 1);
    let loadingUiTimer = null;

    const loadLinkedCases = async () => {
      if (!clientId || !currentCaseId) {
        setLinkedCases([]);
        setLoadingLinkedCases(false);
        return;
      }

      // Anti-flash: só mostra "Carregando" se passar de um limiar.
      setLoadingLinkedCases(false);
      loadingUiTimer = window.setTimeout(() => {
        if (!isActive) return;
        if (runId !== loadRunIdRef.current) return;
        setLoadingLinkedCases(true);
      }, 150);

      try {
        const { default: casesService } = await import('../services/casesService');
        const allForClient = await casesService.getAll({
          cliente_principal: clientId,
          ordering: '-data_ultima_movimentacao',
        });

        if (!isActive) return;
        if (runId !== loadRunIdRef.current) return;

        const related = Array.isArray(allForClient)
          ? allForClient.filter((c) => Number(c.id) !== Number(currentCaseId))
          : [];

        setLinkedCases(related);
      } catch {
        if (!isActive) return;
        if (runId !== loadRunIdRef.current) return;
        setLinkedCases([]);
      } finally {
        if (loadingUiTimer) {
          window.clearTimeout(loadingUiTimer);
        }

        const shouldApply = isActive && runId === loadRunIdRef.current;
        if (shouldApply) {
          setLoadingLinkedCases(false);
        }
      }
    };

    loadLinkedCases();

    return () => {
      isActive = false;
      if (loadingUiTimer) {
        window.clearTimeout(loadingUiTimer);
      }
    };
  }, [clientId, currentCaseId]);

  return { linkedCases, loadingLinkedCases };
}

export default useCaseDetailLinkedCases;
