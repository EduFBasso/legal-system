import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PublicationsSummary.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function PublicationsSummary() {
  const [loading, setLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar última busca da API
    loadLastSearch();
    
    // Listener para atualizações de busca
    const handleSearchUpdate = () => {
      loadLastSearch();
    };
    
    window.addEventListener('publicationsSearchCompleted', handleSearchUpdate);
    
    // Recarregar a cada 30 segundos (fallback)
    const interval = setInterval(() => {
      loadLastSearch();
    }, 30000);
    
    return () => {
      window.removeEventListener('publicationsSearchCompleted', handleSearchUpdate);
      clearInterval(interval);
    };
  }, []);

  const loadLastSearch = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/publications/last-search`);
      const data = await response.json();
      if (data.success && data.last_search) {
        setLastSearch(data.last_search);
      }
    } catch (err) {
      console.error('Erro ao carregar última busca:', err);
    }
  };

  const handleSearchToday = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/publications/today`);
      const data = await response.json();
      
      if (data.success) {
        const hasPublications = data.total_publicacoes > 0;
        
        if (hasPublications) {
          // Atualizar última busca e navegar
          await loadLastSearch();
          window.dispatchEvent(new Event('publicationsSearchCompleted'));
          navigate('/publications', { state: { loadLastSearch: true } });
        } else {
          // Sem publicações hoje - mantém última busca
          // Apenas atualiza o lastSearch para refletir a busca vazia
          await loadLastSearch();
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Erro ao buscar publicações de hoje:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
          onClick={() => navigate('/publications', { state: { loadLastSearch: true } })}
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
          <p>🔍 Nenhuma busca realizada</p>
        </div>
      )}

      {/* Botão de ação */}
      <div className="summary-actions">
        <button 
          className="btn-search-today"
          onClick={handleSearchToday}
          disabled={loading}
        >
          {loading ? '⏳ Buscando...' : '🔍 Buscar Hoje'}
        </button>
      </div>

      {error && (
        <p className="error-message">⚠️ Erro na consulta</p>
      )}
    </div>
  );
}
