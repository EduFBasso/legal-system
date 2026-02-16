import { useState, useEffect, useCallback } from 'react';
import PublicationCard from '../components/PublicationCard';
import PublicationDetailModal from '../components/PublicationDetailModal';
import PublicationsSearchForm from '../components/PublicationsSearchForm';
import Toast from '../components/common/Toast';
import './PublicationsPage.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function PublicationsPage() {
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useState(null);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const displayToast = (message, type = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSearch = useCallback(async (filters) => {
    setLoading(true);
    setSearchParams(filters);
    
    try {
      // Construir query string
      const params = new URLSearchParams();
      params.append('data_inicio', filters.dataInicio);
      params.append('data_fim', filters.dataFim);
      filters.tribunais.forEach(t => params.append('tribunais', t));

      const response = await fetch(`${API_BASE_URL}/publications/search?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        const pubs = data.publicacoes || [];
        setPublications(pubs);

        if (pubs.length === 0) {
          displayToast('Nenhuma publicação encontrada para os filtros selecionados', 'info');
        } else {
          displayToast(
            `✅ ${data.total_publicacoes} publicações encontradas (${data.total_tribunais_consultados} tribunais × 2 buscas)`,
            'success'
          );
        }
      } else {
        displayToast('Erro ao buscar publicações', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar publicações:', error);
      displayToast('Erro ao conectar com o servidor', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePublicationClick = (publication) => {
    setSelectedPublication(publication);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPublication(null);
  };

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

      {/* Search Summary */}
      {searchParams && publications.length > 0 && (
        <div className="search-summary">
          <div className="summary-item">
            <span className="summary-label">📅 Período:</span>
            <span className="summary-value">
              {new Date(searchParams.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até {new Date(searchParams.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">⚖️ Tribunais:</span>
            <span className="summary-value">{searchParams.tribunais.join(', ')}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">📊 Resultados:</span>
            <span className="summary-value">{publications.length} {publications.length === 1 ? 'publicação' : 'publicações'}</span>
          </div>
        </div>
      )}

      {/* Publications List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Consultando tribunais selecionados...</p>
          <p className="loading-hint">2 buscas por tribunal: OAB + Nome da Advogada</p>
        </div>
      ) : publications.length === 0 && searchParams ? (
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Nenhuma publicação encontrada</p>
          <p className="empty-hint">Tente ajustar os filtros ou selecionar outro período</p>
        </div>
      ) : publications.length === 0 && !searchParams ? (
        <div className="empty-state">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>Pronto para buscar publicações</p>
          <p className="empty-hint">Configure os filtros acima e clique em "Buscar Publicações"</p>
        </div>
      ) : (
        <div className="publications-grid">
          {publications.map((publication) => (
            <PublicationCard
              key={publication.id_api}
              publication={publication}
              onClick={() => handlePublicationClick(publication)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedPublication && (
        <PublicationDetailModal
          publication={selectedPublication}
          onClose={handleCloseModal}
        />
      )}

      {/* Toast Notifications */}
      <Toast
        isOpen={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
        autoCloseMs={3000}
      />
    </div>
  );
}
