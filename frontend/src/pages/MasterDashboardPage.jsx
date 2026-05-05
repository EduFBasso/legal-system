import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MasterContactDetailsModal from '../components/MasterContactDetailsModal';
import Modal from '../components/Modal';
import MasterCasesSection from '../components/MasterDashboard/MasterCasesSection';
import MasterContactsSection from '../components/MasterDashboard/MasterContactsSection';
import MasterTasksSection from '../components/MasterDashboard/MasterTasksSection';
import contactsAPI from '../services/api';
import casesService from '../services/casesService';
import {
  createTeamMember,
  deactivateTeamMember,
  getTeamMembers,
  updateMasterSelfAccount,
  updateTeamMember,
} from '../services/teamService';
import { apiFetch } from '../utils/apiFetch';
import './MasterDashboardPage.css';

const EMPTY_MEMBER_FORM = {
  full_name_oab: '',
  username: '',
  email: '',
  password: '',
  role: 'ADVOGADO',
  oab_number: '',
  publications_excluded_oabs_text: '',
  publications_excluded_keywords_text: '',
};

const EMPTY_EDIT_FORM = {
  full_name_oab: '',
  email: '',
  role: 'ADVOGADO',
  oab_number: '',
  publications_excluded_oabs_text: '',
  publications_excluded_keywords_text: '',
};

function parseTextList(value) {
  if (!value) return [];
  return String(value)
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinTextList(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items.map((item) => String(item).trim()).filter(Boolean).join('\n');
}

const EMPTY_MASTER_ACCOUNT_FORM = {
  username: '',
  first_name: '',
  full_name_oab: '',
  oab_number: '',
  current_password: '',
  new_password: '',
  confirm_new_password: '',
};

function getTodayIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function sumValues(items, field) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    const parsed = Number(item?.[field] ?? 0);
    return acc + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}

async function fetchActiveTeamMembers() {
  const data = await getTeamMembers({ includeInactive: false });
  return data.filter(
    (member) => member.is_active && member.profile_is_active && member.role !== 'MASTER'
  );
}

export default function MasterDashboardPage() {
  const { user, updateAuthUser, fetchLawyers } = useAuth();
  const navigate = useNavigate();

  const today = getTodayIsoDate();
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [startDate, _setStartDate] = useState(today);
  const [endDate, _setEndDate] = useState(today);
  const [activeKpi, setActiveKpi] = useState('contatos');
  const [contactsSearch, setContactsSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [casesSearch, setCasesSearch] = useState('');
  const [casesData, setCasesData] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState('');
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState('');
  const [teamFeedback, setTeamFeedback] = useState({ type: '', text: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER_FORM);
  const [memberFormError, setMemberFormError] = useState('');
  const [memberFormLoading, setMemberFormLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editFormError, setEditFormError] = useState('');
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [isMasterAccountOpen, setIsMasterAccountOpen] = useState(false);
  const [masterAccountForm, setMasterAccountForm] = useState(EMPTY_MASTER_ACCOUNT_FORM);
  const [masterAccountError, setMasterAccountError] = useState('');
  const [masterAccountLoading, setMasterAccountLoading] = useState(false);
  const [kpis, setKpis] = useState({
    loading: true,
    contatos: 0,
    processos: 0,
    tarefas: 0,
    financeiro: 0,
  });
  const contactsKpiCount = kpis.loading ? '...' : kpis.contatos;
  const selectedMember = teamMembers.find((member) => String(member.id) === selectedLawyer) || null;

  const lastFocusRefreshAtRef = useRef(0);

  const refreshScopedData = useCallback(async ({ force = false } = {}) => {
    if (!selectedLawyer) return;

    const shouldSkip = () => {
      const now = Date.now();
      const elapsed = now - (lastFocusRefreshAtRef.current || 0);
      if (!force && elapsed < 900) return true;
      lastFocusRefreshAtRef.current = now;
      return false;
    };

    if (shouldSkip()) return;

    try {
      const contactsData = await contactsAPI.getAll({ team_member_id: selectedLawyer });
      const nextContacts = Array.isArray(contactsData) ? contactsData : [];
      setContacts(nextContacts);
      setKpis((current) => ({
        ...current,
        loading: false,
        contatos: nextContacts.length,
      }));
      setContactsError('');
    } catch {
      // Silencioso
    }

    try {
      const scopeParams = { team_member_id: selectedLawyer };
      const taskParams = new URLSearchParams(scopeParams).toString();
      const financialParams = new URLSearchParams({
        ...scopeParams,
        date__gte: startDate,
        date__lte: endDate,
      }).toString();

      const [casesStats, tasksData, paymentsData, expensesData] = await Promise.all([
        casesService.getStats(scopeParams),
        apiFetch(`/case-tasks/${taskParams ? `?${taskParams}` : ''}`),
        apiFetch(`/payments/${financialParams ? `?${financialParams}` : ''}`),
        apiFetch(`/expenses/${financialParams ? `?${financialParams}` : ''}`),
      ]);

      const totalRecebimentos = sumValues(paymentsData, 'value');
      const totalDespesas = sumValues(expensesData, 'value');

      setKpis((current) => ({
        ...current,
        loading: false,
        processos: Number(casesStats?.total || 0),
        tarefas: Array.isArray(tasksData) ? tasksData.length : 0,
        financeiro: totalRecebimentos - totalDespesas,
      }));
    } catch {
      // Silencioso
    }

    if (activeKpi === 'processos') {
      try {
        const params = new URLSearchParams();
        params.set('team_member_id', selectedLawyer);
        if (casesSearch.trim()) {
          params.set('search', casesSearch.trim());
        }
        const qs = params.toString();
        const data = await apiFetch(`/cases/${qs ? `?${qs}` : ''}`);
        setCasesData(Array.isArray(data) ? data : (data.results || []));
        setCasesError('');
      } catch {
        // Silencioso
      }
    }
  }, [
    activeKpi,
    casesSearch,
    endDate,
    selectedLawyer,
    startDate,
  ]);


  const lawyerOptions = teamMembers.map((member) => {
    const firstName = (member.first_name || '').trim();
    const profileFirstName = (member.full_name_oab || '').trim().split(' ')[0] || '';
    return {
      id: String(member.id),
      label: firstName || profileFirstName || member.username || member.email || `Membro ${member.id}`,
    };
  });
  const selectedLawyerLabel = selectedLawyer
    ? (lawyerOptions.find((option) => option.id === selectedLawyer)?.label || 'Advogado selecionado')
    : 'Selecione o Advogado';
  const selectedLawyerOptionLabel = selectedLawyer
    ? (lawyerOptions.find((option) => option.id === selectedLawyer)?.label || '')
    : '';

  useEffect(() => {
    let mounted = true;

    async function loadTeam() {
      try {
        setTeamLoading(true);
        setTeamError('');
        const data = await fetchActiveTeamMembers();
        if (!mounted) return;
        setTeamMembers(data);
      } catch {
        if (!mounted) return;
        setTeamMembers([]);
        setTeamError('Não foi possível carregar a equipe agora.');
      } finally {
        if (mounted) setTeamLoading(false);
      }
    }

    loadTeam();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedLawyer) return;
    const exists = teamMembers.some((member) => String(member.id) === selectedLawyer);
    if (!exists) {
      setSelectedLawyer('');
    }
  }, [selectedLawyer, teamMembers]);

  useEffect(() => {
    if (!teamFeedback.text) return undefined;

    const timeoutId = window.setTimeout(() => {
      setTeamFeedback({ type: '', text: '' });
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [teamFeedback]);

  function handleMemberFormChange(event) {
    const { name, value } = event.target;
    setMemberForm((current) => ({ ...current, [name]: value }));
  }

  function handleEditFormChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  function handleMasterAccountFormChange(event) {
    const { name, value } = event.target;
    setMasterAccountForm((current) => ({ ...current, [name]: value }));
  }

  function handleOpenMasterAccount() {
    setMasterAccountForm({
      ...EMPTY_MASTER_ACCOUNT_FORM,
      username: user?.username || '',
      first_name: user?.first_name || '',
      full_name_oab: user?.full_name_oab || '',
      oab_number: user?.oab_number || '',
    });
    setMasterAccountError('');
    setIsMasterAccountOpen(true);
  }

  async function handleMasterAccountSubmit(event) {
    event.preventDefault();
    setMasterAccountError('');

    const username = masterAccountForm.username.trim();
    const firstName = masterAccountForm.first_name.trim();
    const currentPassword = masterAccountForm.current_password;
    const newPassword = masterAccountForm.new_password;
    const confirmNewPassword = masterAccountForm.confirm_new_password;

    if (!username) {
      setMasterAccountError('Login do Master é obrigatório.');
      return;
    }

    if (!firstName) {
      setMasterAccountError('Nome exibido (primeiro nome) é obrigatório.');
      return;
    }

    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setMasterAccountError('Para trocar senha, preencha senha atual, nova senha e confirmação.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setMasterAccountError('A confirmação da nova senha não confere.');
        return;
      }
    }

    const payload = {
      username,
      first_name: firstName,
      full_name_oab: masterAccountForm.full_name_oab.trim(),
      oab_number: masterAccountForm.oab_number.trim(),
    };

    if (newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    setMasterAccountLoading(true);
    try {
      const updated = await updateMasterSelfAccount(payload);
      updateAuthUser(updated);
      await fetchLawyers();
      setIsMasterAccountOpen(false);
      setMasterAccountForm(EMPTY_MASTER_ACCOUNT_FORM);
      setTeamFeedback({
        type: 'success',
        text: 'Dados de acesso do Master atualizados com sucesso.',
      });
    } catch (error) {
      setMasterAccountError(error?.message || 'Erro ao atualizar dados do Master.');
    } finally {
      setMasterAccountLoading(false);
    }
  }

  async function handleCreateMemberSubmit(event) {
    event.preventDefault();
    setMemberFormError('');

    if (!memberForm.full_name_oab.trim()) {
      setMemberFormError('Nome completo é obrigatório.');
      return;
    }
    if (!memberForm.username.trim()) {
      setMemberFormError('Nome de usuário é obrigatório.');
      return;
    }
    if (!memberForm.email.trim()) {
      setMemberFormError('E-mail é obrigatório.');
      return;
    }
    if (!memberForm.password.trim()) {
      setMemberFormError('Senha provisória é obrigatória.');
      return;
    }

    setMemberFormLoading(true);
    try {
      const fullNameOab = memberForm.full_name_oab.trim();
      const derivedFirstName = fullNameOab.split(' ')[0] || '';

      const payload = {
        full_name_oab: fullNameOab,
        first_name: derivedFirstName,
        username: memberForm.username.trim(),
        email: memberForm.email.trim(),
        password: memberForm.password,
        role: memberForm.role,
        publications_excluded_oabs: parseTextList(memberForm.publications_excluded_oabs_text),
        publications_excluded_keywords: parseTextList(memberForm.publications_excluded_keywords_text),
      };
      if (memberForm.oab_number.trim()) {
        payload.oab_number = memberForm.oab_number.trim();
      }

      const createdMember = await createTeamMember(payload);
      const refreshedMembers = await fetchActiveTeamMembers();
      setTeamMembers(refreshedMembers);
      setSelectedLawyer(String(createdMember.id));
      setIsCreateOpen(false);
      setMemberForm(EMPTY_MEMBER_FORM);
      setTeamFeedback({
        type: 'success',
        text: `${payload.full_name_oab} foi adicionado(a) à equipe.`,
      });
    } catch (error) {
      setMemberFormError(error?.message || 'Erro ao criar membro. Verifique os dados informados.');
    } finally {
      setMemberFormLoading(false);
    }
  }

  function handleOpenEditMember() {
    if (!selectedMember) return;

    setEditForm({
      full_name_oab: selectedMember.full_name_oab || '',
      email: selectedMember.email || '',
      role: selectedMember.role || 'ADVOGADO',
      oab_number: selectedMember.oab_number || '',
      publications_excluded_oabs_text: joinTextList(selectedMember.publications_excluded_oabs),
      publications_excluded_keywords_text: joinTextList(selectedMember.publications_excluded_keywords),
    });
    setEditFormError('');
    setIsEditOpen(true);
  }

  async function handleEditMemberSubmit(event) {
    event.preventDefault();
    if (!selectedMember) return;

    setEditFormError('');
    if (!editForm.full_name_oab.trim()) {
      setEditFormError('Nome completo é obrigatório.');
      return;
    }
    if (!editForm.email.trim()) {
      setEditFormError('E-mail é obrigatório.');
      return;
    }

    setEditFormLoading(true);
    try {
      const fullNameOab = editForm.full_name_oab.trim();
      const derivedFirstName = fullNameOab.split(' ')[0] || '';

      await updateTeamMember(selectedMember.id, {
        full_name_oab: fullNameOab,
        first_name: derivedFirstName,
        email: editForm.email.trim(),
        role: editForm.role,
        oab_number: editForm.oab_number.trim(),
        publications_excluded_oabs: parseTextList(editForm.publications_excluded_oabs_text),
        publications_excluded_keywords: parseTextList(editForm.publications_excluded_keywords_text),
      });
      const refreshedMembers = await fetchActiveTeamMembers();
      setTeamMembers(refreshedMembers);
      setIsEditOpen(false);
      setTeamFeedback({
        type: 'success',
        text: `${editForm.full_name_oab.trim()} foi atualizado(a) com sucesso.`,
      });
    } catch (error) {
      setEditFormError(error?.message || 'Erro ao atualizar membro.');
    } finally {
      setEditFormLoading(false);
    }
  }

  async function handleDeactivateSelectedMember() {
    if (!selectedMember) return;

    const displayName = selectedMember.full_name_oab || selectedMember.email || selectedMember.username;
    const confirmed = window.confirm(`Desativar ${displayName}? O membro perderá acesso ao sistema.`);
    if (!confirmed) return;

    try {
      await deactivateTeamMember(selectedMember.id);
      const refreshedMembers = await fetchActiveTeamMembers();
      setTeamMembers(refreshedMembers);
      setSelectedLawyer('');
      setTeamFeedback({
        type: 'success',
        text: `${displayName} foi desativado(a).`,
      });
    } catch (error) {
      setTeamFeedback({
        type: 'error',
        text: error?.message || 'Erro ao desativar membro.',
      });
    }
  }

  useEffect(() => {
    let mounted = true;
    if (!selectedLawyer) {
      setContactsError('');
      setContacts([]);
      setContactsLoading(false);
      return () => {
        mounted = false;
      };
    }

    const timer = setTimeout(async () => {
      try {
        setContactsLoading(true);
        setContactsError('');
        const params = {
          team_member_id: selectedLawyer,
        };
        if (contactsSearch.trim()) {
          params.search = contactsSearch.trim();
        }
        const data = await contactsAPI.getAll(params);
        if (!mounted) return;
        setContacts(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setContactsError('Não foi possível carregar os contatos neste painel.');
        setContacts([]);
      } finally {
        if (mounted) setContactsLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [contactsSearch, selectedLawyer]);

  function handleViewContact(contactId) {
    setSelectedContactId(contactId);
    setIsContactModalOpen(true);
  }

  useEffect(() => {
    let mounted = true;

    async function loadKpis() {
      try {
        setKpis((current) => ({ ...current, loading: true }));

        // Se nenhum advogado selecionado, retorna KPIs zerados
        if (!selectedLawyer) {
          setKpis({
            loading: false,
            contatos: 0,
            processos: 0,
            tarefas: 0,
            financeiro: 0,
          });
          return;
        }

        const scopeParams = { team_member_id: selectedLawyer };
        const contactParams = { ...scopeParams };
        const casesScopeParams = { ...scopeParams };
        const taskParams = new URLSearchParams(scopeParams).toString();
        const financialParams = new URLSearchParams({
          ...scopeParams,
          date__gte: startDate,
          date__lte: endDate,
        }).toString();

        const [contactsData, casesStats, tasksData, paymentsData, expensesData] = await Promise.all([
          contactsAPI.getAll(contactParams),
          casesService.getStats(casesScopeParams),
          apiFetch(`/case-tasks/${taskParams ? `?${taskParams}` : ''}`),
          apiFetch(`/payments/${financialParams ? `?${financialParams}` : ''}`),
          apiFetch(`/expenses/${financialParams ? `?${financialParams}` : ''}`),
        ]);

        if (!mounted) return;

        const totalRecebimentos = sumValues(paymentsData, 'value');
        const totalDespesas = sumValues(expensesData, 'value');

        setKpis({
          loading: false,
          contatos: Array.isArray(contactsData) ? contactsData.length : 0,
          processos: Number(casesStats?.total || 0),
          tarefas: Array.isArray(tasksData) ? tasksData.length : 0,
          financeiro: totalRecebimentos - totalDespesas,
        });
      } catch {
        if (!mounted) return;
        setKpis({
          loading: false,
          contatos: 0,
          processos: 0,
          tarefas: 0,
          financeiro: 0,
        });
      }
    }

    loadKpis();

    return () => {
      mounted = false;
    };
  }, [selectedLawyer, startDate, endDate]);

  useEffect(() => {
    if (!selectedContactId) return;
    const exists = contacts.some((contact) => contact.id === selectedContactId);
    if (!exists) {
      setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (activeKpi !== 'processos') return undefined;

    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        setCasesLoading(true);
        setCasesError('');

        // Se nenhum advogado selecionado, retorna lista vazia
        if (!selectedLawyer) {
          setCasesData([]);
          return;
        }

        const params = new URLSearchParams();
        params.set('team_member_id', selectedLawyer);
        if (casesSearch.trim()) {
          params.set('search', casesSearch.trim());
        }
        const qs = params.toString();
        const data = await apiFetch(`/cases/${qs ? `?${qs}` : ''}`);
        if (!mounted) return;
        setCasesData(Array.isArray(data) ? data : (data.results || []));
      } catch {
        if (!mounted) return;
        setCasesError('Não foi possível carregar os processos.');
        setCasesData([]);
      } finally {
        if (mounted) setCasesLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [activeKpi, selectedLawyer, casesSearch]);

  useEffect(() => {
    const handleFocus = () => refreshScopedData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshScopedData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [
    refreshScopedData,
  ]);

  useEffect(() => {
    if (!selectedLawyer) return undefined;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;

      refreshScopedData({ force: true });
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshScopedData, selectedLawyer]);

  if (!user || user.role !== 'MASTER') {
    return (
      <main className="master-admin-page">
        <section className="master-admin-card master-admin-card--denied">
          <h1 className="master-admin-title">Painel Administrativo</h1>
          <p className="master-admin-denied-text">Acesso restrito ao usuário Master.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="master-admin-page">
      <section className="master-admin-card">
        <header className="master-admin-header">
          <div className="master-admin-header-text">
            <h1 className="master-admin-title">Painel Administrativo</h1>
            <p className="master-admin-subtitle">
              Auditoria por advogado com KPIs reais; período aplicável ao Financeiro.
            </p>
          </div>
          <div className="master-admin-header-actions">
            <button
              className="master-admin-btn-edit"
              type="button"
              onClick={handleOpenMasterAccount}
            >
              Meu Acesso
            </button>
            <button
              className="master-admin-btn-close"
              type="button"
              onClick={() => navigate('/')}
              aria-label="Fechar painel administrativo"
              title="Fechar painel"
            >
              ✕
            </button>
          </div>
        </header>

        {teamFeedback.text ? (
          <div className={`master-admin-banner master-admin-banner--${teamFeedback.type || 'success'}`}>
            {teamFeedback.text}
          </div>
        ) : null}

        <div className="master-admin-member-toolbar-row">
          <div className="master-admin-field">
            <label className="master-admin-label" htmlFor="master-lawyer-filter">Advogado(a)</label>
            <div className="master-admin-member-select-row">
              <select
                id="master-lawyer-filter"
                className="master-admin-select"
                value={selectedLawyer}
                disabled={teamLoading}
                onChange={(event) => setSelectedLawyer(event.target.value)}
              >
                <option value="">Selecione o Advogado</option>
                {lawyerOptions.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>{lawyer.label}</option>
                ))}
              </select>

              {selectedLawyer && (
                <>
                  <button className="master-admin-btn-edit" type="button" onClick={handleOpenEditMember}>
                    Editar
                  </button>
                  <button className="master-admin-btn-deactivate" type="button" onClick={handleDeactivateSelectedMember}>
                    Desativar
                  </button>
                </>
              )}
            </div>
            {teamError ? <small className="master-admin-help-text">{teamError}</small> : null}
          </div>

          <button
            className="master-admin-btn-add"
            type="button"
            onClick={() => {
              setMemberForm(EMPTY_MEMBER_FORM);
              setMemberFormError('');
              setIsCreateOpen(true);
            }}
          >
            + Adicionar Novo Membro
          </button>
        </div>

        <section className="master-admin-kpi-row" aria-label="Resumo por tópico">
          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--contacts ${activeKpi === 'contatos' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'contatos'}
            onClick={() => setActiveKpi('contatos')}
          >
            <p className="master-admin-kpi-title">Contatos</p>
            <strong className="master-admin-kpi-value">{contactsKpiCount}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--cases ${activeKpi === 'processos' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'processos'}
            onClick={() => setActiveKpi('processos')}
          >
            <p className="master-admin-kpi-title">Processos</p>
            <strong className="master-admin-kpi-value">{kpis.loading ? '...' : kpis.processos}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--tasks ${activeKpi === 'tarefas' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'tarefas'}
            onClick={() => setActiveKpi('tarefas')}
          >
            <p className="master-admin-kpi-title">Tarefas Processuais</p>
            <strong className="master-admin-kpi-value">{kpis.loading ? '...' : kpis.tarefas}</strong>
          </button>
        </section>

        {activeKpi === 'processos' && (
          <MasterCasesSection
            selectedLawyer={selectedLawyer}
            selectedLawyerOptionLabel={selectedLawyerOptionLabel}
            casesSearch={casesSearch}
            onCasesSearchChange={(event) => setCasesSearch(event.target.value)}
            casesError={casesError}
            casesLoading={casesLoading}
            casesData={casesData}
          />
        )}

        {activeKpi === 'contatos' && (
          <MasterContactsSection
            selectedLawyer={selectedLawyer}
            contactsSearch={contactsSearch}
            onContactsSearchChange={(event) => setContactsSearch(event.target.value)}
            contactsError={contactsError}
            contactsLoading={contactsLoading}
            contacts={contacts}
            selectedContactId={selectedContactId}
            onSelectContact={setSelectedContactId}
            onViewContact={handleViewContact}
          />
        )}

        {activeKpi === 'tarefas' && (
          <MasterTasksSection
            selectedLawyer={selectedLawyer}
            selectedLawyerLabel={selectedLawyerLabel}
          />
        )}
      </section>

      <MasterContactDetailsModal
        contactId={selectedContactId}
        teamMemberId={selectedLawyer || ''}
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
        }}
      />

      <Modal
        isOpen={isMasterAccountOpen}
        onClose={() => {
          if (masterAccountLoading) return;
          setIsMasterAccountOpen(false);
        }}
        title="Meu Acesso (MASTER)"
        size="medium"
      >
        <form className="master-admin-form" onSubmit={handleMasterAccountSubmit} noValidate>
          <div className="master-admin-form-row">
            <div className="master-admin-form-field">
              <label htmlFor="master_account_username">Login do Master *</label>
              <input
                id="master_account_username"
                name="username"
                type="text"
                value={masterAccountForm.username}
                onChange={handleMasterAccountFormChange}
                placeholder="Ex: master.ana"
                required
              />
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="master_account_first_name">Nome exibido no dropdown *</label>
              <input
                id="master_account_first_name"
                name="first_name"
                type="text"
                value={masterAccountForm.first_name}
                onChange={handleMasterAccountFormChange}
                placeholder="Ex: Ana"
                required
              />
            </div>
          </div>

          <div className="master-admin-form-row">
            <div className="master-admin-form-field">
              <label htmlFor="master_account_full_name_oab">Nome completo (para buscar publicações)</label>
              <input
                id="master_account_full_name_oab"
                name="full_name_oab"
                type="text"
                value={masterAccountForm.full_name_oab}
                onChange={handleMasterAccountFormChange}
                placeholder="Ex: Ana Silva"
              />
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="master_account_oab_number">Número da OAB (para buscar publicações)</label>
              <input
                id="master_account_oab_number"
                name="oab_number"
                type="text"
                value={masterAccountForm.oab_number}
                onChange={handleMasterAccountFormChange}
                placeholder="Ex: 123456"
              />
            </div>
          </div>

          <div className="master-admin-form-row">
            <div className="master-admin-form-field">
              <label htmlFor="master_account_current_password">Senha atual</label>
              <input
                id="master_account_current_password"
                name="current_password"
                type="password"
                value={masterAccountForm.current_password}
                onChange={handleMasterAccountFormChange}
                placeholder="Preencha para trocar senha"
              />
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="master_account_new_password">Nova senha</label>
              <input
                id="master_account_new_password"
                name="new_password"
                type="password"
                value={masterAccountForm.new_password}
                onChange={handleMasterAccountFormChange}
                placeholder="Mínimo 10 caracteres"
              />
            </div>
          </div>

          <div className="master-admin-form-field">
            <label htmlFor="master_account_confirm_new_password">Confirmar nova senha</label>
            <input
              id="master_account_confirm_new_password"
              name="confirm_new_password"
              type="password"
              value={masterAccountForm.confirm_new_password}
              onChange={handleMasterAccountFormChange}
              placeholder="Repita a nova senha"
            />
          </div>

          {masterAccountError ? <p className="master-admin-form-error">{masterAccountError}</p> : null}

          <div className="master-admin-form-footer">
            <button
              type="button"
              className="master-admin-btn-secondary"
              onClick={() => setIsMasterAccountOpen(false)}
              disabled={masterAccountLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="master-admin-btn-primary"
              disabled={masterAccountLoading}
            >
              {masterAccountLoading ? 'Salvando...' : 'Salvar Meu Acesso'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          if (memberFormLoading) return;
          setIsCreateOpen(false);
        }}
        title="Novo Membro da Equipe"
        size="medium"
      >
        <form className="master-admin-form" onSubmit={handleCreateMemberSubmit} noValidate>
          <div className="master-admin-form-field">
            <label htmlFor="member_full_name_oab">Nome completo (OAB) *</label>
            <input
              id="member_full_name_oab"
              name="full_name_oab"
              type="text"
              value={memberForm.full_name_oab}
              onChange={handleMemberFormChange}
              placeholder="Ex: Carla Souza Mendes"
              required
            />
          </div>

          <div className="master-admin-form-row">
            <div className="master-admin-form-field">
              <label htmlFor="member_username">Usuário *</label>
              <input
                id="member_username"
                name="username"
                type="text"
                value={memberForm.username}
                onChange={handleMemberFormChange}
                placeholder="Ex: carla.souza"
                required
              />
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="member_role">Cargo *</label>
              <select id="member_role" name="role" value={memberForm.role} onChange={handleMemberFormChange}>
                <option value="ADVOGADO">Advogado(a)</option>
                <option value="ESTAGIARIO">Estagiário(a)</option>
              </select>
            </div>
          </div>

          <div className="master-admin-form-field">
            <label htmlFor="member_email">E-mail *</label>
            <input
              id="member_email"
              name="email"
              type="email"
              value={memberForm.email}
              onChange={handleMemberFormChange}
              placeholder="carla@escritorio.com"
              required
            />
          </div>

          <div className="master-admin-form-row">
            <div className="master-admin-form-field">
              <label htmlFor="member_oab_number">Número OAB</label>
              <input
                id="member_oab_number"
                name="oab_number"
                type="text"
                value={memberForm.oab_number}
                onChange={handleMemberFormChange}
                placeholder="Ex: 123456"
              />
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="member_password">Senha provisória *</label>
              <input
                id="member_password"
                name="password"
                type="password"
                value={memberForm.password}
                onChange={handleMemberFormChange}
                placeholder="Mínimo 10 caracteres"
                required
              />
            </div>
          </div>

          <div className="master-admin-form-field">
            <label htmlFor="member_publications_excluded_oabs">Rejeitar publicações (OABs)</label>
            <textarea
              id="member_publications_excluded_oabs"
              name="publications_excluded_oabs_text"
              value={memberForm.publications_excluded_oabs_text}
              onChange={handleMemberFormChange}
              placeholder="Uma OAB por linha ou separadas por vírgula (ex: 654321)"
              rows={3}
            />
          </div>

          <div className="master-admin-form-field">
            <label htmlFor="member_publications_excluded_keywords">Rejeitar publicações (frases)</label>
            <textarea
              id="member_publications_excluded_keywords"
              name="publications_excluded_keywords_text"
              value={memberForm.publications_excluded_keywords_text}
              onChange={handleMemberFormChange}
              placeholder="Uma frase por linha (ex: NOME EXCLUIDO, SILVA TERCEIRO)"
              rows={3}
            />
          </div>

          {memberFormError ? <p className="master-admin-form-error">{memberFormError}</p> : null}

          <div className="master-admin-form-footer">
            <button
              type="button"
              className="master-admin-btn-secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={memberFormLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="master-admin-btn-primary"
              disabled={memberFormLoading}
            >
              {memberFormLoading ? 'Salvando...' : 'Criar Membro'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          if (editFormLoading) return;
          setIsEditOpen(false);
        }}
        title={`Editar Membro${selectedMember ? ` - ${selectedMember.full_name_oab || selectedMember.username}` : ''}`}
        size="medium"
      >
        <form className="master-admin-form" onSubmit={handleEditMemberSubmit} noValidate>
          <div className="master-admin-form-field">
            <label htmlFor="edit_member_full_name_oab">Nome completo (OAB) *</label>
            <input
              id="edit_member_full_name_oab"
              name="full_name_oab"
              type="text"
              value={editForm.full_name_oab}
              onChange={handleEditFormChange}
              required
            />
          </div>

          <div className="master-admin-form-row">
            <div className="master-admin-form-field">
              <label htmlFor="edit_member_email">E-mail *</label>
              <input
                id="edit_member_email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="edit_member_role">Cargo *</label>
              <select id="edit_member_role" name="role" value={editForm.role} onChange={handleEditFormChange}>
                <option value="ADVOGADO">Advogado(a)</option>
                <option value="ESTAGIARIO">Estagiário(a)</option>
              </select>
            </div>
          </div>

          <div className="master-admin-form-field">
            <label htmlFor="edit_member_oab_number">Número OAB</label>
            <input
              id="edit_member_oab_number"
              name="oab_number"
              type="text"
              value={editForm.oab_number}
              onChange={handleEditFormChange}
            />
          </div>

          <div className="master-admin-form-field">
            <label htmlFor="edit_member_publications_excluded_oabs">Rejeitar publicações (OABs)</label>
            <textarea
              id="edit_member_publications_excluded_oabs"
              name="publications_excluded_oabs_text"
              value={editForm.publications_excluded_oabs_text}
              onChange={handleEditFormChange}
              placeholder="Uma OAB por linha ou separadas por vírgula"
              rows={3}
            />
          </div>

          <div className="master-admin-form-field">
            <label htmlFor="edit_member_publications_excluded_keywords">Rejeitar publicações (frases)</label>
            <textarea
              id="edit_member_publications_excluded_keywords"
              name="publications_excluded_keywords_text"
              value={editForm.publications_excluded_keywords_text}
              onChange={handleEditFormChange}
              placeholder="Uma frase por linha"
              rows={3}
            />
          </div>

          {editFormError ? <p className="master-admin-form-error">{editFormError}</p> : null}

          <div className="master-admin-form-footer">
            <button
              type="button"
              className="master-admin-btn-secondary"
              onClick={() => setIsEditOpen(false)}
              disabled={editFormLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="master-admin-btn-primary"
              disabled={editFormLoading}
            >
              {editFormLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
