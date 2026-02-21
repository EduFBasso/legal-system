import { useState, useEffect, useCallback } from 'react';
import casesService from '../services/casesService';
import CaseCard from '../components/CaseCard';
import CaseDetailModal from '../components/CaseDetailModal';
import Toast from '../components/common/Toast';
import './CasesPage.css';

/**
 * Cases Page - Manage legal cases/processes
 */
export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    tribunal: '',
    status: '',
    auto_status: '',
    comarca: '',
    ordering: '-data_ultima_movimentacao',
  });

  /**
   * Load cases from API
   */
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await casesService.getAll(filters);
      setCases(response.results || []);
    } catch (error) {
      console.error('Error loading cases:', error);
      setToast({
        message: 'Erro ao carregar processos: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const statsData = await casesService.getStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [filters]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadCases();
    loadStats();
  }, [loadCases, loadStats]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Handle search submit
   */
  const handleSearch = (e) => {
    e.preventDefault();
    loadCases();
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      tribunal: '',
      status: '',
      auto_status: '',
      comarca: '',
      ordering: '-data_ultima_movimentacao',
    });
  };

  /**
   * Open case detail modal
   */
  const openCaseDetail = (caseItem) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setSelectedCase(null);
    setIsModalOpen(false);
  };

  /**
   * Handle case update
   */
  const handleCaseUpdate = async (updatedCase) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    setToast({
      message: 'Processo atualizado com sucesso!',
      type: 'success'
    });
    await loadStats();
  };

  /**
   * Handle case delete
   */
  const handleCaseDelete = async (caseId) => {
    const confirmMsg = 'Tem certeza que deseja deletar este processo?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await casesService.delete(caseId, 'Deleted by user');
      setCases(prev => prev.filter(c => c.id !== caseId));
      setToast({
        message: 'Processo deletado com sucesso!',
        type: 'success'
      });
      closeModal();
      await loadStats();
    } catch (error) {
      setToast({
        message: 'Erro ao deletar processo: ' + error.message,
        type: 'error'
      });
    }
  };

  return (
    <div className="cases-page">
      <div className="cases-header">
        <h1>Processos</h1>
        <button className="btn btn-primary" onClick={() => openCaseDetail(null)}>
          + Novo Processo
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="cases-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card stat-active">
            <div className="stat-value">{stats.ativos || 0}</div>
            <div className="stat-label">Ativos</div>
          </div>
          <div className="stat-card stat-inactive">
            <div className="stat-value">{stats.inativos || 0}</div>
            <div className="stat-label">Inativos</div>
          </div>
          {stats.by_tribunal && Object.keys(stats.by_tribunal).length > 0 && (
            <div className="stat-card">
              <div className="stat-value">{Object.keys(stats.by_tribunal).length}</div>
              <div className="stat-label">Tribunais</div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="cases-filters">
        <form onSubmit={handleSearch} className="filters-form">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Buscar por número, título, parte..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input filter-search"
            />
            
            <select
              value={filters.tribunal}
              onChange={(e) => handleFilterChange('tribunal', e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os Tribunais</option>
              <option value="TJSP">TJSP</option>
              <option value="STF">STF</option>
              <option value="STJ">STJ</option>
              <option value="TRF1">TRF1</option>
              <option value="TRF2">TRF2</option>
              <option value="TRF3">TRF3</option>
              <option value="TRF4">TRF4</option>
              <option value="TRF5">TRF5</option>
              <option value="TST">TST</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">Todos os Status</option>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="SUSPENSO">Suspenso</option>
              <option value="ARQUIVADO">Arquivado</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>

            <select
              value={filters.auto_status}
              onChange={(e) => handleFilterChange('auto_status', e.target.value)}
              className="filter-select"
            >
              <option value="">Auto-Status</option>
              <option value="ATIVO">Ativo (&lt;90d)</option>
              <option value="INATIVO">Inativo (&gt;90d)</option>
            </select>

            <select
              value={filters.ordering}
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
              className="filter-select"
            >
              <option value="-data_ultima_movimentacao">Mais Recentes</option>
              <option value="data_ultima_movimentacao">Mais Antigos</option>
              <option value="-data_distribuicao">Data Distribuição ↓</option>
              <option value="data_distribuicao">Data Distribuição ↑</option>
              <option value="titulo">Título A-Z</option>
              <option value="-titulo">Título Z-A</option>
            </select>

            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
            
            <button type="button" onClick={clearFilters} className="btn btn-secondary">
              Limpar
            </button>
          </div>
        </form>
      </div>

      {/* Cases List */}
      <div className="cases-list-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando processos...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum processo encontrado</p>
            <p className="empty-state-hint">
              Ajuste os filtros ou crie um novo processo
            </p>
          </div>
        ) : (
          <div className="cases-list">
            {cases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                caseData={caseItem}
                onClick={() => openCaseDetail(caseItem)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Case Detail Modal */}
      {isModalOpen && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={closeModal}
          onUpdate={handleCaseUpdate}
          onDelete={handleCaseDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
