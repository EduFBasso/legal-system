import { useEffect, useRef } from 'react';

/**
 * useFinanceiroAutoSaveGuards
 * Garante que o rascunho do Financeiro seja salvo ao sair da aba
 * ou ao ocultar/fechar a página.
 *
 * Mantém o comportamento atual do CaseDetailPage, mas em um hook dedicado.
 *
 * @param {Object} params
 * @param {number|string|null|undefined} params.caseId
 * @param {string} params.activeSection
 * @param {boolean} params.caseSaving
 * @param {() => Promise<void>} params.forceSaveFinancial
 */
export function useFinanceiroAutoSaveGuards({ caseId, activeSection, caseSaving, forceSaveFinancial }) {
  const previousSectionRef = useRef(activeSection);

  // Ao sair do Financeiro, força salvar.
  useEffect(() => {
    const previousSection = previousSectionRef.current;
    const currentSection = activeSection;

    if (caseId && previousSection === 'financeiro' && currentSection !== 'financeiro' && !caseSaving) {
      forceSaveFinancial().catch((error) => {
        console.error('Erro ao forçar auto-save ao sair da aba Financeiro:', error);
      });
    }

    previousSectionRef.current = currentSection;
  }, [caseId, activeSection, caseSaving, forceSaveFinancial]);

  // Se a página ficar oculta/encerrar, força salvar.
  useEffect(() => {
    if (!caseId) return;

    const flushFinancialDraft = () => {
      if (activeSection !== 'financeiro' || caseSaving) return;

      forceSaveFinancial().catch((error) => {
        console.error('Erro ao forçar auto-save com página oculta:', error);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushFinancialDraft();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flushFinancialDraft);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flushFinancialDraft);
    };
  }, [caseId, activeSection, caseSaving, forceSaveFinancial]);
}

export default useFinanceiroAutoSaveGuards;
