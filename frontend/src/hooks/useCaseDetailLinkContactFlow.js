import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import contactsAPI from '../services/api';

/**
 * useCaseDetailLinkContactFlow
 * Implementa o fluxo de deep-link para vincular um contato ao processo via query params:
 * `?action=link&contactId=<id>`.
 *
 * Regras (mantém o comportamento atual do CaseDetailPage):
 * - Garante que a aba "Partes" esteja ativa antes de abrir o modal.
 * - Aguarda carregamento das partes para checar duplicidade.
 * - Busca o contato por ID (sem depender de lista já carregada).
 * - Limpa os query params ao final (`action`, `contactId`).
 *
 * Observação: possui dedupe por requestId para evitar efeitos duplicados no dev (StrictMode).
 *
 * @param {Object} params
 * @param {number|string|null|undefined} params.caseId
 * @param {string} params.activeSection
 * @param {(section: string) => void} params.setActiveSection
 * @param {boolean} params.loadingParties
 * @param {Array} params.parties
 * @param {(contact: any) => void} params.setSelectedContact
 * @param {(open: boolean) => void} params.setShowAddPartyModal
 * @param {(msg: string, type?: string) => void} params.showToast
 * @param {() => void} params.clearLinkQueryParams
 */
export function useCaseDetailLinkContactFlow({
  caseId,
  activeSection,
  setActiveSection,
  loadingParties,
  parties,
  setSelectedContact,
  setShowAddPartyModal,
  showToast,
  clearLinkQueryParams,
}) {
  const location = useLocation();
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!caseId) return;

    const params = new URLSearchParams(location.search);
    const linkAction = params.get('action');
    const rawContactId = params.get('contactId');
    const linkContactId = Number.parseInt(rawContactId || '', 10);

    if (linkAction !== 'link' || !Number.isInteger(linkContactId) || linkContactId <= 0) {
      return;
    }

    // Passo 1: garantir que a aba Partes está ativa
    if (activeSection !== 'parties') {
      setActiveSection('parties');
      return; // re-executa quando activeSection mudar
    }

    // Passo 2: aguardar carregamento das partes (necessário para checar duplicidade)
    if (loadingParties) return;

    const requestId = ++requestIdRef.current;

    const run = async () => {
      const alreadyLinked = Array.isArray(parties)
        ? parties.some((party) => party.contact === linkContactId)
        : false;

      if (alreadyLinked) {
        showToast?.('Contato já está vinculado a este processo.', 'warning');
        clearLinkQueryParams?.();
        return;
      }

      try {
        const contact = await contactsAPI.getById(linkContactId);
        if (requestId !== requestIdRef.current) return;

        setSelectedContact?.(contact);
        setShowAddPartyModal?.(true);
      } catch {
        if (requestId !== requestIdRef.current) return;
        showToast?.('Contato não encontrado para vinculação.', 'error');
      } finally {
        if (requestId === requestIdRef.current) {
          clearLinkQueryParams?.();
        }
      }
    };

    run();
  }, [
    caseId,
    location.search,
    activeSection,
    setActiveSection,
    loadingParties,
    parties,
    setSelectedContact,
    setShowAddPartyModal,
    showToast,
    clearLinkQueryParams,
  ]);
}

export default useCaseDetailLinkContactFlow;
