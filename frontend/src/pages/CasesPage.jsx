import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import casesService from '../services/casesService';
import CaseCard from '../components/CaseCard';
import Toast from '../components/common/Toast';
import './CasesPage.css';

/**
 * Cases Page - Manage legal cases/processes
 */
export default function CasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [allTribunals, setAllTribunals] = useState({});
  const [showTribunalBreakdown, setShowTribunalBreakdown] = useState(false);
  const [selectedTribunals, setSelectedTribunals] = useState([]);
  
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
      // Handle both paginated and non-paginated responses
      setCases(Array.isArray(response) ? response : (response.results || []));
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
      
      // Load all tribunals (without tribunal filter) for breakdown list
      if (Object.keys(allTribunals).length === 0) {
        const filtersWithoutTribunal = { ...filters, tribunal: '' };
        const allStatsData = await casesService.getStats(filtersWithoutTribunal);
        setAllTribunals(allStatsData.by_tribunal || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [filters, allTribunals]);

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
    setSelectedTribunals([]);
    setShowTribunalBreakdown(false);
  };

  /**
   * Quick filter by status
   */
  const filterByStatus = (status) => {
    setFilters(prev => ({
      ...prev,
      status: status,
      search: '',
      tribunal: '',
    }));
    setSelectedTribunals([]);
    setShowTribunalBreakdown(false);
  };

  /**
   * Toggle tribunal selection
   */
  const toggleTribunal = (tribunal) => {
    setSelectedTribunals(prev => {
      const newSelection = prev.includes(tribunal)
        ? prev.filter(t => t !== tribunal)
        : [...prev, tribunal];
      
      // Update filters with selected tribunals
      setFilters(f => ({
        ...f,
        tribunal: newSelection.length > 0 ? newSelection.join(',') : ''
      }));
      
      // Close breakdown if no tribunals selected
      if (newSelection.length === 0) {
        setShowTribunalBreakdown(false);
      }
      
      return newSelection;
    });
  };

  /**
   * Open case detail page
   */
  const openCaseDetail = (caseItem) => {
    if (caseItem) {
      // Navigate to existing case detail page
      navigate(`/cases/${caseItem.id}`);
    } else {
      // Open new case page in new window
      window.open('/cases/new', '_blank', 'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes');
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
          <div 
            className={`stat-card stat-clickable ${!filters.status && !filters.tribunal ? 'stat-selected' : ''}`}
            onClick={clearFilters} 
            title="Ver todos os processos"
          >
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total</div>
          </div>
          <div 
            className={`stat-card stat-active stat-clickable ${filters.status === 'ATIVO' ? 'stat-selected' : ''}`}
            onClick={() => filterByStatus('ATIVO')} 
            title="Filtrar por processos ativos"
          >
            <div className="stat-value">{stats.ativos || 0}</div>
            <div className="stat-label">Ativos</div>
          </div>
          <div 
            className={`stat-card stat-inactive stat-clickable ${filters.status === 'INATIVO' ? 'stat-selected' : ''}`}
            onClick={() => filterByStatus('INATIVO')} 
            title="Filtrar por processos inativos"
          >
            <div className="stat-value">{stats.inativos || 0}</div>
            <div className="stat-label">Inativos</div>
          </div>
          {allTribunals && Object.keys(allTribunals).length > 0 && (
            <div 
              className={`stat-card stat-clickable stat-tribunal ${selectedTribunals.length > 0 ? 'stat-selected' : ''}`}
              onClick={() => setShowTribunalBreakdown(!showTribunalBreakdown)}
              title="Clique para selecionar tribunais"
            >
              <div className="stat-value">{Object.keys(allTribunals).length}</div>
              <div className="stat-label">
                Tribunais {showTribunalBreakdown ? '▲' : '▼'}
                {selectedTribunals.length > 0 && ` (${selectedTribunals.length})`}
              </div>
              
              {showTribunalBreakdown && (
                <div className="tribunal-breakdown" onClick={(e) => e.stopPropagation()}>
                  {Object.entries(allTribunals).map(([tribunal, count]) => (
                    <label 
                      key={tribunal} 
                      className="tribunal-item"
                      title={`Filtrar por ${tribunal}`}
                    >
                      <div className="tribunal-checkbox-group">
                        <input
                          type="checkbox"
                          checked={selectedTribunals.includes(tribunal)}
                          onChange={() => toggleTribunal(tribunal)}
                          className="tribunal-filter-checkbox"
                        />
                        <span className="tribunal-name">{tribunal}</span>
                      </div>
                      <span className="tribunal-count">{count}</span>
                    </label>
                  ))}
                </div>
              )}
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

      {/* Toast */}
      {toast && (
        <Toast
          isOpen={true}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
