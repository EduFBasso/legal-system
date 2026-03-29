import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import casesService from '../services/casesService';
import CaseCard from '../components/CaseCard';
import Toast from '../components/common/Toast';
import CasesFilters from '../components/CasesFilters';
import SearchableCreatableSelectField from '../components/FormFields/SearchableCreatableSelectField';
import { openCaseDetailWindow, openCreateCaseWindow } from '../utils/publicationNavigation';
import './CasesPage.css';

const LINKED_CASE_COMPLETED_STORAGE_KEY = 'legal_system_linked_case_completed';

/**
 * Cases Page - Manage legal cases/processes
 */
export default function CasesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debounceTimerRef = useRef(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [toast, setToast] = useState(null);
  const [linkingVinculo, setLinkingVinculo] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [vinculoTipoOptions, setVinculoTipoOptions] = useState([]);
  const [selectedVinculoTipo, setSelectedVinculoTipo] = useState('');
  const [principalCaseNumber, setPrincipalCaseNumber] = useState('');
  // Mantém o KPI sempre montado (sem esperar fetch) e apenas atualiza números.
  const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0, by_tribunal: {} });
  const [allTribunals, setAllTribunals] = useState({});
  const [showTribunalBreakdown, setShowTribunalBreakdown] = useState(false);
  const [selectedTribunals, setSelectedTribunals] = useState([]);

  const linkAction = searchParams.get('action');
  const linkContactId = parseInt(searchParams.get('contactId') || '', 10);
  const isLinkMode = linkAction === 'link' && Number.isInteger(linkContactId) && linkContactId > 0;

  const targetCaseId = parseInt(searchParams.get('targetCaseId') || '', 10);
  const isSelectPrincipalMode =
    linkAction === 'select-principal' && Number.isInteger(targetCaseId) && targetCaseId > 0;

  const principalCaseId = parseInt(searchParams.get('principalCaseId') || '', 10);
  const isSelectDerivedMode =
    linkAction === 'select-derived' && Number.isInteger(principalCaseId) && principalCaseId > 0;
  const shouldAutoCloseAfterLink = (() => {
    const raw = String(searchParams.get('autoclose') || '').trim().toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
  })();

  const editDerivedCaseId = parseInt(searchParams.get('editDerivedCaseId') || '', 10);
  const editDerivedVinculoTipo = searchParams.get('vinculoTipo') || '';
  const isEditDerivedMode =
    isSelectDerivedMode && Number.isInteger(editDerivedCaseId) && editDerivedCaseId > 0;

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    ordering: '-data_ultima_movimentacao',
  });

  const effectiveFilters = useMemo(() => {
    if (!isSelectDerivedMode) return filters;

    const next = {
      ...filters,
      status: 'ATIVO',
    };

    if (Object.prototype.hasOwnProperty.call(next, 'tribunal')) {
      delete next.tribunal;
    }

    return next;
  }, [filters, isSelectDerivedMode]);

  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim() !== '') ||
    filters.status ||
    filters.tribunal
  );

  /**
   * Load cases from API
   */
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await casesService.getAll(effectiveFilters);
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
  }, [effectiveFilters]);

  /**
   * Load statistics
   */
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const statsData = await casesService.getStats({});
      setStats(statsData);

      // Preenche breakdown 1x sem causar refetch por dependência.
      setAllTribunals((prev) => {
        if (prev && Object.keys(prev).length > 0) return prev;
        return statsData?.by_tribunal || {};
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /**
   * Initial load - load stats and cases
   */
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!isSelectPrincipalMode) return;
    setToast({
      message:
        'Selecione um processo PRINCIPAL para vincular. Ao clicar em um processo, o vínculo será aplicado e o detalhe do processo original será aberto.',
      type: 'info',
      autoCloseMs: 0,
    });
  }, [isSelectPrincipalMode]);

  useEffect(() => {
    if (!isSelectDerivedMode) {
      setSelectedCaseId(null);
      setVinculoTipoOptions([]);
      setSelectedVinculoTipo('');
      setPrincipalCaseNumber('');
      return;
    }
    setSelectedCaseId(isEditDerivedMode ? editDerivedCaseId : null);

    const loadPrincipalCaseInfo = async () => {
      try {
        const principal = await casesService.getById(Number(principalCaseId));
        const numero = String(
          principal?.numero_processo_formatted || principal?.numero_processo || ''
        ).trim();
        setPrincipalCaseNumber(numero);
      } catch {
        setPrincipalCaseNumber('');
      }
    };

    const loadVinculoTipoOptions = async () => {
      try {
        const options = await casesService.getVinculoTipoOptions();
        const normalized = Array.isArray(options)
          ? options.map((opt) => ({
              ...opt,
              value: String(opt?.value || opt?.label || '').trim(),
              label: String(opt?.label || opt?.value || '').trim(),
            })).filter((opt) => opt.value && opt.label)
          : [];

        setVinculoTipoOptions(normalized);

        const normalize = (value) => String(value || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase();

        if (editDerivedVinculoTipo) {
          const editNorm = normalize(editDerivedVinculoTipo);
          const matchedOpt = normalized.find(
            (opt) => normalize(opt.value) === editNorm || normalize(opt.label) === editNorm
          );
          setSelectedVinculoTipo(matchedOpt?.value || editDerivedVinculoTipo);
        } else {
          const preferred = normalized.find((opt) =>
            normalize(opt.value) === 'DERIVADO' || normalize(opt.label) === 'DERIVADO'
          );
          setSelectedVinculoTipo(preferred?.value || normalized[0]?.value || '');
        }
      } catch (error) {
        setToast({
          message: 'Erro ao carregar tipos de vínculo: ' + (error?.message || 'Erro desconhecido'),
          type: 'error',
          autoCloseMs: 0,
        });
      }
    };

    loadPrincipalCaseInfo();
    loadVinculoTipoOptions();
  }, [isSelectDerivedMode, principalCaseId, editDerivedCaseId, editDerivedVinculoTipo, isEditDerivedMode]);

  const handleCreateVinculoTipoOption = async (label) => {
    try {
      const created = await casesService.createVinculoTipoOption(label);
      if (created && typeof created === 'object') {
        setVinculoTipoOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const exists = next.some((opt) => String(opt?.value) === String(created.value));
          if (!exists) next.push(created);
          return next;
        });
        return created;
      }
      return null;
    } catch (error) {
      setToast({
        message: error?.message || 'Erro ao cadastrar tipo de vínculo',
        type: 'error',
        autoCloseMs: 0,
      });
      return null;
    }
  };

  const handleCancelSelectDerived = () => {
    if (!isSelectDerivedMode) return;
    navigate(`/cases/${principalCaseId}`);
  };

  const handleCreateNewFromSelectDerived = () => {
    if (!isSelectDerivedMode) return;
    const parsedPrincipalId = Number(principalCaseId) || 0;
    if (!parsedPrincipalId) return;
    const vinculoTipo = String(selectedVinculoTipo || '').trim();
    if (!vinculoTipo) {
      setToast({
        message: 'Selecione o tipo de vínculo antes de criar um novo processo derivado.',
        type: 'warning',
        autoCloseMs: 0,
      });
      return;
    }
    const params = new URLSearchParams();
    params.set('case_principal', String(parsedPrincipalId));
    params.set('vinculo_tipo', vinculoTipo);
    if (shouldAutoCloseAfterLink) {
      params.set('autoclose', '1');
    }
    navigate(`/cases/new?${params.toString()}`);
  };

  const notifyLinkedCaseCompleted = useCallback((principalId) => {
    const parsedPrincipalId = Number(principalId) || 0;
    if (!parsedPrincipalId) return;

    try {
      window.localStorage.setItem(
        LINKED_CASE_COMPLETED_STORAGE_KEY,
        JSON.stringify({
          principalId: parsedPrincipalId,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
  }, []);

  const handleSaveSelectDerived = async () => {
    if (!isSelectDerivedMode) return;
    if (linkingVinculo) return;
    const derivedId = Number(selectedCaseId) || 0;
    if (!derivedId) return;
    if (derivedId === Number(principalCaseId)) return;
    const vinculoTipo = String(selectedVinculoTipo || '').trim();
    if (!vinculoTipo) {
      setToast({
        message: 'Selecione o tipo de vínculo antes de salvar.',
        type: 'warning',
        autoCloseMs: 0,
      });
      return;
    }

    setLinkingVinculo(true);
    try {
      if (isEditDerivedMode && derivedId !== editDerivedCaseId) {
        // Trocou de processo: desvincula o antigo antes
        await casesService.update(editDerivedCaseId, { case_principal: null, vinculo_tipo: '' });
      }
      await casesService.update(derivedId, {
        classificacao: 'NEUTRO',
        case_principal: Number(principalCaseId),
        vinculo_tipo: vinculoTipo,
      });

      const principalUrl = `/cases/${principalCaseId}?linked=1`;
      if (shouldAutoCloseAfterLink) {
        notifyLinkedCaseCompleted(principalCaseId);
        try {
          window.close();
          return;
        } catch {
          // fallback below
        }
      }

      navigate(principalUrl);
    } catch (error) {
      setToast({
        message: 'Erro ao aplicar vínculo: ' + (error?.message || 'Erro desconhecido'),
        type: 'error',
        autoCloseMs: 0,
      });
    } finally {
      setLinkingVinculo(false);
    }
  };

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
  }, [filters, loadCases]);

  /**
   * Handle filter changes (search and ordering)
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleStatusFilter = (status) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (prev.status === status) {
        delete next.status;
      } else {
        next.status = status;
      }
      return next;
    });
  };

  const toggleTribunal = (tribunal) => {
    setSelectedTribunals((prev) => {
      const next = prev.includes(tribunal)
        ? prev.filter((t) => t !== tribunal)
        : [...prev, tribunal];

      setFilters((prevFilters) => {
        const nextFilters = { ...prevFilters };
        if (next.length > 0) {
          nextFilters.tribunal = next.join(',');
        } else {
          delete nextFilters.tribunal;
        }
        return nextFilters;
      });

      return next;
    });
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
  const openCaseDetail = async (caseItem) => {
    if (caseItem) {
      if (isSelectDerivedMode) {
        const clickedId = Number(caseItem?.id) || null;
        if (!clickedId) return;
        if (clickedId === Number(principalCaseId)) {
          setToast({
            message: 'Você não pode vincular o processo a ele mesmo.',
            type: 'warning',
            autoCloseMs: 0,
          });
          return;
        }
        if (caseItem?.case_principal && clickedId !== editDerivedCaseId) {
          setToast({
            message: 'Por enquanto, selecione um processo NEUTRO (não derivado) para vincular.',
            type: 'warning',
            autoCloseMs: 0,
          });
          return;
        }

        const classificacao = String(caseItem?.classificacao || '').trim().toUpperCase();
        if (classificacao === 'PRINCIPAL') {
          setToast({
            message: 'Por enquanto, selecione um processo NEUTRO (não principal) para vincular.',
            type: 'warning',
            autoCloseMs: 0,
          });
          return;
        }

        setSelectedCaseId(clickedId);
        return;
      }

      if (isSelectPrincipalMode) {
        if (linkingVinculo) return;
        const clickedId = Number(caseItem?.id) || null;
        if (!clickedId) return;
        if (clickedId === Number(targetCaseId)) {
          setToast({
            message: 'Você não pode selecionar o próprio processo como principal.',
            type: 'warning',
            autoCloseMs: 0,
          });
          return;
        }
        if (caseItem?.case_principal) {
          setToast({
            message: 'Não é possível selecionar um processo DERIVADO como principal. Selecione um processo principal (não vinculado).',
            type: 'warning',
            autoCloseMs: 0,
          });
          return;
        }

        const vinculoTipo = String(
          window.prompt('Tipo de vínculo (ex: Apenso, Incidente, Recurso…)', '') || ''
        ).trim();
        if (!vinculoTipo) {
          setToast({
            message: 'Tipo de vínculo é obrigatório para vincular a um processo principal.',
            type: 'warning',
            autoCloseMs: 0,
          });
          return;
        }

        setLinkingVinculo(true);
        setToast({
          message: 'Aplicando vínculo…',
          type: 'info',
          autoCloseMs: 0,
        });

        try {
          await casesService.update(Number(targetCaseId), {
            classificacao: 'NEUTRO',
            case_principal: clickedId,
            vinculo_tipo: vinculoTipo,
          });
          openCaseDetailWindow(targetCaseId);
        } catch (error) {
          setToast({
            message: 'Erro ao aplicar vínculo: ' + (error?.message || 'Erro desconhecido'),
            type: 'error',
            autoCloseMs: 0,
          });
        } finally {
          setLinkingVinculo(false);
        }

        return;
      }

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
          .map((otherCase) => {
            const linkedParty = Array.isArray(otherCase.parties_summary)
              ? otherCase.parties_summary.find((party) => party.is_client) || null
              : null;

            const linkedPartyBadges = [];
            if (linkedParty?.role_display) {
              linkedPartyBadges.push(linkedParty.role_display);
            }
            if (linkedParty?.is_client) {
              linkedPartyBadges.push('Cliente');
            }

            return {
              id: otherCase.id,
              numero_processo: otherCase.numero_processo,
              numero_processo_formatted: otherCase.numero_processo_formatted,
              status_display: otherCase.status_display,
              cliente_nome: otherCase.cliente_nome,
              linked_party_name: linkedParty?.name || otherCase.cliente_nome || null,
              linked_party_badges: linkedPartyBadges,
              linked_party_contact_id: otherCase.cliente_principal || null,
            };
          });

        links.set(currentCase.id, related);
      });
    });

    return links;
  }, [cases]);

  const visibleCases = useMemo(() => {
    if (!isSelectDerivedMode) return cases;

    return cases.filter((caseItem) => {
      const caseId = Number(caseItem?.id) || 0;
      if (!caseId) return false;

      if (caseId === Number(editDerivedCaseId)) return true;
      if (caseId === Number(principalCaseId)) return false;

      const isDerived = Boolean(caseItem?.case_principal);
      if (isDerived) return false;

      const classificacao = String(caseItem?.classificacao || '').trim().toUpperCase();
      if (classificacao === 'PRINCIPAL') return false;

      const status = String(caseItem?.status || '').trim().toUpperCase();
      return status === 'ATIVO';
    });
  }, [cases, isSelectDerivedMode, principalCaseId, editDerivedCaseId]);

  return (
    <div className="cases-page">
      <div className={`cases-header ${isSelectDerivedMode ? 'cases-header--select' : ''}`}>
        {isSelectDerivedMode ? (
          <div className="cases-select-header">
            <h1>
              {isEditDerivedMode
                ? `Editar vínculo derivado do Principal: ${principalCaseNumber || `#${principalCaseId}`}`
                : `Escolha um processo para vincular ao Principal: ${principalCaseNumber || `#${principalCaseId}`}`}
            </h1>

            <div className="cases-select-vinculo-field">
              <SearchableCreatableSelectField
                label="Tipo de vínculo"
                value={selectedVinculoTipo}
                onChange={setSelectedVinculoTipo}
                options={vinculoTipoOptions}
                placeholder="Selecione ou cadastre..."
                allowCreate={true}
                onCreateOption={handleCreateVinculoTipoOption}
              />
            </div>

            <div className="cases-select-actions">
              <button
                className="btn btn-primary"
                onClick={handleCreateNewFromSelectDerived}
                disabled={linkingVinculo}
              >
                + Novo Processo
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleCancelSelectDerived}
                disabled={linkingVinculo}
              >
                Cancelar
              </button>

              {Boolean(selectedCaseId) && (
                <button
                  className="btn btn-primary"
                  onClick={handleSaveSelectDerived}
                  disabled={linkingVinculo}
                >
                  Salvar
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <h1>Processos</h1>
            <button className="btn btn-primary" onClick={() => openCaseDetail(null)}>
              + Novo Processo
            </button>
          </>
        )}
      </div>

      {!isSelectDerivedMode && (
        <div className="cases-stats" aria-busy={loadingStats ? 'true' : 'false'}>
          <div
            className={`stat-card stat-clickable ${!hasActiveFilters ? 'stat-selected' : ''}`}
            onClick={clearFilters}
            title="Ver todos os processos"
          >
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">Total</div>
          </div>
          <div
            className={`stat-card stat-active stat-clickable ${filters.status === 'ATIVO' ? 'stat-selected' : ''}`}
            onClick={() => toggleStatusFilter('ATIVO')}
            title="Processos ativos (movimentação < 90 dias)"
          >
            <div className="stat-value">{stats?.ativos || 0}</div>
            <div className="stat-label">Ativos</div>
          </div>
          <div
            className={`stat-card stat-inactive stat-clickable ${filters.status === 'INATIVO' ? 'stat-selected' : ''}`}
            onClick={() => toggleStatusFilter('INATIVO')}
            title="Processos inativos (sem movimentação > 90 dias)"
          >
            <div className="stat-value">{stats?.inativos || 0}</div>
            <div className="stat-label">Inativos</div>
          </div>
          {allTribunals && Object.keys(allTribunals).length > 0 && (
            <div
              className={`stat-card stat-clickable stat-tribunal ${selectedTribunals.length > 0 ? 'stat-selected' : ''}`}
              onClick={() => setShowTribunalBreakdown(!showTribunalBreakdown)}
              title="Clique para expandir lista de tribunais"
            >
              <div className="stat-value">{Object.keys(allTribunals).length}</div>
              <div className="stat-label">Tribunais {showTribunalBreakdown ? '▲' : '▼'}</div>

              {showTribunalBreakdown && (
                <div className="tribunal-breakdown" onClick={(e) => e.stopPropagation()}>
                  {Object.entries(allTribunals).map(([tribunal, count]) => (
                    <div
                      key={tribunal}
                      className="tribunal-item"
                      onClick={() => toggleTribunal(tribunal)}
                      title={tribunal}
                    >
                      <div className="tribunal-checkbox-group">
                        <input
                          type="checkbox"
                          className="tribunal-filter-checkbox"
                          checked={selectedTribunals.includes(tribunal)}
                          onChange={() => toggleTribunal(tribunal)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Filtrar por tribunal ${tribunal}`}
                        />
                        <span className="tribunal-name">{tribunal}</span>
                      </div>
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
        totalCount={isSelectDerivedMode ? (visibleCases.length || 0) : (stats?.total ?? (cases.length || 0))}
        filteredCount={visibleCases.length || 0}
      />

      {/* Cases List */}
      <div className="cases-list-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando processos...</p>
          </div>
        ) : visibleCases.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum processo encontrado</p>
            <p className="empty-state-hint">
              {isSelectDerivedMode
                ? 'Nenhum processo NEUTRO e ATIVO disponível para vínculo.'
                : 'Ajuste os filtros ou crie um novo processo'}
            </p>
          </div>
        ) : (
          <div className="cases-list">
            {visibleCases.map((caseItem) => {
              const isPrincipalReference =
                isSelectDerivedMode && Number(caseItem.id) === Number(principalCaseId);
              const isPrincipalCategory =
                isSelectDerivedMode &&
                !caseItem?.case_principal &&
                String(caseItem?.classificacao || '').trim().toUpperCase() === 'PRINCIPAL';

              const isDisabledInSelectDerived = isPrincipalReference || isPrincipalCategory;

              const disabledLabel = isPrincipalReference
                ? 'Processo principal'
                : isPrincipalCategory
                  ? 'Principal indisponível'
                  : '';

              return (
                <CaseCard
                  key={caseItem.id}
                  caseData={caseItem}
                  linkedCases={linkedCasesById.get(caseItem.id) || []}
                  onClick={() => openCaseDetail(caseItem)}
                  isSelected={isSelectDerivedMode && Number(selectedCaseId) === Number(caseItem.id)}
                  isDisabled={isDisabledInSelectDerived}
                  disabledLabel={disabledLabel}
                />
              );
            })}
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
          autoCloseMs={typeof toast.autoCloseMs === 'number' ? toast.autoCloseMs : 3000}
        />
      )}
    </div>
  );
}
