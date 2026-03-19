import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePublicationsContext } from '../contexts/PublicationsContext';
import './PublicationsSummary.css';

/**
 * Componente para exibir resumo da última busca na sidebar
 * Usa Context API para acessar estado global de publicações
 */
export default function PublicationsSummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Obter estado e ações do contexto
  const { lastSearch, searchToday, fetchLastSearch } = usePublicationsContext();

  /**
   * Carrega última busca ao montar e atualiza periodicamente
   */
  useEffect(() => {
    // Carregar última busca da API
    fetchLastSearch();
    
    // Listener para atualizações de busca
    const handleSearchUpdate = () => {
      fetchLastSearch();
    };
    
    window.addEventListener('publicationsSearchCompleted', handleSearchUpdate);
    
    // Recarregar a cada 30 segundos (fallback)
    const interval = setInterval(() => {
      fetchLastSearch();
    }, 30000);
    
    return () => {
      window.removeEventListener('publicationsSearchCompleted', handleSearchUpdate);
      clearInterval(interval);
    };
  }, [fetchLastSearch]);

  /**
   * Lida com clique no card da última busca
   * Usa evento customizado se já estiver na página de publicações
   */
  const handleCardClick = () => {
    // Se já estiver na página de publicações, dispara evento customizado
    if (location.pathname === '/publications') {
      window.dispatchEvent(new Event('reloadPublicationsFromSidebar'));
    } else {
      // Se estiver em outra página, navega normalmente
      navigate('/publications', { state: { loadLastSearch: true } });
    }
  };

  /**
   * Busca publicações de hoje
   * Usa a ação do contexto e gerencia estado local de loading
   */
  const handleSearchToday = async () => {
    setLoading(true);
    setError(false);
    
    try {
      await searchToday();
      
      // Atualizar informações e navegar se houver publicações
      await fetchLastSearch();
      window.dispatchEvent(new Event('publicationsSearchCompleted'));
      
      // Sempre navega para a página de publicações após buscar
      if (location.pathname !== '/publications') {
        navigate('/publications', { state: { loadLastSearch: true } });
      }
    } catch (err) {
      console.error('Erro ao buscar publicações de hoje:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formata data da última busca
   */
  const formatLastCheck = (date) => {
    if (!date) return null;
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const timeStr = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (isToday) {
      return `hoje às ${timeStr}`;
    }
    
    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${dateStr} às ${timeStr}`;
  };

  // Estado de carregamento
  if (loading) {
    return (
      <div className="publications-summary loading">
        <div className="summary-spinner"></div>
        <p>Consultando tribunais...</p>
      </div>
    );
  }

  return (
    <div className="publications-summary">
      {/* Status da última busca - CLICÁVEL */}
      {lastSearch ? (
        <div 
          className="last-check-info clickable"
          onClick={handleCardClick}
          title="Clique para carregar esta busca do histórico"
        >
          <p className="last-check-label">ÚLTIMA BUSCA</p>
          <p className="last-check-time">
            {formatLastCheck(new Date(lastSearch.executed_at))}
          </p>
          
          <div className="check-result">
            {lastSearch.total_publicacoes > 0 ? (
              <>
                <span className="result-count">{lastSearch.total_publicacoes}</span>
                <span className="result-label">
                  {lastSearch.total_publicacoes === 1 ? 'publicação' : 'publicações'}
                </span>
                {lastSearch.total_novas > 0 && (
                  <span className="new-badge">+ {lastSearch.total_novas}</span>
                )}
              </>
            ) : (
              <span className="result-none">Nenhuma publicação</span>
            )}
          </div>
        </div>
      ) : (
        <div className="no-check-info">
          <p className="no-check-message">📋 Nenhuma busca recente</p>
          <p className="no-check-hint">Clique em "Buscar Hoje" para iniciar (inclui ontem)</p>
        </div>
      )}

      {/* Botão de ação */}
      <div className="summary-actions">
        <button 
          className="btn-search-today"
          onClick={handleSearchToday}
          disabled={loading}
        >
          {loading ? '⏳ Buscando...' : '🔍 Buscar Hoje (inclui ontem)'}
        </button>
      </div>

      {error && (
        <p className="error-message">⚠️ Erro na consulta</p>
      )}
    </div>
  );
}
