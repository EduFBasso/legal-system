import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '../utils/formatters';
import useAutoSave from '../hooks/useAutoSave';
import systemSettingsService from '../services/systemSettingsService';
import contactsAPI from '../services/api';
import caseDocumentsService from '../services/caseDocumentsService';
import CaseDetailNavbar from '../components/CaseDetail/CaseDetailNavbar';
import CaseDetailTabContent from '../components/CaseDetail/CaseDetailTabContent';
import CaseDetailModals from '../components/CaseDetail/CaseDetailModals';

import { formatCnj } from '../utils/cnj';
import { openPublicationDetailsWindow } from '../utils/publicationNavigation';

// Custom hooks para separação de responsabilidades
import { useModalsAndNotifications } from '../hooks/useModalsAndNotifications';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useCaseCore } from '../hooks/useCaseCore';
import { usePartyManagement } from '../hooks/usePartyManagement';
import { useMovementsAndTasks } from '../hooks/useMovementsAndTasks';
import { usePublicationsForCase } from '../hooks/usePublicationsForCase';
import { useFinancialData } from '../hooks/useFinancialData';

import './CaseDetailPage.css';

/**
 * CaseDetailPage - Página dedicada para detalhes completos do processo
 * 
 * Abre em nova aba do navegador, aproveitando toda largura da tela
 * sem sidebar. Permite edição inline de informações do processo.
 * 
 * Modularizado com 7 custom hooks:
 * - useCaseCore: Dados e CRUD do caso
 * - usePartyManagement: Partes do processo
 * - useMovementsAndTasks: Movimentações e tarefas
 * - useFinancialData: Dados financeiros
 * - usePublicationsForCase: Publicações
 * - useModalsAndNotifications: Modais e notificações (Toast)
 * - usePageNavigation: Navegação de abas e URL params
 */
function CaseDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const publicationId = new URLSearchParams(location.search).get('pub_id');
  const linkAction = new URLSearchParams(location.search).get('action');
  const linkContactId = parseInt(new URLSearchParams(location.search).get('contactId') || '', 10);
  const isReadOnly = (() => {
    const value = (new URLSearchParams(location.search).get('readonly') || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  })();

  // System settings
  const [systemSettings, setSystemSettings] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [uploadingDocumento, setUploadingDocumento] = useState(false);

  /**
   * Hooks de negócio - cada um responsável por um domínio
   */
  
  // Modals e notificações (base)
  const modalsNotif = useModalsAndNotifications();

  // Navegação de páginas (base)
  const navigation = usePageNavigation();

  // Case core data
  const caseCore = useCaseCore(
    id,
    publicationId,
    systemSettings,
    modalsNotif.showToast,
    handleCaseCreated,
    handleCaseDeleted,
  );

  useEffect(() => {
    if (isReadOnly && caseCore.isEditing) {
      caseCore.setIsEditing(false);
    }
  }, [isReadOnly, caseCore.isEditing, caseCore.setIsEditing]);

  const [linkedCases, setLinkedCases] = useState([]);
  const [loadingLinkedCases, setLoadingLinkedCases] = useState(false);

  const [mentionedProcessLinks, setMentionedProcessLinks] = useState([]);

  const currentCaseCnj = useMemo(() => {
    const raw = caseCore.caseData?.numero_processo_formatted || caseCore.caseData?.numero_processo || '';
    return formatCnj(raw);
  }, [caseCore.caseData?.numero_processo_formatted, caseCore.caseData?.numero_processo]);

  const handleMentionProcess = useCallback(({ cnj, sourceMovimentacaoId } = {}) => {
    if (!cnj) return;

    setMentionedProcessLinks((current) => {
      if (current.some((item) => item.cnj === cnj)) return current;

      return [
        ...current,
        {
          cnj,
          papel: '',
          sourceMovimentacaoId: sourceMovimentacaoId || null,
        },
      ];
    });
  }, []);

  const handleMentionedProcessRoleChange = useCallback((cnj, papel) => {
    if (!cnj) return;
    setMentionedProcessLinks((current) =>
      current.map((item) => (item.cnj === cnj ? { ...item, papel: papel ?? '' } : item))
    );
  }, []);

  const handleRemoveMentionedProcess = useCallback((cnj) => {
    if (!cnj) return;
    setMentionedProcessLinks((current) => current.filter((item) => item.cnj !== cnj));
  }, []);

  // Party management
  const parties = usePartyManagement(
    id,
    modalsNotif.showToast,
    []
  );

  // Movements and tasks
  const movements = useMovementsAndTasks(
    id,
    systemSettings,
    modalsNotif.showToast
  );

  // Publications
  const publications = usePublicationsForCase(
    id,
    systemSettings,
    modalsNotif.showToast
  );

  // Financial data
  const financial = useFinancialData(
    id,
    caseCore.formData,
    caseCore.setFormData,
    navigation.activeSection === 'financeiro',
    modalsNotif.showToast,
  );

  // Auto-save financial data (debounce 800ms + só campos alterados)
  const { isSaving: autoSavingFinancial, forceSave: forceSaveFinancial } = useAutoSave(
    financial.buildFinancialPayload(),
    async (changedFields) => {
      const { default: casesService } = await import('../services/casesService');
      await casesService.update(id, changedFields);
    },
    {
      delay: 800,
      enabled: !!(id && navigation.activeSection === 'financeiro' && !caseCore.saving),
      getChangedFields: financial.getChangedFinancialFields,
    }
  );

  const previousSectionRef = useRef(navigation.activeSection);

  useEffect(() => {
    const loadLinkedCases = async () => {
      const clientId = caseCore.caseData?.cliente_principal;
      const currentCaseId = caseCore.caseData?.id;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseCore.caseData?.cliente_principal, caseCore.caseData?.id]);

  useEffect(() => {
    const previousSection = previousSectionRef.current;
    const currentSection = navigation.activeSection;

    if (
      id &&
      previousSection === 'financeiro' &&
      currentSection !== 'financeiro' &&
      !caseCore.saving
    ) {
      forceSaveFinancial().catch((error) => {
        console.error('Erro ao forçar auto-save ao sair da aba Financeiro:', error);
      });
    }

    previousSectionRef.current = currentSection;
  }, [id, navigation.activeSection, caseCore.saving, forceSaveFinancial]);

  useEffect(() => {
    if (!id) return;

    const flushFinancialDraft = () => {
      if (navigation.activeSection !== 'financeiro' || caseCore.saving) return;

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
  }, [id, navigation.activeSection, caseCore.saving, forceSaveFinancial]);

  /**
   * Load system settings on mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await systemSettingsService.getAllSettings();
        setSystemSettings(settings);
        console.log('⚙️ System settings carregadas:', settings);
      } catch (error) {
        console.error('Erro ao carregar system settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  /**
   * Detecta link action para vincular contato ao caso
   */
  useEffect(() => {
    if (!id || linkAction !== 'link' || !Number.isInteger(linkContactId) || linkContactId <= 0) {
      return;
    }

    // Passo 1: garantir que a aba Partes está ativa
    if (navigation.activeSection !== 'parties') {
      navigation.setActiveSection('parties');
      return; // re-executa quando activeSection mudar
    }

    // Passo 2: aguardar carregamento das partes (necessário para checar duplicidade)
    if (parties.loadingParties) return;

    const runLinkFlow = async () => {
      const alreadyLinked = parties.parties.some((party) => party.contact === linkContactId);
      if (alreadyLinked) {
        modalsNotif.showToast('Contato já está vinculado a este processo.', 'warning');
        navigation.clearLinkQueryParams();
        return;
      }

      // Busca o contato diretamente por ID — sem depender da lista carregada
      try {
        const contact = await contactsAPI.getById(linkContactId);
        parties.setSelectedContact(contact);
        parties.setShowAddPartyModal(true);
      } catch {
        modalsNotif.showToast('Contato não encontrado para vinculação.', 'error');
      } finally {
        navigation.clearLinkQueryParams();
      }
    };

    runLinkFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, linkAction, linkContactId, navigation.activeSection, parties.loadingParties]);

  /**
   * Carregar partes ao carregar página
   */
  useEffect(() => {
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_PARTIES_ON_CASE !== false;
    
    if (shouldAutoLoad && parties.loadParties) {
      parties.loadParties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemSettings]);

  /**
   * Recarregar partes quando trocar de aba
   */
  useEffect(() => {
    if (navigation.activeSection === 'parties' && parties.loadParties) {
      parties.loadParties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.activeSection]);

  /**
   * Recarregar movimentações/tarefas ao entrar na aba de movimentações
   * para reduzir chance de dados defasados quando houve integração em outro dispositivo.
   */
  useEffect(() => {
    if (navigation.activeSection !== 'movimentacoes' || !id) {
      return;
    }

    movements.loadMovimentacoes();
    movements.loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.activeSection, id]);

  /**
   * Recarregar dados base do caso ao entrar na aba Financeiro
   * para refletir edições feitas em outro dispositivo.
   */
  useEffect(() => {
    if (navigation.activeSection !== 'financeiro' || !id) {
      return;
    }

    if (caseCore.saving || autoSavingFinancial) {
      return;
    }

    caseCore.loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.activeSection, id]);

  /**
   * Quando a aba Financeiro estiver aberta, recarrega ao voltar foco
   * para sincronizar alterações externas sem precisar Ctrl+R.
   */
  useEffect(() => {
    if (navigation.activeSection !== 'financeiro' || !id) {
      return;
    }

    const refreshFinanceiroData = () => {
      if (caseCore.saving || autoSavingFinancial) {
        return;
      }

      caseCore.loadCaseData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshFinanceiroData();
      }
    };

    window.addEventListener('focus', refreshFinanceiroData);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshFinanceiroData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.activeSection, id, caseCore.saving, autoSavingFinancial]);

  /**
   * Quando a aba de movimentações estiver aberta, recarrega ao voltar foco
   * (ex.: usuário alternou iPad/PC e retornou para esta janela).
   */
  useEffect(() => {
    if (navigation.activeSection !== 'movimentacoes' || !id) {
      return;
    }

    const refreshMovementsAndTasks = () => {
      movements.loadMovimentacoes();
      movements.loadTasks();
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
  }, [navigation.activeSection, id]);

  /**
   * Callback quando caso é criado
   */
  function handleCaseCreated(caseId) {
    const currentParams = new URLSearchParams(location.search);
    currentParams.delete('pub_id');
    currentParams.delete('action');
    currentParams.delete('contactId');
    currentParams.set('tab', navigation.activeSection || 'info');
    const nextQuery = currentParams.toString();
    const nextUrl = nextQuery ? `/cases/${caseId}?${nextQuery}` : `/cases/${caseId}`;
    navigate(nextUrl, { replace: true });
  }

  /**
   * Callback quando caso é deletado
   */
  function handleCaseDeleted() {
    setTimeout(() => {
      window.close();
    }, 1500);
  }

  /**
   * Extensão para salvar caso + parties
   */
  const handleSaveCaseWithParties = async () => {
    try {
      await caseCore.handleSave(parties.parties);
    } catch {
      // Error already handled by hook
    }
  };

  /**
   * Handler para abrir seleção de contato
   */
  const handleOpenContactSelection = () => {
    parties.setShowAddPartyModal(false);
    modalsNotif.setShowSelectContactModal(true);
  };

  /**
   * Handler para seleção de contato
   */
  const handleSelectContactForParty = (contact) => {
    parties.setSelectedContact(contact);
    modalsNotif.setShowSelectContactModal(false);
    modalsNotif.setShowContactModal(false);
    parties.setShowAddPartyModal(true);
  };

  /**
   * Handler para criar novo contato para parte
   */
  const handleCreateNewContactForParty = () => {
    modalsNotif.setShowSelectContactModal(false);
    modalsNotif.setShowContactModal(true);
  };

  /**
   * Handler para salvar parte
   */
  const handleSaveParty = async () => {
    await parties.handleSaveParty(parties.selectedContact, modalsNotif.loadContacts);
  };

  /**
   * Handler para remover parte
   */
  const handleRemoveParty = async (partyId, partyName) => {
    await parties.handleRemoveParty(partyId, partyName, modalsNotif.loadContacts);
  };

  /**
   * Handler para salvar alterações na parte
   */
  const handleSavePartyChanges = async () => {
    await parties.handleSavePartyChanges(modalsNotif.loadContacts);
  };

  /**
   * Handler para abrir origem movimentação
   */
  const handleOpenOrigemMovimentacao = () => {
    if (!id) return;

    const sourcePublicationApiId = caseCore.sourcePublication?.id_api
      ? Number(caseCore.sourcePublication.id_api)
      : null;

    const origemPublicationPk = Number(
      caseCore.formData?.publicacao_origem
        || caseCore.caseData?.publicacao_origem
        || caseCore.caseData?.publicacao_origem_id
        || 0
    );
    const origemPublication = !sourcePublicationApiId && origemPublicationPk && Array.isArray(publications.publicacoes)
      ? publications.publicacoes.find((pub) => Number(pub.id) === origemPublicationPk)
      : null;

    const origemPublicationApiId = sourcePublicationApiId || Number(origemPublication?.id_api || 0) || null;

    const origemMovimentacao = origemPublicationApiId && Array.isArray(movements.movimentacoes)
      ? movements.movimentacoes.find((mov) => Number(mov.publicacao_id) === Number(origemPublicationApiId))
      : null;

    const targetUrl = origemMovimentacao?.id
      ? `/cases/${id}?tab=movements&focusMovement=${origemMovimentacao.id}`
      : `/cases/${id}?tab=movements`;

    window.open(targetUrl, '_blank', 'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes');
  };

  const handleOpenOrigemPublicacao = () => {
    const sourcePublicationApiId = caseCore.sourcePublication?.id_api
      ? Number(caseCore.sourcePublication.id_api)
      : null;

    const origemPublicationApiId = Number(
      caseCore.formData?.publicacao_origem_id_api
        || caseCore.caseData?.publicacao_origem_id_api
        || sourcePublicationApiId
        || 0
    ) || null;

    if (origemPublicationApiId) {
      openPublicationDetailsWindow(origemPublicationApiId);
      return;
    }

    // Fallback: tentar resolver via lista de publicações já carregada
    const origemPublicationPk = Number(
      caseCore.formData?.publicacao_origem
        || caseCore.caseData?.publicacao_origem
        || caseCore.caseData?.publicacao_origem_id
        || 0
    );

    const origemPublication = origemPublicationPk && Array.isArray(publications.publicacoes)
      ? publications.publicacoes.find((pub) => Number(pub.id) === origemPublicationPk)
      : null;

    const fallbackApiId = Number(origemPublication?.id_api || 0) || null;
    if (fallbackApiId) {
      openPublicationDetailsWindow(fallbackApiId);
      return;
    }

    modalsNotif.showToast('Não foi possível abrir a publicação de origem', 'warning');
  };

  /**
   * Handler para deletar caso
   */
  const handleDelete = async () => {
    modalsNotif.setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    modalsNotif.setShowDeleteConfirmModal(false);
    
    try {
      await caseCore.handleDelete(modalsNotif.deletePublicationToo);
    } finally {
      modalsNotif.setDeletePublicationToo(false);
    }
  };

  const handleCancelDelete = () => {
    modalsNotif.setShowDeleteConfirmModal(false);
    modalsNotif.setDeletePublicationToo(false);
  };

  /**
   * Handler para mudança de aba (protegido)
   */
  const handleTabChange = (newTab) => {
    navigation.handleTabChange(
      newTab,
      caseCore.isEditing,
      caseCore.caseData,
      caseCore.formData,
      caseCore.setIsEditing,
      caseCore.setFormData
    );
  };

  const loadDocumentos = useCallback(async () => {
    if (!id) {
      setDocumentos([]);
      return;
    }

    setLoadingDocumentos(true);
    try {
      const docs = await caseDocumentsService.getByCase(id);
      setDocumentos(Array.isArray(docs) ? docs : []);
    } catch {
      modalsNotif.showToast('Erro ao carregar documentos do processo', 'error');
    } finally {
      setLoadingDocumentos(false);
    }
  }, [id, modalsNotif]);

  const handleUploadDocument = useCallback(async (file) => {
    if (!id) {
      modalsNotif.showToast('Salve o processo antes de anexar documentos', 'warning');
      return;
    }

    setUploadingDocumento(true);
    try {
      await caseDocumentsService.upload({ caseId: id, file });
      modalsNotif.showToast('Documento enviado com sucesso', 'success');
      await loadDocumentos();
    } catch (error) {
      modalsNotif.showToast(error.message || 'Erro ao enviar documento', 'error');
    } finally {
      setUploadingDocumento(false);
    }
  }, [id, loadDocumentos, modalsNotif]);

  const handleDeleteDocument = useCallback(async (documentId) => {
    try {
      await caseDocumentsService.remove(documentId);
      modalsNotif.showToast('Documento excluido com sucesso', 'success');
      await loadDocumentos();
    } catch {
      modalsNotif.showToast('Erro ao excluir documento', 'error');
    }
  }, [loadDocumentos, modalsNotif]);

  useEffect(() => {
    const shouldAutoLoadDocuments = systemSettings?.AUTO_LOAD_DOCUMENTS_ON_CASE !== false;
    if (navigation.activeSection === 'documentos' && shouldAutoLoadDocuments && id) {
      // Inline fetch to avoid circular dependency with loadDocumentos callback
      setLoadingDocumentos(true);
      caseDocumentsService.getByCase(id)
        .then(docs => setDocumentos(Array.isArray(docs) ? docs : []))
        .catch(() => modalsNotif.showToast('Erro ao carregar documentos do processo', 'error'))
        .finally(() => setLoadingDocumentos(false));
    }
  }, [id, navigation.activeSection, systemSettings]);

  const activeTasks = useMemo(
    () => (movements.tasks || []).filter((task) => task.status !== 'CONCLUIDA'),
    [movements.tasks]
  );

  const activeLinkedTasksCount = useMemo(
    () => activeTasks.filter((task) => !!task.movimentacao).length,
    [activeTasks]
  );

  const activeStandaloneTasksCount = useMemo(
    () => activeTasks.filter((task) => !task.movimentacao).length,
    [activeTasks]
  );

  const showPublicacoesTab = !(
    systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION &&
    systemSettings?.HIDE_PUBLICATIONS_TAB_WHEN_AUTO_SYNC
  );

  if (caseCore.loading) {
    return (
      <div className="case-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando processo...</p>
        </div>
      </div>
    );
  }

  if (id && !caseCore.caseData) {
    return (
      <div className="case-detail-page">
        <div className="error-container">
          <p>Processo não encontrado</p>
          <button onClick={() => window.close()}>Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="case-detail-page">
      {/* Navigation Bar */}
      <CaseDetailNavbar
        activeSection={navigation.activeSection}
        onTabChange={handleTabChange}
        isInfoEditing={caseCore.isEditing && navigation.activeSection === 'info'}
        partiesCount={parties.parties.length}
        activeLinkedTasksCount={activeLinkedTasksCount}
        showPublicacoesTab={showPublicacoesTab}
        publicacoesCount={publications.publicacoes.length}
        activeStandaloneTasksCount={activeStandaloneTasksCount}
        linkedCasesCount={linkedCases.length}
      />

      {/* Content */}
      <CaseDetailTabContent
        activeSection={navigation.activeSection}
        id={id}
        isReadOnly={isReadOnly}
        navigation={navigation}
        caseCore={caseCore}
        parties={parties}
        movements={{
          ...movements,
          onMentionProcess: handleMentionProcess,
        }}
        publications={publications}
        financial={financial}
        documentos={documentos}
        loadingDocumentos={loadingDocumentos}
        uploadingDocumento={uploadingDocumento}
        onUploadDocument={handleUploadDocument}
        onDeleteDocument={handleDeleteDocument}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        autoSavingFinancial={autoSavingFinancial}
        systemSettings={systemSettings}
        showPublicacoesTab={showPublicacoesTab}
        currentCaseCnj={currentCaseCnj}
        linkedCases={linkedCases}
        loadingLinkedCases={loadingLinkedCases}
        mentionedProcessLinks={mentionedProcessLinks}
        onMentionedProcessRoleChange={handleMentionedProcessRoleChange}
        onRemoveMentionedProcess={handleRemoveMentionedProcess}
        onSaveCaseWithParties={handleSaveCaseWithParties}
        onDeleteCase={handleDelete}
        onOpenLatestMovimentacao={() => {
          navigation.setActiveSection('movimentacoes');
          movements.handleOpenLatestMovimentacao();
        }}
        onOpenOrigemMovimentacao={handleOpenOrigemMovimentacao}
        onOpenOrigemPublicacao={handleOpenOrigemPublicacao}
        onAddPartyClick={handleOpenContactSelection}
        onRemoveParty={handleRemoveParty}
      />

      <CaseDetailModals
        modalsNotif={modalsNotif}
        parties={parties}
        caseData={caseCore.caseData}
        onSelectContactForParty={handleSelectContactForParty}
        onCreateNewContactForParty={handleCreateNewContactForParty}
        onSavePartyChanges={handleSavePartyChanges}
        onSaveParty={handleSaveParty}
        onCancelDelete={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}

export default CaseDetailPage;
