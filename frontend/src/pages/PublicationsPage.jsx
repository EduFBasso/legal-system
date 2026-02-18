import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicationsContext } from '../contexts/PublicationsContext';
import { useSettings } from '../contexts/SettingsContext';
import PublicationsSearchForm from '../components/PublicationsSearchForm';
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

      {/* Publications List */}
      <PublicationsList
        publications={publications}
        loading={loading}
        searchParams={searchParams}
        onCardClick={openModal}
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
