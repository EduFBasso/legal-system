import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '../utils/formatters';
import useAutoSave from '../hooks/useAutoSave';
import systemSettingsService from '../services/systemSettingsService';
import CaseDetailNavbar from '../components/CaseDetail/CaseDetailNavbar';
import CaseDetailTabContent from '../components/CaseDetail/CaseDetailTabContent';
import CaseDetailModals from '../components/CaseDetail/CaseDetailModals';
import ContactDetailModal from '../components/ContactDetailModal';
import PublicationDetailModal from '../components/PublicationDetailModal';

import { formatCnj } from '../utils/cnj';
import publicationsService from '../services/publicationsService';
import casesService from '../services/casesService';

// Custom hooks para separação de responsabilidades
import { useModalsAndNotifications } from '../hooks/useModalsAndNotifications';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useCaseCore } from '../hooks/useCaseCore';
import { usePartyManagement } from '../hooks/usePartyManagement';
import { useMovementsAndTasks } from '../hooks/useMovementsAndTasks';
import { usePublicationsForCase } from '../hooks/usePublicationsForCase';
import { useFinancialData } from '../hooks/useFinancialData';
import useCaseVinculosCases from '../hooks/useCaseVinculosCases';
import { useCaseDetailAutoRefresh } from '../hooks/useCaseDetailAutoRefresh';
import { useFinanceiroAutoSaveGuards } from '../hooks/useFinanceiroAutoSaveGuards';
import { useCaseDetailLinkContactFlow } from '../hooks/useCaseDetailLinkContactFlow';

import '../components/common/Button/Button.css';
import './CaseDetailPage.css';

const LINKED_CASE_COMPLETED_STORAGE_KEY = 'legal_system_linked_case_completed';

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
 * - useCaseVinculosCases: Processos vinculados (principal/derivado)
 * - useCaseDetailAutoRefresh: Recarrega dados ao entrar em abas e ao retomar foco
 * - useFinanceiroAutoSaveGuards: Força salvar rascunho do Financeiro ao sair/ocultar
 */
function CaseDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const publicationId = searchParams.get('pub_id');
  const isReadOnly = (() => {
    const value = (searchParams.get('readonly') || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  })();

  // System settings
  const [systemSettings, setSystemSettings] = useState(null);

  /**
   * Hooks de negócio - cada um responsável por um domínio
   */
  
  // Modals e notificações (base)
  const modalsNotif = useModalsAndNotifications();

  useEffect(() => {
    const linkedFlag = (searchParams.get('linked') || '').trim().toLowerCase();
    const shouldShow = linkedFlag === '1' || linkedFlag === 'true' || linkedFlag === 'yes';
    if (!shouldShow) return;

    modalsNotif.showToast('Processo vinculado com sucesso!', 'success');

    try {
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete('linked');
      const nextSearch = nextParams.toString();
      navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, navigate, modalsNotif.showToast, searchParams]);

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
    // Prefill: create DERIVADO from principal, via /cases/new?case_principal=ID&vinculo_tipo=...
    if (id) return;
    const principalId = Number(searchParams.get('case_principal')) || null;
    const vinculoTipo = String(searchParams.get('vinculo_tipo') || '').trim();
    if (!principalId) return;

    caseCore.setFormData((prev) => {
      const next = { ...prev };
      if (!next.classificacao) next.classificacao = 'NEUTRO';
      if (!next.case_principal) next.case_principal = principalId;
      if (!next.vinculo_tipo && vinculoTipo) next.vinculo_tipo = vinculoTipo;
      return next;
    });
  }, [id, searchParams, caseCore]);

  useEffect(() => {
    if (isReadOnly && isCaseEditing) {
      setIsCaseEditing(false);
    }
  }, [isReadOnly, isCaseEditing, setIsCaseEditing]);

  const [mentionedProcessLinks, setMentionedProcessLinks] = useState([]);

  const [selectedPublication, setSelectedPublication] = useState(null);

  const [openContactId, setOpenContactId] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleOpenContactModal = useCallback((contactId) => {
    const parsed = Number(contactId);
    if (!parsed) return;
    setOpenContactId(parsed);
    setIsContactModalOpen(true);
  }, []);

  const handleCloseContactModal = useCallback(() => {
    setIsContactModalOpen(false);
    setOpenContactId(null);
  }, []);

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

  const reloadLinkedCasesRef = useRef(null);

  const handlePatchCase = useCallback(async (patch = {}) => {
    if (!id) return null;

    const safePatch = patch && typeof patch === 'object' ? patch : {};
    const hasTargetWrapper =
      Object.prototype.hasOwnProperty.call(safePatch, 'caseId') ||
      Object.prototype.hasOwnProperty.call(safePatch, 'patch');

    const targetCaseId = hasTargetWrapper
      ? Number(safePatch.caseId) || Number(id)
      : Number(id);

    const payload = hasTargetWrapper
      ? (safePatch.patch && typeof safePatch.patch === 'object' ? safePatch.patch : {})
      : safePatch;

    try {
      await casesService.update(targetCaseId, payload);
      await caseCore.loadCaseData({ silent: true });
      if (hasTargetWrapper && reloadLinkedCasesRef.current) reloadLinkedCasesRef.current();
      modalsNotif.showToast('Vínculo atualizado com sucesso!', 'success');
      return true;
    } catch (error) {
      console.error('Error patching case:', error);
      modalsNotif.showToast(error?.message || 'Erro ao atualizar vínculo', 'error');
      throw error;
    }
  }, [caseCore, id, modalsNotif]);

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
    [],
    caseCore.loadCaseData
  );

  // Movements and tasks
  const movements = useMovementsAndTasks(
    id,
    systemSettings,
    modalsNotif.showToast
  );

  // Publications (desabilitado em read-only)
  const publications = usePublicationsForCase(
    id,
    systemSettings,
    modalsNotif.showToast,
    { enabled: !isReadOnly }
  );

  // Financial data (não deve rodar em read-only)
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
      enabled: !!(id && navigation.activeSection === 'financeiro' && !isReadOnly && !caseCore.saving),
      getChangedFields: financial.getChangedFinancialFields,
    }
  );

  // Em read-only nunca devemos tentar flush/auto-save financeiro.
  const forceSaveFinancialSafe = useCallback(async () => {}, []);

  const { linkedCases, loadingLinkedCases, reloadLinkedCases } = useCaseVinculosCases({
    currentCaseId: caseCore.caseData?.id,
    casePrincipalId: caseCore.caseData?.case_principal,
    classificacao: caseCore.caseData?.classificacao,
  });
  reloadLinkedCasesRef.current = reloadLinkedCases;

  useEffect(() => {
    const currentCaseId = Number(id) || null;
    if (!currentCaseId) return;

    const handleLinkedCaseCompleted = (event) => {
      if (event.key !== LINKED_CASE_COMPLETED_STORAGE_KEY || !event.newValue) return;

      try {
        const payload = JSON.parse(event.newValue);
        const principalId = Number(payload?.principalId) || null;
        if (principalId !== currentCaseId) return;

        caseCore.loadCaseData({ silent: true });
        if (reloadLinkedCasesRef.current) {
          reloadLinkedCasesRef.current();
        }
        modalsNotif.showToast('Processo vinculado com sucesso!', 'success');
      } catch {
        // ignore malformed payloads
      }
    };

    window.addEventListener('storage', handleLinkedCaseCompleted);
    return () => {
      window.removeEventListener('storage', handleLinkedCaseCompleted);
    };
  }, [id, caseCore, modalsNotif]);

  useFinanceiroAutoSaveGuards({
    caseId: isReadOnly ? null : id,
    activeSection: navigation.activeSection,
    caseSaving: caseCore.saving,
    forceSaveFinancial: isReadOnly ? forceSaveFinancialSafe : forceSaveFinancial,
  });

  // Em modo somente leitura, evita deeplink para abas bloqueadas.
  useEffect(() => {
    if (!isReadOnly) return;
    if (navigation.activeSection === 'publicacoes') {
      navigation.setActiveSection('info');
    }
  }, [isReadOnly, navigation.activeSection, navigation.setActiveSection]);

  /**
   * Load system settings on mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await systemSettingsService.getAllSettings();
        setSystemSettings(settings);
        try {
          const shouldLog = import.meta.env.DEV && String(window?.localStorage?.getItem('debug_settings') || '') === '1';
          if (shouldLog) {
            console.log('⚙️ System settings carregadas:', settings);
          }
        } catch {
          // ignore
        }
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
    loadCaseData: () => caseCore.loadCaseData({ silent: true }),
    loadMovimentacoes: movements.loadMovimentacoes,
    loadTasks: movements.loadTasks,
  });

  /**
   * Callback quando caso é criado
   */
  function handleCaseCreated(caseId, _failedParties = 0, meta = {}) {
    // Prefer the principal ID passed directly from useCaseCore (from the API response
    // or formData), falling back to the URL param for robustness.
    const fromMeta = Number(meta?.casePrincipalId) || null;
    const fromUrl = Number(new URLSearchParams(location.search).get('case_principal')) || null;
    const createdAsDerivedFromPrincipalId = fromMeta || fromUrl;

    if (createdAsDerivedFromPrincipalId) {
      const principalParams = new URLSearchParams();
      principalParams.set('tab', 'info');
      principalParams.set('linked', '1');

      const nextUrl = `/cases/${createdAsDerivedFromPrincipalId}?${principalParams.toString()}`;
      const autoCloseRaw = String(searchParams.get('autoclose') || '').trim().toLowerCase();
      const shouldAutoClose = autoCloseRaw === '1' || autoCloseRaw === 'true' || autoCloseRaw === 'yes';

      if (shouldAutoClose) {
        try {
          window.localStorage.setItem(
            LINKED_CASE_COMPLETED_STORAGE_KEY,
            JSON.stringify({
              principalId: createdAsDerivedFromPrincipalId,
              timestamp: Date.now(),
            })
          );
        } catch {
          // ignore
        }

        try {
          window.close();
          return;
        } catch {
          // fallback below
        }
      }

      navigate(nextUrl, { replace: true });
      return;
    }

    const currentParams = new URLSearchParams(location.search);

    currentParams.delete('pub_id');
    currentParams.delete('action');
    currentParams.delete('contactId');
    currentParams.delete('case_principal');
    currentParams.delete('vinculo_tipo');
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

    // Regra: 1 cliente por processo. Se já existe cliente, garante que o form não abre com is_client marcado.
    const hasExistingClient = Array.isArray(parties.parties)
      ? parties.parties.some((p) => p?.is_client)
      : false;
    if (hasExistingClient) {
      parties.setPartyFormData((prev) => ({
        ...prev,
        is_client: false,
      }));
    }

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
    await caseCore.loadCaseData();
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

  const handleOpenOrigemPublicacao = async () => {
    const sourcePublicationApiId = caseCore.sourcePublication?.id_api
      ? Number(caseCore.sourcePublication.id_api)
      : null;

    const origemPublicationApiId = Number(
      caseCore.formData?.publicacao_origem_id_api
        || caseCore.caseData?.publicacao_origem_id_api
        || sourcePublicationApiId
        || 0
    ) || null;

    const tryOpenByApiId = async (idApi) => {
      try {
        const result = await publicationsService.getPublicationById(idApi);
        if (!result?.success || !result?.publication) {
          modalsNotif.showToast(result?.error || 'Não foi possível carregar os detalhes da publicação.', 'warning');
          return false;
        }
        setSelectedPublication(result.publication);
        return true;
      } catch (err) {
        console.error('Erro ao buscar detalhes da publicação:', err);
        modalsNotif.showToast('Não foi possível carregar os detalhes da publicação.', 'warning');
        return false;
      }
    };

    if (origemPublicationApiId) {
      await tryOpenByApiId(origemPublicationApiId);
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
      await tryOpenByApiId(fallbackApiId);
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

  const showPublicacoesTab = !isReadOnly && !(
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

      formatDate,
      formatCurrency,

      autoSavingFinancial,
      systemSettings,
      showPublicacoesTab,
      currentCaseCnj,

      linkedCases,
      loadingLinkedCases,
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
    autoSavingFinancial,
    systemSettings,
    showPublicacoesTab,
    currentCaseCnj,
    linkedCases,
    loadingLinkedCases,
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
        onPatchCase={handlePatchCase}
        onAddPartyClick={handleOpenContactSelection}
        onRemoveParty={handleRemoveParty}
        onOpenContactModal={handleOpenContactModal}
      />

      {isContactModalOpen && !!openContactId && (
        <ContactDetailModal
          contactId={openContactId}
          isOpen={isContactModalOpen}
          onClose={handleCloseContactModal}
          onContactUpdated={() => {}}
          showLinkToProcessButton={false}
        />
      )}

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

      {selectedPublication && (
        <PublicationDetailModal
          publication={selectedPublication}
          onClose={() => setSelectedPublication(null)}
        />
      )}
    </div>
  );
}

export default CaseDetailPage;
