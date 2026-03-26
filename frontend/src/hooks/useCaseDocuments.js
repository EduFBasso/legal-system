import { useCallback, useEffect, useState } from 'react';
import caseDocumentsService from '../services/caseDocumentsService';

/**
 * useCaseDocuments
 * Centraliza o estado e ações de documentos do processo (listar, upload, excluir).
 *
 * Importante: este hook NÃO muda UX — mantém a regra atual de auto-carregar
 * ao entrar na aba Documentos (condicionado por systemSettings).
 *
 * @param {Object} params
 * @param {number|string|null|undefined} params.caseId - ID do processo
 * @param {string} params.activeSection - Aba ativa do CaseDetail
 * @param {Object|null} params.systemSettings - Configurações do sistema
 * @param {(msg: string, type?: string) => void} params.showToast - Notificação
 * @returns {{documentos: Array, loadingDocumentos: boolean, uploadingDocumento: boolean, loadDocumentos: Function, uploadDocumento: Function, deleteDocumento: Function}}
 */
export function useCaseDocuments({ caseId, activeSection, systemSettings, showToast }) {
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [uploadingDocumento, setUploadingDocumento] = useState(false);

  const loadDocumentos = useCallback(async () => {
    if (!caseId) {
      setDocumentos([]);
      return;
    }

    setLoadingDocumentos(true);
    try {
      const docs = await caseDocumentsService.getByCase(caseId);
      setDocumentos(Array.isArray(docs) ? docs : []);
    } catch {
      showToast?.('Erro ao carregar documentos do processo', 'error');
    } finally {
      setLoadingDocumentos(false);
    }
  }, [caseId, showToast]);

  const uploadDocumento = useCallback(async (file) => {
    if (!caseId) {
      showToast?.('Salve o processo antes de anexar documentos', 'warning');
      return;
    }

    setUploadingDocumento(true);
    try {
      await caseDocumentsService.upload({ caseId, file });
      showToast?.('Documento enviado com sucesso', 'success');
      await loadDocumentos();
    } catch (error) {
      showToast?.(error?.message || 'Erro ao enviar documento', 'error');
    } finally {
      setUploadingDocumento(false);
    }
  }, [caseId, loadDocumentos, showToast]);

  const deleteDocumento = useCallback(async (documentId) => {
    try {
      await caseDocumentsService.remove(documentId);
      showToast?.('Documento excluido com sucesso', 'success');
      await loadDocumentos();
    } catch {
      showToast?.('Erro ao excluir documento', 'error');
    }
  }, [loadDocumentos, showToast]);

  useEffect(() => {
    const shouldAutoLoadDocuments = systemSettings?.AUTO_LOAD_DOCUMENTS_ON_CASE !== false;

    if (activeSection === 'documentos' && shouldAutoLoadDocuments && caseId) {
      loadDocumentos();
    }
  }, [activeSection, caseId, loadDocumentos, systemSettings]);

  return {
    documentos,
    loadingDocumentos,
    uploadingDocumento,
    loadDocumentos,
    uploadDocumento,
    deleteDocumento,
  };
}

export default useCaseDocuments;
