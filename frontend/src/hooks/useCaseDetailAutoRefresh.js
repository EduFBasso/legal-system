import { useEffect, useRef } from 'react';

/**
 * useCaseDetailAutoRefresh
 * Orquestra recarregamentos ao entrar em certas abas e ao recuperar foco/visibilidade.
 *
 * Motivação:
 * - Reduzir o tamanho/complexidade do CaseDetailPage.jsx
 * - Manter o comportamento atual de "refrescar quando voltar foco" sem espalhar listeners
 *
 * @param {Object} params
 * @param {number|string|null|undefined} params.caseId
 * @param {string} params.activeSection
 * @param {boolean} params.caseSaving
 * @param {boolean} params.autoSavingFinancial
 * @param {() => void} params.loadCaseData
 * @param {() => void} params.loadMovimentacoes
 * @param {() => void} params.loadTasks
 */
export function useCaseDetailAutoRefresh({
  caseId,
  activeSection,
  caseSaving,
  autoSavingFinancial,
  loadCaseData,
  loadMovimentacoes,
  loadTasks,
}) {
  const lastFinanceiroRefreshStartedAtRef = useRef(0);

  const shouldTrace = () => {
    try {
      return String(window?.localStorage?.getItem('debug_flicker') || '') === '1';
    } catch {
      return false;
    }
  };

  const trace = (...args) => {
    if (!shouldTrace()) return;
    const ts = new Date().toISOString();
    console.log(`[CaseDetailFlickerTrace ${ts}]`, ...args);
  };

  // Recarrega movimentações/tarefas ao entrar na aba.
  useEffect(() => {
    if (activeSection !== 'movimentacoes' || !caseId) return;

    loadMovimentacoes();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, caseId]);

  // Recarrega dados base do caso ao entrar em Financeiro.
  useEffect(() => {
    if (activeSection !== 'financeiro' || !caseId) return;
    if (caseSaving || autoSavingFinancial) return;

    trace('financeiro:enter -> loadCaseData');
    lastFinanceiroRefreshStartedAtRef.current = Date.now();
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, caseId]);

  // Quando Financeiro estiver aberto, recarrega ao voltar foco/visibilidade.
  useEffect(() => {
    if (activeSection !== 'financeiro' || !caseId) return;

    const shouldSkipRefresh = (reason) => {
      const now = Date.now();
      const elapsed = now - (lastFinanceiroRefreshStartedAtRef.current || 0);
      if (elapsed < 1200) {
        trace(`financeiro:${reason} -> skip (elapsed=${elapsed}ms)`);
        return true;
      }
      return false;
    };

    const refreshFinanceiroData = (reason) => {
      if (caseSaving || autoSavingFinancial) return;
      if (shouldSkipRefresh(reason)) return;
      lastFinanceiroRefreshStartedAtRef.current = Date.now();
      trace(`financeiro:${reason} -> loadCaseData`);
      loadCaseData();
    };

    const handleFocus = () => {
      refreshFinanceiroData('focus');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFinanceiroData('visible');
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, caseId, caseSaving, autoSavingFinancial]);

  // Quando Movimentações estiver aberta, recarrega ao voltar foco/visibilidade.
  useEffect(() => {
    if (activeSection !== 'movimentacoes' || !caseId) return;

    const refreshMovementsAndTasks = () => {
      loadMovimentacoes();
      loadTasks();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshMovementsAndTasks();
      }
    };

    window.addEventListener('focus', refreshMovementsAndTasks);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshMovementsAndTasks);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, caseId]);
}

export default useCaseDetailAutoRefresh;
