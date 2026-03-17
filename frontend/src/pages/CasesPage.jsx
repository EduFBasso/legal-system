import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import casesService from '../services/casesService';
import CaseCard from '../components/CaseCard';
import Toast from '../components/common/Toast';
import CasesFilters from '../components/CasesFilters';
import { openCaseDetailWindow, openCreateCaseWindow } from '../utils/publicationNavigation';
import './CasesPage.css';

/**
 * Cases Page - Manage legal cases/processes
 */
export default function CasesPage() {
  const [searchParams] = useSearchParams();
  const debounceTimerRef = useRef(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [allTribunals, setAllTribunals] = useState({});
  const [showTribunalBreakdown, setShowTribunalBreakdown] = useState(false);
  const [selectedTribunals, setSelectedTribunals] = useState([]);

  const linkAction = searchParams.get('action');
  const linkContactId = parseInt(searchParams.get('contactId') || '', 10);
  const isLinkMode = linkAction === 'link' && Number.isInteger(linkContactId) && linkContactId > 0;
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
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
      const statsData = await casesService.getStats({});
      setStats(statsData);
      
      if (Object.keys(allTribunals).length === 0) {
        setAllTribunals(statsData.by_tribunal || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [allTribunals]);

  /**
   * Initial load - load stats and cases
   */
  useEffect(() => {
    loadStats();
  }, [allTribunals]);

  /**
   * Handle filter changes (search has debounce, ordering is immediate)
   */
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Search: debounce 300ms
    // Ordering: immediate
    if (filters.search !== '') {
      debounceTimerRef.current = setTimeout(() => {
        loadCases();
      }, 300);
    } else {
      // No search, load immediately
      loadCases();
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters]);

  /**
   * Handle filter changes (search and ordering)
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Toggle ordering between ascending and descending
   */
  const toggleOrdering = () => {
    setFilters(prev => ({
      ...prev,
      ordering: prev.ordering === '-data_ultima_movimentacao' 
        ? 'data_ultima_movimentacao'
        : '-data_ultima_movimentacao'
    }));
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      search: '',
      ordering: '-data_ultima_movimentacao',
    });
    setSelectedTribunals([]);
    setShowTribunalBreakdown(false);
  };

  /**
   * Open case detail page
   */
  const openCaseDetail = (caseItem) => {
    if (caseItem) {
      if (isLinkMode) {
        openCaseDetailWindow(caseItem.id, {
          tab: 'parties',
          action: 'link',
          contactId: linkContactId,
        });
        return;
      }

      // Open existing case detail page in new tab
      openCaseDetailWindow(caseItem.id);
    } else {
      // Open new case page in new tab
      openCreateCaseWindow();
    }
  };

  const linkedCasesById = useMemo(() => {
    const groupsByClientId = new Map();

    cases.forEach((caseItem) => {
      const clientId = caseItem?.cliente_principal;
      if (!clientId) return;

      if (!groupsByClientId.has(clientId)) {
        groupsByClientId.set(clientId, []);
      }
      groupsByClientId.get(clientId).push(caseItem);
    });

    const links = new Map();

    groupsByClientId.forEach((groupCases) => {
      if (groupCases.length < 2) return;

      groupCases.forEach((currentCase) => {
        const related = groupCases
          .filter((otherCase) => otherCase.id !== currentCase.id)
          .map((otherCase) => ({
            id: otherCase.id,
            numero_processo: otherCase.numero_processo,
            numero_processo_formatted: otherCase.numero_processo_formatted,
            status_display: otherCase.status_display,
            cliente_nome: otherCase.cliente_nome,
          }));

        links.set(currentCase.id, related);
      });
    });

    return links;
  }, [cases]);

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
            className={`stat-card stat-clickable ${filters.search === '' ? 'stat-selected' : ''}`}
            onClick={clearFilters} 
            title="Ver todos os processos"
          >
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total</div>
          </div>
          <div 
            className={`stat-card stat-active stat-clickable`}
            title="Processos ativos (movimentação < 90 dias)"
          >
            <div className="stat-value">{stats.ativos || 0}</div>
            <div className="stat-label">Ativos</div>
          </div>
          <div 
            className={`stat-card stat-inactive stat-clickable`}
            title="Processos inativos (sem movimentação > 90 dias)"
          >
            <div className="stat-value">{stats.inativos || 0}</div>
            <div className="stat-label">Inativos</div>
          </div>
          {allTribunals && Object.keys(allTribunals).length > 0 && (
            <div 
              className={`stat-card stat-clickable stat-tribunal ${selectedTribunals.length > 0 ? 'stat-selected' : ''}`}
              onClick={() => setShowTribunalBreakdown(!showTribunalBreakdown)}
              title="Clique para expandir lista de tribunais"
            >
              <div className="stat-value">{Object.keys(allTribunals).length}</div>
              <div className="stat-label">
                Tribunais {showTribunalBreakdown ? '▲' : '▼'}
              </div>
              
              {showTribunalBreakdown && (
                <div className="tribunal-breakdown" onClick={(e) => e.stopPropagation()}>
                  {Object.entries(allTribunals).map(([tribunal, count]) => (
                    <div 
                      key={tribunal} 
                      className="tribunal-item"
                      title={tribunal}
                    >
                      <span className="tribunal-name">{tribunal}</span>
                      <span className="tribunal-count">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <CasesFilters
        searchQuery={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        isAscending={filters.ordering === 'data_ultima_movimentacao'}
        onOrderingToggle={toggleOrdering}
        totalCount={cases.length || 0}
        filteredCount={cases.length || 0}
      />

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
                linkedCases={linkedCasesById.get(caseItem.id) || []}
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
