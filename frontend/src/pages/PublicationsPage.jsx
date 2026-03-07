import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicationsContext } from '../contexts/PublicationsContext';
import { useSettings } from '../contexts/SettingsContext';
import { usePublicationNotificationRead } from '../hooks/usePublicationNotificationRead';
import publicationsService from '../services/publicationsService';
import { subscribePublicationSync } from '../services/publicationSync';
import PublicationsSearchForm from  '../components/PublicationsSearchForm';
import PublicationsList from '../components/PublicationsList';
import PublicationsStats from '../components/PublicationsStats';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PublicationDeleteDialogs from '../components/publications/PublicationDeleteDialogs';
import {
  getPublicationDeleteBlockedMessage,
  getPublicationDeleteSuccessMessage,
} from '../utils/publicationDeleteFeedback';
import './PublicationsPage.css';

/**
 * Página principal de publicações
 * Usa Context API e componentes modulares para maior manutenibilidade
 */
export default function PublicationsPage() {
  const { settings } = useSettings();
  const location = useLocation();
  const markPublicationNotificationAsRead = usePublicationNotificationRead();
  
  // Estado de seleção para exclusão
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showIntegrateConfirm, setShowIntegrateConfirm] = useState(false);
  const [integrateCount, setIntegrateCount] = useState(0);
  const [integrateLoading, setIntegrateLoading] = useState(false);
  const [showDeleteBlockedDialog, setShowDeleteBlockedDialog] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeletePublication, setPendingDeletePublication] = useState(null);
  
  // Obter estado e ações do contexto
  const {
    publications,
    loading,
    searchParams,
    lastSearch,
    toast,
    search,
    loadLastSearch,
    openModal,
    hideToast,
    showToast
  } = usePublicationsContext();

  /**
   * Handler para busca com filtros
   * Adiciona retroactiveDays do settings
   * Se autoIntegration ativado, integra automaticamente
   */
  const handleSearch = useCallback(async (filters) => {
    const retroactiveDays = settings.retroactiveDays ?? 7;
    const autoIntegration = settings.autoIntegration ?? false;

    const result = await search({
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      tribunais: filters.tribunais,
      retroactiveDays
    });

    if (result?.success && result.total_publicacoes > 0) {
      setIntegrateCount(result.total_publicacoes);
      
      if (autoIntegration) {
        // Integração automática ativada - integra sem confirmação
        await handleConfirmIntegrate();
      } else {
        // Integração manual - mostra modal
        setShowIntegrateConfirm(true);
      }
    }
  }, [search, settings.retroactiveDays, settings.autoIntegration]);

  const handleConfirmIntegrate = useCallback(async () => {
    setIntegrateLoading(true);
    try {
      const result = await publicationsService.batchIntegratePublications({
        autoLink: true,
        createMovement: false,
        autoIntegration: settings.autoIntegration ?? false
      });

      if (result.success) {
        showToast(
          `${result.integrated} integrada(s), ${result.pending} pendente(s), ${result.ignored} ignorada(s).`,
          'success'
        );
      } else {
        showToast(result.error || 'Erro ao integrar publicacoes.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Erro ao integrar publicacoes.', 'error');
    } finally {
      setIntegrateLoading(false);
      setShowIntegrateConfirm(false);
    }
  }, [showToast, settings.autoIntegration]);

  /**
   * Funções de seleção para exclusão
   */
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelectPublication = (idApi) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idApi)) {
        newSet.delete(idApi);
      } else {
        newSet.add(idApi);
      }
      return newSet;
    });
  };

  const selectAllPublications = () => {
    const allIds = new Set(publications.map(p => p.id_api));
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setPendingDeletePublication({ count: selectedIds.size });
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteSelected = async () => {
    setShowDeleteConfirmDialog(false);
    try {
      const result = await publicationsService.deleteMultiplePublications(Array.from(selectedIds));

      if (result.success) {
        showToast(getPublicationDeleteSuccessMessage({
          deleted: result.deleted,
          notificationsDeleted: result.notifications_deleted || 0,
        }), 'success');
        setSelectedIds(new Set());
        setSelectionMode(false);
        await loadLastSearch();
      } else {
        setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
          result.error,
          'Não foi possível excluir as publicações selecionadas.'
        ));
        setShowDeleteBlockedDialog(true);
      }
    } catch (error) {
      setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
        error.message,
        'Erro ao excluir publicações selecionadas.'
      ));
      setShowDeleteBlockedDialog(true);
    } finally {
      setPendingDeletePublication(null);
    }
  };

  /**
   * Handler para deletar uma publicação individual
   */
  const handleDeleteSingle = async (idApi) => {
    const pub = publications.find(p => p.id_api === idApi);
    const linkedToCase = !!pub?.case_id || pub?.integration_status === 'INTEGRATED';

    if (linkedToCase) {
      setDeleteBlockedMessage('Esta publicação não pode ser excluída porque está vinculada a um processo no sistema.');
      setShowDeleteBlockedDialog(true);
      return;
    }

    setPendingDeletePublication(pub);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteSingle = async () => {
    if (!pendingDeletePublication || !pendingDeletePublication.id_api) return;
    
    setShowDeleteConfirmDialog(false);
    try {
      const result = await publicationsService.deletePublication(pendingDeletePublication.id_api);
      
      if (result.success) {
        showToast(getPublicationDeleteSuccessMessage({
          single: true,
          notificationsDeleted: result.notifications_deleted || 0,
        }), 'success');
        await loadLastSearch();
      } else {
        setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
          result.error,
          'Não foi possível excluir a publicação.'
        ));
        setShowDeleteBlockedDialog(true);
      }
    } catch (error) {
      setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
        error.message,
        'Não foi possível excluir a publicação.'
      ));
      setShowDeleteBlockedDialog(true);
    } finally {
      setPendingDeletePublication(null);
    }
  };

  /**
   * Handler para integrar uma publicação individual da aba Publicações
   */
  const handleIntegrateSingle = async (pub) => {
    if (pub.case_suggestion?.id) {
      // Tem case_suggestion - perguntar se deseja vincular
      const confirmed = window.confirm(
        `Vincular ao caso #${pub.case_suggestion.id}?`
      );
      if (!confirmed) return;

      try {
        const result = await publicationsService.integratePublication(pub.id_api, {
          caseId: pub.case_suggestion.id,
          createMovement: false
        });

        if (result.success) {
          showToast('✅ Publicação integrada com sucesso!', 'success');
          await loadLastSearch();
        } else {
          showToast(result.error || '❌ Erro ao integrar publicação', 'error');
        }
      } catch (error) {
        showToast(error.message || '❌ Erro ao integrar publicação', 'error');
      }
    } else {
      // Sem case_suggestion - deixar pendente ou criar novo caso
      const confirmed = window.confirm(
        'Nenhum caso foi encontrado automaticamente. Deseja deixar pendente para integração posterior?'
      );
      if (!confirmed) {
        window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
      } else {
        try {
          const result = await publicationsService.integratePublication(pub.id_api, {
            createMovement: false
          });
          if (result.success) {
            showToast('⏸️ Publicação deixada pendente', 'info');
            await loadLastSearch();
          }
        } catch (error) {
          showToast(error.message || '❌ Erro ao atualizar publicação', 'error');
        }
      }
    }
  };

  /**
   * Handler para criar novo caso a partir de uma publicação
   */
  const handleCreateCaseSingle = async (pub) => {
    window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteAll = async () => {
    const totalCount = publications.length;
    if (totalCount === 0) return;

    setPendingDeletePublication({ count: totalCount, isDeleteAll: true });
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteAll = async () => {
    setShowDeleteConfirmDialog(false);

    try {
      const result = await publicationsService.deleteAllPublications();

      if (result.success) {
        showToast(getPublicationDeleteSuccessMessage({
          deleted: result.deleted,
          notificationsDeleted: result.notifications_deleted || 0,
          historyDeleted: result.history_deleted || 0,
        }), 'success');
        setSelectedIds(new Set());
        setSelectionMode(false);
        await loadLastSearch();
      } else {
        setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
          result.error,
          'Não foi possível excluir todas as publicações.'
        ));
        setShowDeleteBlockedDialog(true);
      }
    } catch (error) {
      setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
        error.message,
        'Erro ao excluir todas as publicações.'
      ));
      setShowDeleteBlockedDialog(true);
    } finally {
      setPendingDeletePublication(null);
    }
  };

  /**
   * Detectar navegação do cartão de Controles
   * Carrega última busca quando vem com state específico
   */
  useEffect(() => {
    if (location.state?.loadLastSearch) {
      loadLastSearch();
      // Limpar state para não recarregar ao voltar
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadLastSearch]);

  /**
   * Listener para evento customizado de reload da sidebar
   * Corrige bug de navegação para mesma rota
   */
  useEffect(() => {
    const handleReloadFromSidebar = () => {
      loadLastSearch();
    };
    
    window.addEventListener('reloadPublicationsFromSidebar', handleReloadFromSidebar);
    
    return () => {
      window.removeEventListener('reloadPublicationsFromSidebar', handleReloadFromSidebar);
    };
  }, [loadLastSearch]);

  useEffect(() => {
    const unsubscribe = subscribePublicationSync((event) => {
      if (event?.type === 'PUBLICATION_INTEGRATED') {
        loadLastSearch();
      }
    });

    return unsubscribe;
  }, [loadLastSearch]);

  return (
    <div className="publications-page">
      {/* Header */}
      <div className="publications-header">
        <div className="header-info">
          <h2>📰 Publicações Jurídicas</h2>
          {publications.length > 0 && (
            <p className="header-subtitle">
              {publications.length} {publications.length === 1 ? 'publicação encontrada' : 'publicações encontradas'}
            </p>
          )}
        </div>
      </div>

      {/* Search Form */}
      <PublicationsSearchForm onSearch={handleSearch} isLoading={loading} />

      {/* Last Search Stats Panel */}
      <PublicationsStats 
        lastSearch={lastSearch} 
        onLoadSearch={loadLastSearch} 
      />

      {/* Action Buttons - Deletar publicações */}
      {publications.length > 0 && (
        <div className="publications-actions">
          <button 
            className={`btn-selection-mode ${selectionMode ? 'active' : ''}`}
            onClick={toggleSelectionMode}
          >
            {selectionMode ? '✓ Modo Seleção' : '☑️ Selecionar'}
          </button>

          {selectionMode && (
            <>
              <button 
                className="btn-select-all"
                onClick={selectedIds.size === publications.length ? deselectAll : selectAllPublications}
              >
                {selectedIds.size === publications.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>

              <button 
                className="btn-delete-selected"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                🗑️ Apagar ({selectedIds.size})
              </button>
            </>
          )}

          <button 
            className="btn-delete-all-publications"
            onClick={handleDeleteAll}
          >
            🗑️ Apagar tudo ({publications.length})
          </button>
        </div>
      )}

      {/* Publications List */}
      <PublicationsList
        publications={publications}
        loading={loading}
        searchParams={searchParams}
        onCardClick={(pub) => {
          markPublicationNotificationAsRead(pub.id_api);
          openModal(pub);
        }}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectPublication}
        onDelete={handleDeleteSingle}
        showActionButtons={true}
        onIntegrate={handleIntegrateSingle}
        onCreateCase={handleCreateCaseSingle}
      />

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <ConfirmDialog
        isOpen={showIntegrateConfirm}
        type="info"
        title="🔗 Integrar publicações agora?"
        message={`Encontramos ${integrateCount} publicação(ões). Deseja integrar agora?`}
        warningMessage="Se escolher 'Deixar pendente', elas ficarão na aba Pendentes para integração posterior."
        confirmText={integrateLoading ? 'Integrando...' : '✅ Integrar agora'}
        cancelText="⏸️ Deixar pendente"
        onConfirm={handleConfirmIntegrate}
        onCancel={() => setShowIntegrateConfirm(false)}
      />

      <PublicationDeleteDialogs
        showConfirm={showDeleteConfirmDialog}
        pendingDeletePublication={pendingDeletePublication}
        onConfirm={() => {
          if (pendingDeletePublication?.count && pendingDeletePublication.isDeleteAll) {
            confirmDeleteAll();
          } else if (pendingDeletePublication?.count) {
            confirmDeleteSelected();
          } else {
            confirmDeleteSingle();
          }
        }}
        onCancelConfirm={() => {
          setShowDeleteConfirmDialog(false);
          setPendingDeletePublication(null);
        }}
        showBlocked={showDeleteBlockedDialog}
        blockedMessage={deleteBlockedMessage}
        onCloseBlocked={() => setShowDeleteBlockedDialog(false)}
      />
    </div>
  );
}
