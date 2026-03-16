import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ContactCard from '../components/ContactCard';
import Modal from '../components/Modal';
import contactsAPI from '../services/api';
import {
  createTeamMember,
  deactivateTeamMember,
  getTeamMembers,
  updateTeamMember,
} from '../services/teamService';
import './MasterDashboardPage.css';

const EMPTY_MEMBER_FORM = {
  full_name_oab: '',
  username: '',
  email: '',
  password: '',
  role: 'ADVOGADO',
  oab_number: '',
};

const SUMMARY_TOTALS = {
  all: { contatos: 248, processos: 96, tarefas: 134, financeiro: 84250 },
  1: { contatos: 82, processos: 31, tarefas: 46, financeiro: 29100 },
  2: { contatos: 69, processos: 24, tarefas: 39, financeiro: 21650 },
  3: { contatos: 97, processos: 41, tarefas: 49, financeiro: 33500 },
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

export default function MasterDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = getTodayIsoDate();
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('all');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activeKpi, setActiveKpi] = useState('contatos');
  const [contactsSearch, setContactsSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_MEMBER_FORM);
  const [editForm, setEditForm] = useState(EMPTY_MEMBER_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const totals = SUMMARY_TOTALS[selectedLawyer] || SUMMARY_TOTALS.all;
  const contactsTotal = contactsLoading ? '...' : contacts.length;
  const activeMembers = members.filter((member) => member.profile_is_active && member.role !== 'MASTER');
  const selectedMember = activeMembers.find((member) => String(member.id) === selectedLawyer) || null;

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  const loadMembers = async () => {
    try {
      setMembersLoading(true);
      setMembersError('');
      const data = await getTeamMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembersError('Não foi possível carregar a equipe neste painel.');
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedLawyer === 'all') {
      return;
    }

    const exists = activeMembers.some((member) => String(member.id) === selectedLawyer);
    if (!exists) {
      setSelectedLawyer('all');
    }
  }, [activeMembers, selectedLawyer]);

  useEffect(() => {
    if (activeKpi !== 'contatos') {
      return undefined;
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        setContactsLoading(true);
        setContactsError('');
        const params = {
          data_inicio: startDate,
          data_fim: endDate,
        };
        if (contactsSearch.trim()) {
          params.search = contactsSearch.trim();
        }
        if (selectedLawyer === 'all') {
          params.team_scope = 'all';
        } else {
          params.team_member_id = selectedLawyer;
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
  }, [activeKpi, contactsSearch, selectedLawyer, startDate, endDate]);

  useEffect(() => {
    if (!selectedContactId) {
      return;
    }

    const stillVisible = contacts.some((contact) => contact.id === selectedContactId);
    if (!stillVisible) {
      setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);

  const lawyerOptions = [
    { id: 'all', label: 'Toda a equipe' },
    ...activeMembers.map((member) => ({
      id: String(member.id),
      label: member.full_name_oab || member.username,
    })),
  ];

  const resetCreateForm = () => {
    setCreateForm(EMPTY_MEMBER_FORM);
    setFormError('');
  };

  const handleCreateOpen = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const handleEditOpen = () => {
    if (!selectedMember) {
      return;
    }

    setEditTarget(selectedMember);
    setEditForm({
      full_name_oab: selectedMember.full_name_oab || '',
      username: selectedMember.username || '',
      email: selectedMember.email || '',
      password: '',
      role: selectedMember.role || 'ADVOGADO',
      oab_number: selectedMember.oab_number || '',
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleCreateFormChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!createForm.full_name_oab.trim()) { setFormError('Nome completo é obrigatório.'); return; }
    if (!createForm.username.trim()) { setFormError('Usuário é obrigatório.'); return; }
    if (!createForm.email.trim()) { setFormError('E-mail é obrigatório.'); return; }
    if (!createForm.password.trim()) { setFormError('Senha é obrigatória.'); return; }

    try {
      setFormLoading(true);
      const created = await createTeamMember({
        full_name_oab: createForm.full_name_oab.trim(),
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
        oab_number: createForm.oab_number.trim(),
      });
      setIsCreateOpen(false);
      resetCreateForm();
      await loadMembers();
      if (created?.id) {
        setSelectedLawyer(String(created.id));
        setActiveKpi('contatos');
      }
      showFeedback('Novo membro adicionado à equipe.', 'success');
    } catch (error) {
      setFormError(error?.message || 'Não foi possível criar o membro.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editTarget) {
      return;
    }

    try {
      setFormLoading(true);
      setFormError('');
      await updateTeamMember(editTarget.id, {
        full_name_oab: editForm.full_name_oab.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        oab_number: editForm.oab_number.trim(),
      });
      setIsEditOpen(false);
      await loadMembers();
      showFeedback('Dados do profissional atualizados.', 'success');
    } catch (error) {
      setFormError(error?.message || 'Não foi possível atualizar o membro.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedMember) {
      return;
    }

    if (!window.confirm(`Desativar ${selectedMember.full_name_oab || selectedMember.username}?`)) {
      return;
    }

    try {
      await deactivateTeamMember(selectedMember.id);
      setSelectedLawyer('all');
      setActiveKpi('contatos');
      await loadMembers();
      showFeedback('Profissional desativado com sucesso.', 'success');
    } catch (error) {
      showFeedback(error?.message || 'Não foi possível desativar o profissional.', 'error');
    }
  };

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
        {feedback.text && (
          <div className={`master-admin-feedback master-admin-feedback--${feedback.type}`}>
            {feedback.text}
          </div>
        )}

        <header className="master-admin-header">
          <div className="master-admin-header-text">
            <h1 className="master-admin-title">Painel Administrativo</h1>
            <p className="master-admin-subtitle">
              Etapa 1 (protótipo): filtro principal por advogado, data inicial e data final.
            </p>
          </div>
          <div className="master-admin-header-actions">
            <button className="master-admin-btn-add" type="button" onClick={handleCreateOpen}>
              + Adicionar Novo Membro
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

        <div className="master-admin-filters-grid">
          <div className="master-admin-field">
            <label className="master-admin-label" htmlFor="master-lawyer-filter">Advogado(a)</label>
            <select
              id="master-lawyer-filter"
              className="master-admin-select"
              value={selectedLawyer}
              disabled={membersLoading}
              onChange={(event) => {
                setSelectedLawyer(event.target.value);
                setActiveKpi('contatos');
              }}
            >
              {lawyerOptions.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>{lawyer.label}</option>
              ))}
            </select>
            {membersError && <span className="master-admin-field-error">{membersError}</span>}
          </div>

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

          {selectedLawyer !== 'all' && (
            <div className="master-admin-field master-admin-field--actions">
              <span className="master-admin-label" aria-hidden="true">Ações</span>
              <div className="master-admin-member-actions">
                <button className="master-admin-btn-edit" type="button" onClick={handleEditOpen}>
                  Editar
                </button>
                <button className="master-admin-btn-deactivate" type="button" onClick={handleDeactivate}>
                  Desativar
                </button>
              </div>
            </div>
          )}
        </div>

        <section className="master-admin-kpi-row" aria-label="Resumo por tópico">
          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--contacts ${activeKpi === 'contatos' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'contatos'}
            onClick={() => setActiveKpi('contatos')}
          >
            <p className="master-admin-kpi-title">Contatos</p>
            <strong className="master-admin-kpi-value">{contactsTotal}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--cases ${activeKpi === 'processos' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'processos'}
            onClick={() => setActiveKpi('processos')}
          >
            <p className="master-admin-kpi-title">Processos</p>
            <strong className="master-admin-kpi-value">{totals.processos}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--tasks ${activeKpi === 'tarefas' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'tarefas'}
            onClick={() => setActiveKpi('tarefas')}
          >
            <p className="master-admin-kpi-title">Tarefas</p>
            <strong className="master-admin-kpi-value">{totals.tarefas}</strong>
          </button>

          <button
            type="button"
            className={`master-admin-kpi-card master-admin-kpi-card--finance ${activeKpi === 'financeiro' ? 'is-active' : ''}`}
            aria-pressed={activeKpi === 'financeiro'}
            onClick={() => setActiveKpi('financeiro')}
          >
            <p className="master-admin-kpi-title">Financeiro</p>
            <strong className="master-admin-kpi-value">{formatCurrency(totals.financeiro)}</strong>
          </button>
        </section>

        {activeKpi === 'contatos' ? (
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
        ) : (
          <section className="master-admin-placeholder-section" aria-label="Bloco em integração">
            <h2 className="master-admin-placeholder-title">Bloco em integração</h2>
            <p className="master-admin-placeholder-text">
              Este KPI ainda será espelhado no mesmo padrão do bloco de contatos, reaproveitando a tela original em modo leitura.
            </p>
          </section>
        )}

        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Adicionar Novo Membro"
          size="medium"
        >
          <form className="master-admin-form" onSubmit={handleCreateSubmit}>
            <div className="master-admin-form-field">
              <label htmlFor="member_full_name_oab">Nome completo (OAB)</label>
              <input id="member_full_name_oab" name="full_name_oab" value={createForm.full_name_oab} onChange={handleCreateFormChange} />
            </div>
            <div className="master-admin-form-row">
              <div className="master-admin-form-field">
                <label htmlFor="member_username">Usuário</label>
                <input id="member_username" name="username" value={createForm.username} onChange={handleCreateFormChange} />
              </div>
              <div className="master-admin-form-field">
                <label htmlFor="member_role">Cargo</label>
                <select id="member_role" name="role" value={createForm.role} onChange={handleCreateFormChange}>
                  <option value="ADVOGADO">Advogado(a)</option>
                  <option value="ESTAGIARIO">Estagiário(a)</option>
                </select>
              </div>
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="member_email">E-mail</label>
              <input id="member_email" name="email" type="email" value={createForm.email} onChange={handleCreateFormChange} />
            </div>
            <div className="master-admin-form-row">
              <div className="master-admin-form-field">
                <label htmlFor="member_oab_number">Número OAB</label>
                <input id="member_oab_number" name="oab_number" value={createForm.oab_number} onChange={handleCreateFormChange} />
              </div>
              <div className="master-admin-form-field">
                <label htmlFor="member_password">Senha provisória</label>
                <input id="member_password" name="password" type="password" value={createForm.password} onChange={handleCreateFormChange} />
              </div>
            </div>
            {formError && <p className="master-admin-form-error">{formError}</p>}
            <div className="master-admin-form-actions">
              <button type="button" className="master-admin-btn-secondary" onClick={() => setIsCreateOpen(false)} disabled={formLoading}>Cancelar</button>
              <button type="submit" className="master-admin-btn-add" disabled={formLoading}>{formLoading ? 'Salvando...' : 'Criar Membro'}</button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Editar Profissional${selectedMember ? ` - ${selectedMember.full_name_oab || selectedMember.username}` : ''}`}
          size="medium"
        >
          <form className="master-admin-form" onSubmit={handleEditSubmit}>
            <div className="master-admin-form-field">
              <label htmlFor="edit_full_name_oab">Nome completo (OAB)</label>
              <input id="edit_full_name_oab" name="full_name_oab" value={editForm.full_name_oab} onChange={handleEditFormChange} />
            </div>
            <div className="master-admin-form-row">
              <div className="master-admin-form-field">
                <label htmlFor="edit_username">Usuário</label>
                <input id="edit_username" name="username" value={editForm.username} disabled />
              </div>
              <div className="master-admin-form-field">
                <label htmlFor="edit_role">Cargo</label>
                <select id="edit_role" name="role" value={editForm.role} onChange={handleEditFormChange}>
                  <option value="ADVOGADO">Advogado(a)</option>
                  <option value="ESTAGIARIO">Estagiário(a)</option>
                </select>
              </div>
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="edit_email">E-mail</label>
              <input id="edit_email" name="email" type="email" value={editForm.email} onChange={handleEditFormChange} />
            </div>
            <div className="master-admin-form-field">
              <label htmlFor="edit_oab_number">Número OAB</label>
              <input id="edit_oab_number" name="oab_number" value={editForm.oab_number} onChange={handleEditFormChange} />
            </div>
            {formError && <p className="master-admin-form-error">{formError}</p>}
            <div className="master-admin-form-actions">
              <button type="button" className="master-admin-btn-secondary" onClick={() => setIsEditOpen(false)} disabled={formLoading}>Cancelar</button>
              <button type="submit" className="master-admin-btn-edit" disabled={formLoading}>{formLoading ? 'Salvando...' : 'Salvar Alterações'}</button>
            </div>
          </form>
        </Modal>
      </section>
    </main>
  );
}
