import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePublicationsContext } from '../contexts/PublicationsContext';
import { usePublicationNotificationRead } from '../hooks/usePublicationNotificationRead';
import publicationsService from '../services/publicationsService';
import PublicationsSearchForm from  '../components/PublicationsSearchForm';
import PublicationsList from '../components/PublicationsList';
import PublicationsStats from '../components/PublicationsStats';
import PublicationDetailModal from '../components/PublicationDetailModal';
import Toast from '../components/common/Toast';
import PublicationDeleteDialogs from '../components/publications/PublicationDeleteDialogs';
import {
  getPublicationDeleteBlockedMessage,
  getPublicationDeleteSuccessMessage,
} from '../utils/publicationDeleteFeedback';
import { formatNumeroProcessoShort } from '../utils/publicationActionState';
import {
  openCaseDetailWindow,
  openCaseMovementsWindow,
  openCreateCaseFromPublicationWindow,
} from '../utils/publicationNavigation';
import './PublicationsPage.css';

/**
 * Página principal de publicações
 * Usa Context API e componentes modulares para maior manutenibilidade
 */
export default function PublicationsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const markPublicationNotificationAsRead = usePublicationNotificationRead();
  
  // Estado de seleção para exclusão
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteBlockedDialog, setShowDeleteBlockedDialog] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeletePublication, setPendingDeletePublication] = useState(null);
  const [selectedPublication, setSelectedPublication] = useState(null);
  
  // Obter estado e ações do contexto
  const {
    publications,
    loading,
    searchParams,
    lastSearch,
    toast,
    search,
    loadLastSearch,
    hideToast,
    showToast
  } = usePublicationsContext();
  const notifyPublicationsUpdated = useCallback(() => {
    window.dispatchEvent(new Event('publicationsSearchCompleted'));
  }, []);

  /**
   * Handler para busca com filtros
   * Se a busca retornou publicações (> 0), redireciona para Histórico de Buscas
   */
  const handleSearch = useCallback(async (filters) => {
    const result = await search({
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      tribunais: filters.tribunais,
    });

    if (result?.success && result.total_publicacoes > 0) {
      // A busca em si dispara toast de sucesso ("X publicações encontrada(s)").
      // Como aqui redirecionamos para o Histórico, esse toast fica sem contexto e reaparece ao voltar.
      // Mantemos warning/error (ex: falhas em tribunais), então só limpamos quando não houver erros.
      const hasTribunalErrors = Array.isArray(result.erros) && result.erros.length > 0;
      if (!hasTribunalErrors) {
        hideToast();
      }
      navigate('/search-history', { state: { fromPublicationsSearch: true } });
    }
  }, [search, navigate, hideToast]);

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
        notifyPublicationsUpdated();
      } else {
          setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
            result,
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
    const linkedToCase =
      !!pub?.case_id ||
      pub?.integration_status === 'INTEGRATED' ||
      !!pub?.has_integrated_movement;

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
        notifyPublicationsUpdated();
      } else {
          setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
            result,
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
      const processoShort = formatNumeroProcessoShort(pub.case_suggestion.numero_processo);
      // Tem case_suggestion - perguntar se deseja vincular
      const confirmed = window.confirm(
        processoShort
          ? `Vincular ao processo ${processoShort}...?`
          : `Vincular ao caso #${pub.case_suggestion.id}?`
      );
      if (!confirmed) return;

      try {
        const result = await publicationsService.integratePublication(pub.id_api, {
          caseId: pub.case_suggestion.id,
          createMovement: true
        });

        if (result.success) {
          showToast('✅ Publicação integrada com sucesso!', 'success');
          openCaseMovementsWindow(pub.case_suggestion.id);
          await loadLastSearch();
          notifyPublicationsUpdated();
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
      if (confirmed) {
        // Já é o estado padrão após a busca (integration_status=PENDING).
        // Evita chamar /integrate sem case_id (backend exige case_id).
        showToast('⏸️ Publicação mantida pendente', 'info');
        return;
      }

      openCreateCaseFromPublicationWindow(pub.id_api);
    }
  };

  /**
   * Handler para criar novo caso a partir de uma publicação
   */
  const handleCreateCaseSingle = async (pub) => {
    // Se o usuário está criando caso a partir da publicação, não faz sentido
    // manter a notificação como “não lida” no sidebar/página de notificações.
    markPublicationNotificationAsRead(pub?.id_api);

    try {
      const latest = await publicationsService.getPublicationById(pub.id_api);
      const latestPublication = latest?.publication;
      const linkedCaseId = latestPublication?.case_id;
      const suggestedCaseId = latestPublication?.case_suggestion?.id;

      if (linkedCaseId) {
        showToast(`✅ Publicação já vinculada ao caso #${linkedCaseId}`, 'success');
        openCaseDetailWindow(linkedCaseId);
        await loadLastSearch();
        return;
      }

      if (suggestedCaseId) {
        const result = await publicationsService.integratePublication(pub.id_api, {
          caseId: suggestedCaseId,
          createMovement: true,
        });

        if (result.success) {
          showToast(`✅ Publicação vinculada ao caso #${suggestedCaseId}`, 'success');
          await loadLastSearch();
          notifyPublicationsUpdated();
          return;
        }
      }

      openCreateCaseFromPublicationWindow(pub.id_api);
    } catch {
      openCreateCaseFromPublicationWindow(pub.id_api);
    }
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
        notifyPublicationsUpdated();
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
          setSelectedPublication(pub);
        }}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectPublication}
        onDelete={handleDeleteSingle}
        showActionButtons={true}
        onIntegrate={handleIntegrateSingle}
        onCreateCase={handleCreateCaseSingle}
      />

      {selectedPublication && (
        <PublicationDetailModal
          publication={selectedPublication}
          onClose={() => setSelectedPublication(null)}
        />
      )}

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          isOpen={toast.show}
          message={toast.message}
          type={toast.type}
          autoCloseMs={
            toast.type === 'warning' && String(toast.message || '').includes('Para buscar publicações')
              ? 8000
              : 3000
          }
          onClose={hideToast}
        />
      )}

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
