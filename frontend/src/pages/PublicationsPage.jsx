import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicationsContext } from '../contexts/PublicationsContext';
import { useSettings } from '../contexts/SettingsContext';
import publicationsService from '../services/publicationsService';
import PublicationsSearchForm from  '../components/PublicationsSearchForm';
import PublicationsList from '../components/PublicationsList';
import PublicationsStats from '../components/PublicationsStats';
import PublicationDetailModal from '../components/PublicationDetailModal';
import Toast from '../components/common/Toast';
import './PublicationsPage.css';

/**
 * Página principal de publicações
 * Usa Context API e componentes modulares para maior manutenibilidade
 */
export default function PublicationsPage() {
  const { settings } = useSettings();
  const location = useLocation();
  
  // Estado de seleção para exclusão
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Obter estado e ações do contexto
  const {
    publications,
    loading,
    searchParams,
    lastSearch,
    selectedPublication,
    isModalOpen,
    toast,
    search,
    loadLastSearch,
    openModal,
    closeModal,
    hideToast
  } = usePublicationsContext();

  /**
   * Handler para busca com filtros
   * Adiciona retroactiveDays do settings
   */
  const handleSearch = useCallback(async (filters) => {
    const retroactiveDays = settings.retroactiveDays ?? 7;
    
    await search({
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      tribunais: filters.tribunais,
      retroactiveDays
    });
  }, [search, settings.retroactiveDays]);

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

  /**
   * Handler para deletar publicações selecionadas
   */
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmMsg = `Apagar ${selectedIds.size} publicação(ões) selecionada(s)? Esta ação não pode ser desfeita.`;
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const result = await publicationsService.deleteMultiplePublications(Array.from(selectedIds));
      
      if (result.success) {
        const msg = `${result.deleted} publicação(ões) marcada(s) como deletadas!`;
        const notifMsg = result.notifications_updated > 0 
          ? `\n${result.notifications_updated} notificação(ões) relacionada(s) marcadas como lidas.` 
          : '';
        alert(msg + notifMsg);
        setSelectedIds(new Set());
        setSelectionMode(false);
        // Recarregar lista
        await loadLastSearch();
      } else {
        alert(`Erro ao deletar: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert(`Erro ao deletar publicações: ${error.message}`);
    }
  };

  /**
   * Handler para deletar TODAS as publicações
   */
  const handleDeleteSingle = async (idApi) => {
    if (!window.confirm('Marcar esta publicação como deletada? Ela será ocultada mas permanecerá no banco para auditoria.')) {
      return;
    }

    try {
      const result = await publicationsService.deletePublication(idApi);
      
      if (result.success) {
        const notifMsg = result.notifications_updated > 0 
          ? `\n${result.notifications_updated} notificação(ões) relacionada(s) marcadas como lidas.` 
          : '';
        alert(`Publicação marcada como deletada!${notifMsg}`);
        // Recarregar lista
        await loadLastSearch();
      } else {
        alert(`Erro ao deletar: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert(`Erro ao deletar publicação: ${error.message}`);
    }
  };

  const handleDeleteAll = async () => {
    const totalCount = publications.length;
    if (totalCount === 0) return;
    
    const confirmMsg = `Marcar TODAS as ${totalCount} publicações como deletadas?\n\nAs publicações serão ocultadas mas permanecerão no banco para auditoria.\nO histórico de buscas será removido.\nNotificações relacionadas serão marcadas como lidas.`;
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const result = await publicationsService.deleteAllPublications();
      
      if (result.success) {
        const msg = `Todas as ${result.deleted} publicações foram marcadas como deletadas!`;
        const notifMsg = result.notifications_updated > 0
          ? `\n${result.notifications_updated} notificação(ões) relacionada(s) marcadas como lidas.`
          : '';
        const historyMsg = result.history_deleted > 0
          ? `\n${result.history_deleted} registro(s) de histórico removidos.`
          : '';
        alert(msg + notifMsg + historyMsg);
        setSelectedIds(new Set());
        setSelectionMode(false);
        // Recarregar lista
        await loadLastSearch();
      } else {
        alert(`Erro ao deletar: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert(`Erro ao deletar todas publicações: ${error.message}`);
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
          <p className="header-subtitle">
            {publications.length > 0 ? (
              `${publications.length} ${publications.length === 1 ? 'publicação encontrada' : 'publicações encontradas'}`
            ) : (
              'Selecione os filtros e busque publicações'
            )}
          </p>
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
        onCardClick={openModal}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectPublication}
        onDelete={handleDeleteSingle}
      />

      {/* Detail Modal */}
      {selectedPublication && (
        <PublicationDetailModal
          isOpen={isModalOpen}
          onClose={closeModal}
          publication={selectedPublication}
        />
      )}

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
