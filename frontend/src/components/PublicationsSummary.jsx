import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PublicationsSummary.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const STORAGE_KEY = 'last_publications_check';

export default function PublicationsSummary() {
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [count, setCount] = useState(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar última busca do localStorage
    loadLastCheck();
  }, []);

  const loadLastCheck = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setLastCheck(new Date(data.timestamp));
        setCount(data.count);
      }
    } catch (err) {
      console.error('Erro ao carregar última busca:', err);
    }
  };

  const fetchTodayPublications = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/publications/today`);
      const data = await response.json();
      
      if (data.success) {
        const newCount = data.total_publicacoes || 0;
        const timestamp = new Date();
        
        // Salvar no localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          timestamp: timestamp.toISOString(),
          count: newCount,
          date: timestamp.toISOString().split('T')[0]
        }));
        
        setCount(newCount);
        setLastCheck(timestamp);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Erro ao buscar publicações:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPublications = (e) => {
    e.stopPropagation();
    navigate('/publications');
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
      {/* Status da última busca */}
      {lastCheck ? (
        <div className="last-check-info">
          <p className="last-check-label">Última busca:</p>
          <p className="last-check-time">{formatLastCheck(lastCheck)}</p>
          
          {count !== null && (
            <div className="check-result">
              {count > 0 ? (
                <>
                  <span className="result-count">{count}</span>
                  <span className="result-label">
                    {count === 1 ? 'publicação' : 'publicações'}
                  </span>
                </>
              ) : (
                <span className="result-none">Nenhuma publicação</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="no-check-info">
          <p>🔍 Nenhuma busca realizada hoje</p>
        </div>
      )}

      {/* Botões de ação */}
      <div className="summary-actions">
        <button 
          className="btn-fetch"
          onClick={fetchTodayPublications}
          disabled={loading}
        >
          {loading ? '⏳ Buscando...' : '🔄 Buscar Publicações'}
        </button>
        
        {count !== null && count > 0 && (
          <button 
            className="btn-view"
            onClick={handleViewPublications}
          >
            👁️ Ver Detalhes
          </button>
        )}
      </div>

      {error && (
        <p className="error-message">⚠️ Erro na consulta</p>
      )}
    </div>
  );
}
