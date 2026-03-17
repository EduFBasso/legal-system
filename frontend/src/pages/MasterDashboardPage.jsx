import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContactCard from '../components/ContactCard';
import Modal from '../components/Modal';
import contactsAPI from '../services/api';
import casesService from '../services/casesService';
import { openCaseDetailWindow } from '../utils/publicationNavigation';
import {
  createTeamMember,
  deactivateTeamMember,
  getTeamMembers,
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
};

const EMPTY_EDIT_FORM = {
  full_name_oab: '',
  email: '',
  role: 'ADVOGADO',
  oab_number: '',
};

function getTodayIsoDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  });
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = getTodayIsoDate();
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activeKpi, setActiveKpi] = useState('contatos');
  const [contactsSearch, setContactsSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [casesSearch, setCasesSearch] = useState('');
  const [casesData, setCasesData] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState('');
  const [selectedContactId, setSelectedContactId] = useState(null);
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
  const [kpis, setKpis] = useState({
    loading: true,
    contatos: 0,
    processos: 0,
    tarefas: 0,
    financeiro: 0,
  });
  const contactsKpiCount = kpis.loading ? '...' : kpis.contatos;
  const selectedMember = teamMembers.find((member) => String(member.id) === selectedLawyer) || null;

  const lawyerOptions = teamMembers.map((member) => {
    const derivedFirstName = (member.first_name || member.full_name_oab || '').trim().split(' ')[0] || '';
    const primaryLabel = [derivedFirstName, member.oab_number || ''].filter(Boolean).join(' ');
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
    return {
      id: String(member.id),
      label: primaryLabel || fullName || member.full_name_oab || member.email || member.username || `Membro ${member.id}`,
    };
  });
  const selectedLawyerLabel = selectedLawyer
    ? (lawyerOptions.find((option) => option.id === selectedLawyer)?.label || 'Advogado selecionado')
    : 'Selecione o Advogado';

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
      const payload = {
        full_name_oab: memberForm.full_name_oab.trim(),
        username: memberForm.username.trim(),
        email: memberForm.email.trim(),
        password: memberForm.password,
        role: memberForm.role,
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
      await updateTeamMember(selectedMember.id, {
        full_name_oab: editForm.full_name_oab.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        oab_number: editForm.oab_number.trim(),
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
    const timer = setTimeout(async () => {
      try {
        setContactsLoading(true);
        setContactsError('');
        const params = {
          team_scope: 'all',
          exclude_owner_self: '1',
          exclude_ownerless: '1',
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
  }, [contactsSearch]);

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

        {activeKpi === 'financeiro' && (
          <div className="master-admin-filters-grid">
            <div className="master-admin-field">
              <label className="master-admin-label" htmlFor="master-start-date">Data inicial</label>
              <input
                id="master-start-date"
                type="date"
                className="master-admin-date"
                value={startDate}
                onChange={(event) => {
                  const nextStart = event.target.value;
                  setStartDate(nextStart);
                  setEndDate(nextStart);
                }}
              />
            </div>

            <div className="master-admin-field">
              <label className="master-admin-label" htmlFor="master-end-date">Data final</label>
              <input
                id="master-end-date"
                type="date"
                className="master-admin-date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>
        )}

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
            <p className="master-admin-kpi-title">Tarefas</p>
            <strong className="master-admin-kpi-value">{kpis.loading ? '...' : kpis.tarefas}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--finance ${activeKpi === 'financeiro' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'financeiro'}
            onClick={() => setActiveKpi('financeiro')}
          >
            <p className="master-admin-kpi-title">Financeiro</p>
            <strong className="master-admin-kpi-value">{kpis.loading ? '...' : formatCurrency(kpis.financeiro)}</strong>
          </button>
        </section>

        {activeKpi === 'processos' && (
        <section className="master-admin-cases-section" aria-label="Processos">
          <div className="master-admin-cases-header">
            <div>
              <h2 className="master-admin-cases-title">Processos</h2>
              <p className="master-admin-cases-subtitle">
                {selectedLawyer && `Processos de ${lawyerOptions.find(o => o.id === selectedLawyer)?.label || ''}`}
              </p>
            </div>
            <div className="master-admin-contacts-search-wrap">
              <span className="master-admin-contacts-search-icon">🔍</span>
              <input
                type="text"
                className="master-admin-contacts-search"
                placeholder="Buscar por número, cliente, título..."
                value={casesSearch}
                onChange={(event) => setCasesSearch(event.target.value)}
              />
            </div>
          </div>

          {casesError ? (
            <div className="master-admin-contacts-feedback master-admin-contacts-feedback--error">{casesError}</div>
          ) : casesLoading ? (
            <div className="master-admin-contacts-feedback">Carregando processos...</div>
          ) : casesData.length === 0 ? (
            <div className="master-admin-contacts-feedback">Nenhum processo encontrado para o filtro aplicado.</div>
          ) : (
            <div className="master-admin-cases-table-wrap">
              <table className="master-admin-cases-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Título / Tipo</th>
                    <th>Tribunal</th>
                    <th>Cliente</th>
                    <th>Última movimentação</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {casesData.map((c) => (
                    <tr
                      key={c.id}
                      className="master-admin-cases-row"
                      onClick={() => openCaseDetailWindow(c.id)}
                      title="Abrir processo em nova aba"
                    >
                      <td className="master-admin-cases-cell--numero">
                        {c.numero_processo_formatted || c.numero_processo || '—'}
                      </td>
                      <td className="master-admin-cases-cell--titulo">
                        {c.titulo || c.tipo_acao_display || '—'}
                      </td>
                      <td>{c.tribunal_display || c.tribunal || '—'}</td>
                      <td>
                        {
                          c.cliente_nome
                          || c.parties_summary?.find((party) => party.is_client)?.name
                          || c.parties_summary?.[0]?.name
                          || '—'
                        }
                      </td>
                      <td>
                        {c.data_ultima_movimentacao
                          ? new Date(c.data_ultima_movimentacao + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td>
                        <span
                          className="master-admin-cases-status"
                          data-status={c.status}
                        >
                          {c.status_display || c.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}

        {activeKpi === 'contatos' && (
        <section className="master-admin-contacts-section" aria-label="Contatos (somente leitura)">
          <div className="master-admin-contacts-header">
            <div>
              <h2 className="master-admin-contacts-title">Contatos</h2>
              <p className="master-admin-contacts-subtitle">Espelho read-only da página de contatos com filtro local.</p>
            </div>
            <div className="master-admin-contacts-search-wrap">
              <span className="master-admin-contacts-search-icon">🔍</span>
              <input
                type="text"
                className="master-admin-contacts-search"
                placeholder="Buscar contato..."
                value={contactsSearch}
                onChange={(event) => setContactsSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="master-admin-contacts-readonly">
            {contactsError ? (
              <div className="master-admin-contacts-feedback master-admin-contacts-feedback--error">{contactsError}</div>
            ) : contactsLoading ? (
              <div className="master-admin-contacts-feedback">Carregando contatos...</div>
            ) : contacts.length === 0 ? (
              <div className="master-admin-contacts-feedback">Nenhum contato encontrado para o filtro aplicado.</div>
            ) : (
              contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  isSelected={selectedContactId === contact.id}
                  onSelect={() => setSelectedContactId(contact.id)}
                  onView={() => {}}
                  onLinkToCase={() => {}}
                />
              ))
            )}
          </div>
        </section>
        )}

        {activeKpi === 'tarefas' && (
        <section className="master-admin-tasks-section" aria-label="Tarefas">
          <div className="master-admin-cases-header">
            <div>
              <h2 className="master-admin-cases-title">Tarefas</h2>
              <p className="master-admin-cases-subtitle">
                {selectedLawyer && `Abra a página Tarefas Agendadas em nova aba para visualizar as tarefas de ${selectedLawyerLabel}.`}
              </p>
            </div>
          </div>

          <div className="master-admin-contacts-feedback">
            As tarefas continuam disponíveis na tela oficial, com os cartões e cores corretas.
          </div>

          <button
            type="button"
            className="master-admin-open-page-button"
            onClick={() => {
              const params = new URLSearchParams();
              params.set('team_member_id', selectedLawyer);
              params.set('scope_label', selectedLawyerLabel);
              const query = params.toString();
              window.open(`/deadlines${query ? `?${query}` : ''}`, '_blank', 'noopener,noreferrer');
            }}
          >
            Abrir Tarefas Agendadas em nova aba
          </button>
        </section>
        )}
      </section>

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
