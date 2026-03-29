import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import casesService from '../services/casesService';
import Toast from '../components/common/Toast';
import CasesFilters from '../components/CasesFilters';
import CasesStatsPanel from '../components/Cases/CasesStatsPanel';
import CasesPageHeader from '../components/Cases/CasesPageHeader';
import CasesListView from '../components/Cases/CasesListView';
import { openCaseDetailWindow, openCreateCaseWindow } from '../utils/publicationNavigation';
import { CASE_SYNC_STORAGE_KEY, notifyCaseSync, parseCaseSyncStorageValue } from '../services/caseSyncService';
import './CasesPage.css';

/**
 * Cases Page - Manage legal cases/processes
 */
export default function CasesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debounceTimerRef = useRef(null);
  const loadRunIdRef = useRef(0);
  const lastLoadStartedAtRef = useRef(0);
  const lastBackgroundRefreshAtRef = useRef(0);
  const loadingUiTimerRef = useRef(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoadingUi, setShowLoadingUi] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [toast, setToast] = useState(null);
  const [linkingVinculo, setLinkingVinculo] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [vinculoTipoOptions, setVinculoTipoOptions] = useState([]);
  const [selectedVinculoTipo, setSelectedVinculoTipo] = useState('');
  const [principalCaseNumber, setPrincipalCaseNumber] = useState('');
  const [targetCaseNumber, setTargetCaseNumber] = useState('');
  // Mantém o KPI sempre montado (sem esperar fetch) e apenas atualiza números.
  const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0, by_tribunal: {} });
  const [showTribunalBreakdown, setShowTribunalBreakdown] = useState(false);
  const [selectedTribunals, setSelectedTribunals] = useState([]);
  const [showVinculoBreakdown, setShowVinculoBreakdown] = useState(false);
  const [selectedVinculos, setSelectedVinculos] = useState([]);

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
  const isSelectLinkMode = isSelectDerivedMode || isSelectPrincipalMode;

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    ordering: '-data_ultima_movimentacao',
  });

  const effectiveFilters = useMemo(() => {
    if (isSelectPrincipalMode) {
      const next = {
        ...filters,
      };

      if (Object.prototype.hasOwnProperty.call(next, 'status')) {
        delete next.status;
      }
      if (Object.prototype.hasOwnProperty.call(next, 'tribunal')) {
        delete next.tribunal;
      }

      return next;
    }

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
    filters.tribunal ||
    selectedVinculos.length > 0
  );

  const tribunalBreakdown = useMemo(() => {
    const grouped = {};

    cases.forEach((caseItem) => {
      const tribunal = String(caseItem?.tribunal || '').trim();
      if (!tribunal) return;
      grouped[tribunal] = (grouped[tribunal] || 0) + 1;
    });

    return grouped;
  }, [cases]);

  const vinculoTypeBreakdown = useMemo(() => {
    let neutro = 0;
    let principal = 0;
    let derivado = 0;

    cases.forEach((caseItem) => {
      if (caseItem?.case_principal) {
        derivado += 1;
        return;
      }

      const classificacao = String(caseItem?.classificacao || '').trim().toUpperCase();
      if (classificacao === 'PRINCIPAL') {
        principal += 1;
        return;
      }

      neutro += 1;
    });

    return { neutro, principal, derivado };
  }, [cases]);

  const casesAfterVinculoFilter = useMemo(() => {
    if (isSelectLinkMode) return cases;
    if (selectedVinculos.length === 0) return cases;

    const selectedSet = new Set(selectedVinculos);

    return cases.filter((caseItem) => {
      const vinculoClass = caseItem?.case_principal
        ? 'DERIVADO'
        : (String(caseItem?.classificacao || '').trim().toUpperCase() === 'PRINCIPAL'
          ? 'PRINCIPAL'
          : 'NEUTRO');

      return selectedSet.has(vinculoClass);
    });
  }, [cases, selectedVinculos, isSelectLinkMode]);

  /**
   * Load cases from API
   */
  const loadCases = useCallback(async (options = {}) => {
    const { silent = false } = options || {};
    const runId = ++loadRunIdRef.current;
    lastLoadStartedAtRef.current = Date.now();

    if (loadingUiTimerRef.current) {
      clearTimeout(loadingUiTimerRef.current);
    }

    setShowLoadingUi(false);

    if (!silent) {
      loadingUiTimerRef.current = setTimeout(() => {
        if (loadRunIdRef.current !== runId) return;
        setShowLoadingUi(true);
      }, 150);
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await casesService.getAll(effectiveFilters);
      if (loadRunIdRef.current !== runId) return;
      // Handle both paginated and non-paginated responses
      setCases(Array.isArray(response) ? response : (response.results || []));
    } catch (error) {
      if (loadRunIdRef.current !== runId) return;
      console.error('Error loading cases:', error);
      setToast({
        message: 'Erro ao carregar processos: ' + error.message,
        type: 'error'
      });
    } finally {
      if (loadRunIdRef.current !== runId) return;
      if (loadingUiTimerRef.current) {
        clearTimeout(loadingUiTimerRef.current);
      }
      setShowLoadingUi(false);
      if (!silent) {
        setLoading(false);
      }
    }
  }, [effectiveFilters]);

  /**
   * Load statistics
   */
  const loadStats = useCallback(async (options = {}) => {
    const { silent = false } = options || {};

    if (!silent) {
      setLoadingStats(true);
    }

    try {
      const statsData = await casesService.getStats({});
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      if (!silent) {
        setLoadingStats(false);
      }
    }
  }, []);

  /**
   * Initial load - load stats and cases
   */
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!isSelectDerivedMode && !isSelectPrincipalMode) {
      setSelectedCaseId(null);
      setVinculoTipoOptions([]);
      setSelectedVinculoTipo('');
      setPrincipalCaseNumber('');
      setTargetCaseNumber('');
      return;
    }

    if (isSelectPrincipalMode) {
      setSelectedTribunals([]);
      setSelectedVinculos([]);
      setShowVinculoBreakdown(false);
      setFilters((prev) => {
        const next = { ...prev };
        if (Object.prototype.hasOwnProperty.call(next, 'status')) {
          delete next.status;
        }
        if (Object.prototype.hasOwnProperty.call(next, 'tribunal')) {
          delete next.tribunal;
        }
        return next;
      });
    }

    setSelectedCaseId(isSelectDerivedMode && isEditDerivedMode ? editDerivedCaseId : null);

    const loadSelectedModeCaseInfo = async () => {
      try {
        const caseIdToLoad = isSelectDerivedMode ? Number(principalCaseId) : Number(targetCaseId);
        const selectedModeCase = await casesService.getById(caseIdToLoad);
        const numero = String(
          selectedModeCase?.numero_processo_formatted || selectedModeCase?.numero_processo || ''
        ).trim();
        if (isSelectDerivedMode) {
          setPrincipalCaseNumber(numero);
        } else {
          setTargetCaseNumber(numero);
        }
      } catch {
        if (isSelectDerivedMode) {
          setPrincipalCaseNumber('');
        } else {
          setTargetCaseNumber('');
        }
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

        if (isSelectDerivedMode && editDerivedVinculoTipo) {
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

    loadSelectedModeCaseInfo();
    loadVinculoTipoOptions();
  }, [
    isSelectDerivedMode,
    isSelectPrincipalMode,
    principalCaseId,
    targetCaseId,
    editDerivedCaseId,
    editDerivedVinculoTipo,
    isEditDerivedMode,
  ]);

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

  const handleCancelSelectLinkMode = () => {
    if (isSelectDerivedMode) {
      navigate(`/cases/${principalCaseId}`);
      return;
    }
    if (isSelectPrincipalMode) {
      navigate(`/cases/${targetCaseId}`);
    }
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

      notifyCaseSync({
        caseIds: [derivedId, Number(principalCaseId), editDerivedCaseId],
        action: 'linked',
        source: 'CasesPage.handleSaveSelectDerived',
      });

      const principalUrl = `/cases/${principalCaseId}?linked=1`;
      if (shouldAutoCloseAfterLink) {
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

  const handleSaveSelectPrincipal = async () => {
    if (!isSelectPrincipalMode) return;
    if (linkingVinculo) return;

    const selectedPrincipalId = Number(selectedCaseId) || 0;
    if (!selectedPrincipalId) return;
    if (selectedPrincipalId === Number(targetCaseId)) return;

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
      const selectedCase = cases.find((item) => Number(item?.id) === selectedPrincipalId) || null;
      const selectedClassificacao = String(selectedCase?.classificacao || '').trim().toUpperCase();
      const selectedIsDerived = Boolean(selectedCase?.case_principal);

      if (!selectedIsDerived && selectedClassificacao !== 'PRINCIPAL') {
        await casesService.update(selectedPrincipalId, {
          classificacao: 'PRINCIPAL',
          case_principal: null,
          vinculo_tipo: '',
        });
      }

      await casesService.update(Number(targetCaseId), {
        classificacao: 'NEUTRO',
        case_principal: selectedPrincipalId,
        vinculo_tipo: vinculoTipo,
      });

      notifyCaseSync({
        caseIds: [Number(targetCaseId), selectedPrincipalId],
        action: 'linked',
        source: 'CasesPage.handleSaveSelectPrincipal',
      });

      const targetUrl = `/cases/${targetCaseId}?linked=1`;
      if (shouldAutoCloseAfterLink) {
        try {
          window.close();
          return;
        } catch {
          // fallback below
        }
      }

      navigate(targetUrl);
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

  useEffect(() => {
    return () => {
      if (loadingUiTimerRef.current) {
        clearTimeout(loadingUiTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const refreshCasesPage = () => {
      const now = Date.now();
      if (now - lastBackgroundRefreshAtRef.current < 600) return;
      lastBackgroundRefreshAtRef.current = now;

      loadCases({ silent: true });
      loadStats({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsedMs = Date.now() - (lastLoadStartedAtRef.current || 0);
        if (elapsedMs < 1200) return;
        refreshCasesPage();
      }
    };

    const handleStorage = (event) => {
      if (event.key !== CASE_SYNC_STORAGE_KEY || !event.newValue) return;
      const payload = parseCaseSyncStorageValue(event.newValue);
      if (!payload) return;
      refreshCasesPage();
    };

    window.addEventListener('focus', refreshCasesPage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', refreshCasesPage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadCases, loadStats]);

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
    setSelectedVinculos([]);
    setShowTribunalBreakdown(false);
    setShowVinculoBreakdown(false);
  };

  const toggleVinculoType = (type) => {
    setSelectedVinculos((prev) => (
      prev.includes(type)
        ? prev.filter((item) => item !== type)
        : [...prev, type]
    ));
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

        setSelectedCaseId(clickedId);

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

    casesAfterVinculoFilter.forEach((caseItem) => {
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
  }, [casesAfterVinculoFilter]);

  const visibleCases = useMemo(() => {
    if (!isSelectDerivedMode) return casesAfterVinculoFilter;

    return casesAfterVinculoFilter.filter((caseItem) => {
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
  }, [casesAfterVinculoFilter, isSelectDerivedMode, principalCaseId, editDerivedCaseId]);

  const visiblePrincipalCandidates = useMemo(() => {
    if (!isSelectPrincipalMode) return visibleCases;

    return casesAfterVinculoFilter.filter((caseItem) => {
      const caseId = Number(caseItem?.id) || 0;
      if (!caseId) return false;
      if (caseId === Number(targetCaseId)) return false;
      if (caseItem?.case_principal) return false;

      const classificacao = String(caseItem?.classificacao || '').trim().toUpperCase();
      return classificacao === 'PRINCIPAL' || classificacao === 'NEUTRO' || classificacao === '';
    });
  }, [casesAfterVinculoFilter, isSelectPrincipalMode, targetCaseId, visibleCases]);

  const listCases = isSelectPrincipalMode ? visiblePrincipalCandidates : visibleCases;
  const shouldShowLoadingState = loading && (showLoadingUi || cases.length === 0);

  return (
    <div className="cases-page">
      <CasesPageHeader
        isSelectLinkMode={isSelectLinkMode}
        isSelectDerivedMode={isSelectDerivedMode}
        isEditDerivedMode={isEditDerivedMode}
        principalCaseNumber={principalCaseNumber}
        principalCaseId={principalCaseId}
        selectedVinculoTipo={selectedVinculoTipo}
        setSelectedVinculoTipo={setSelectedVinculoTipo}
        vinculoTipoOptions={vinculoTipoOptions}
        onCreateVinculoTipoOption={handleCreateVinculoTipoOption}
        onCreateNewFromSelectDerived={handleCreateNewFromSelectDerived}
        onCancelSelectLinkMode={handleCancelSelectLinkMode}
        linkingVinculo={linkingVinculo}
        selectedCaseId={selectedCaseId}
        onSaveSelectDerived={handleSaveSelectDerived}
        isSelectPrincipalMode={isSelectPrincipalMode}
        targetCaseNumber={targetCaseNumber}
        targetCaseId={targetCaseId}
        onSaveSelectPrincipal={handleSaveSelectPrincipal}
        onOpenNewCase={() => openCaseDetail(null)}
      />

      {!isSelectLinkMode && (
        <CasesStatsPanel
          loadingStats={loadingStats}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          filters={filters}
          stats={stats}
          toggleStatusFilter={toggleStatusFilter}
          selectedVinculos={selectedVinculos}
          showVinculoBreakdown={showVinculoBreakdown}
          onToggleVinculoBreakdown={() => setShowVinculoBreakdown(!showVinculoBreakdown)}
          vinculoTypeBreakdown={vinculoTypeBreakdown}
          toggleVinculoType={toggleVinculoType}
          tribunalBreakdown={tribunalBreakdown}
          selectedTribunals={selectedTribunals}
          showTribunalBreakdown={showTribunalBreakdown}
          onToggleTribunalBreakdown={() => setShowTribunalBreakdown(!showTribunalBreakdown)}
          toggleTribunal={toggleTribunal}
        />
      )}

      {/* Filters */}
      <CasesFilters
        searchQuery={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        isAscending={filters.ordering === 'data_ultima_movimentacao'}
        onOrderingToggle={toggleOrdering}
        totalCount={isSelectLinkMode ? (listCases.length || 0) : (stats?.total ?? (cases.length || 0))}
        filteredCount={listCases.length || 0}
      />

      {/* Cases List */}
      <CasesListView
        shouldShowLoadingState={shouldShowLoadingState}
        listCases={listCases}
        isSelectDerivedMode={isSelectDerivedMode}
        isSelectPrincipalMode={isSelectPrincipalMode}
        isSelectLinkMode={isSelectLinkMode}
        linkedCasesById={linkedCasesById}
        principalCaseId={principalCaseId}
        selectedCaseId={selectedCaseId}
        openCaseDetail={openCaseDetail}
      />

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
