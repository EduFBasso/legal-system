import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '../utils/formatters';
import useAutoSave from '../hooks/useAutoSave';
import systemSettingsService from '../services/systemSettingsService';
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
import { useCaseDetailLinkedCases } from '../hooks/useCaseDetailLinkedCases';
import { useCaseDocuments } from '../hooks/useCaseDocuments';
import { useCaseDetailAutoRefresh } from '../hooks/useCaseDetailAutoRefresh';
import { useFinanceiroAutoSaveGuards } from '../hooks/useFinanceiroAutoSaveGuards';
import { useCaseDetailLinkContactFlow } from '../hooks/useCaseDetailLinkContactFlow';

import '../components/common/Button/Button.css';
import './CaseDetailPage.css';

/**
 * CaseDetailPage - Página dedicada para detalhes completos do processo
 * 
 * Abre em nova aba do navegador, aproveitando toda largura da tela
 * sem sidebar. Permite edição inline de informações do processo.
 * 
 * Modularizado com custom hooks por domínio + hooks de orquestração:
 * - useCaseCore: Dados e CRUD do caso
 * - usePartyManagement: Partes do processo
 * - useMovementsAndTasks: Movimentações e tarefas
 * - useFinancialData: Dados financeiros
 * - usePublicationsForCase: Publicações
 * - useModalsAndNotifications: Modais e notificações (Toast)
 * - usePageNavigation: Navegação de abas e URL params
 * - useCaseDetailLinkedCases: Processos relacionados (aba Vínculos)
 * - useCaseDocuments: Listagem/upload/exclusão (aba Documentos)
 * - useCaseDetailAutoRefresh: Recarrega dados ao entrar em abas e ao retomar foco
 * - useFinanceiroAutoSaveGuards: Força salvar rascunho do Financeiro ao sair/ocultar
 */
function CaseDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const publicationId = new URLSearchParams(location.search).get('pub_id');
  const isReadOnly = (() => {
    const value = (new URLSearchParams(location.search).get('readonly') || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  })();

  // System settings
  const [systemSettings, setSystemSettings] = useState(null);

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

  const { isEditing: isCaseEditing, setIsEditing: setIsCaseEditing } = caseCore;

  useEffect(() => {
    if (isReadOnly && isCaseEditing) {
      setIsCaseEditing(false);
    }
  }, [isReadOnly, isCaseEditing, setIsCaseEditing]);

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

  const { linkedCases, loadingLinkedCases } = useCaseDetailLinkedCases({
    clientId: caseCore.caseData?.cliente_principal,
    currentCaseId: caseCore.caseData?.id,
  });

  useFinanceiroAutoSaveGuards({
    caseId: id,
    activeSection: navigation.activeSection,
    caseSaving: caseCore.saving,
    forceSaveFinancial,
  });

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

  useCaseDetailLinkContactFlow({
    caseId: id,
    activeSection: navigation.activeSection,
    setActiveSection: navigation.setActiveSection,
    loadingParties: parties.loadingParties,
    parties: parties.parties,
    setSelectedContact: parties.setSelectedContact,
    setShowAddPartyModal: parties.setShowAddPartyModal,
    showToast: modalsNotif.showToast,
    clearLinkQueryParams: navigation.clearLinkQueryParams,
  });

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

  useCaseDetailAutoRefresh({
    caseId: id,
    activeSection: navigation.activeSection,
    caseSaving: caseCore.saving,
    autoSavingFinancial,
    loadCaseData: caseCore.loadCaseData,
    loadMovimentacoes: movements.loadMovimentacoes,
    loadTasks: movements.loadTasks,
  });

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

  const documents = useCaseDocuments({
    caseId: id,
    activeSection: navigation.activeSection,
    systemSettings,
    showToast: modalsNotif.showToast,
  });

  const showPublicacoesTab = !(
    systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION &&
    systemSettings?.HIDE_PUBLICATIONS_TAB_WHEN_AUTO_SYNC
  );

  const caseDetail = useMemo(() => {
    return {
      activeSection: navigation.activeSection,
      id,
      isReadOnly,

      navigation,
      caseCore,
      parties,
      movements: {
        ...movements,
        onMentionProcess: handleMentionProcess,
      },
      publications,
      financial,

      documentos: documents.documentos,
      loadingDocumentos: documents.loadingDocumentos,
      uploadingDocumento: documents.uploadingDocumento,
      onUploadDocument: documents.uploadDocumento,
      onDeleteDocument: documents.deleteDocumento,

      formatDate,
      formatCurrency,

      autoSavingFinancial,
      systemSettings,
      showPublicacoesTab,
      currentCaseCnj,

      linkedCases,
      loadingLinkedCases,
      mentionedProcessLinks,
      onMentionedProcessRoleChange: handleMentionedProcessRoleChange,
      onRemoveMentionedProcess: handleRemoveMentionedProcess,
    };
  }, [
    id,
    isReadOnly,
    navigation,
    caseCore,
    parties,
    movements,
    handleMentionProcess,
    publications,
    financial,
    documents.documentos,
    documents.loadingDocumentos,
    documents.uploadingDocumento,
    documents.uploadDocumento,
    documents.deleteDocumento,
    autoSavingFinancial,
    systemSettings,
    showPublicacoesTab,
    currentCaseCnj,
    linkedCases,
    loadingLinkedCases,
    mentionedProcessLinks,
    handleMentionedProcessRoleChange,
    handleRemoveMentionedProcess,
  ]);

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

  // Evita "piscar" a tela inteira durante recarregamentos de background.
  // Mantém o spinner apenas no carregamento inicial (quando ainda não há dados).
  if (caseCore.loading && !caseCore.caseData) {
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
        caseDetail={caseDetail}
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
