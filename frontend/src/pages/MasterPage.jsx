// src/pages/MasterPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import {
  getTeamMembers,
  createTeamMember,
  deactivateTeamMember,
  reactivateTeamMember,
} from '../services/teamService';
import './MasterPage.css';

const ROLE_LABELS = {
  MASTER: 'Master',
  ADVOGADO: 'Advogado(a)',
  ESTAGIARIO: 'Estagiário(a)',
};

const EMPTY_FORM = {
  full_name_oab: '',
  username: '',
  email: '',
  password: '',
  role: 'ADVOGADO',
  oab_number: '',
};

export default function MasterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modal de criação
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Mensagem de feedback inline
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Guard: somente MASTER acessa
  useEffect(() => {
    if (user && user.role !== 'MASTER') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTeamMembers({ includeInactive });
      setMembers(data);
    } catch {
      setError('Não foi possível carregar a equipe.');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const showFeedback = (text, type = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
  };

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Desativar ${member.full_name_oab || member.username}? O membro não poderá mais acessar o sistema, mas seus dados serão preservados.`)) return;
    try {
      await deactivateTeamMember(member.id);
      showFeedback(`${member.full_name_oab || member.username} foi desativado(a).`);
      loadMembers();
    } catch {
      showFeedback('Erro ao desativar membro.', 'error');
    }
  };

  const handleReactivate = async (member) => {
    try {
      await reactivateTeamMember(member.id);
      showFeedback(`${member.full_name_oab || member.username} foi reativado(a).`);
      loadMembers();
    } catch {
      showFeedback('Erro ao reativar membro.', 'error');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.full_name_oab.trim()) { setFormError('Nome completo é obrigatório.'); return; }
    if (!form.username.trim()) { setFormError('Nome de usuário é obrigatório.'); return; }
    if (!form.email.trim()) { setFormError('E-mail é obrigatório.'); return; }
    if (!form.password.trim()) { setFormError('Senha é obrigatória.'); return; }

    setFormLoading(true);
    try {
      const payload = {
        full_name_oab: form.full_name_oab.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      if (form.oab_number.trim()) payload.oab_number = form.oab_number.trim();

      await createTeamMember(payload);
      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
      showFeedback(`${payload.full_name_oab} adicionado(a) à equipe.`);
      loadMembers();
    } catch (err) {
      setFormError(err?.message || 'Erro ao criar membro. Verifique os dados.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!user || user.role !== 'MASTER') return null;

  const activeMembers = members.filter((m) => m.profile_is_active);
  const inactiveMembers = members.filter((m) => !m.profile_is_active);

  return (
    <div className="master-page">
      <div className="master-page-header">
        <div className="master-page-title-group">
          <span className="master-page-badge">M</span>
          <h1 className="master-page-title">Painel Master</h1>
        </div>
        <p className="master-page-subtitle">Gerenciamento da equipe do escritório</p>
      </div>

      {feedback.text && (
        <div className={`master-feedback master-feedback--${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      <section className="master-section">
        <div className="master-section-header">
          <h2 className="master-section-title">👥 Equipe</h2>
          <div className="master-section-actions">
            <label className="master-toggle-label">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              Exibir inativos
            </label>
            <button
              className="master-btn master-btn--primary"
              onClick={() => { setForm(EMPTY_FORM); setFormError(''); setIsCreateOpen(true); }}
            >
              + Novo Membro
            </button>
          </div>
        </div>

        {loading && <p className="master-loading">Carregando equipe…</p>}
        {error && <p className="master-error">{error}</p>}

        {!loading && !error && (
          <>
            <TeamTable
              rows={activeMembers}
              onDeactivate={handleDeactivate}
              currentUserId={user?.id}
            />

            {includeInactive && inactiveMembers.length > 0 && (
              <div className="master-inactive-section">
                <h3 className="master-inactive-title">Inativos ({inactiveMembers.length})</h3>
                <TeamTable
                  rows={inactiveMembers}
                  isInactive
                  onReactivate={handleReactivate}
                  currentUserId={user?.id}
                />
              </div>
            )}

            {includeInactive && inactiveMembers.length === 0 && (
              <p className="master-empty-note">Nenhum membro inativo.</p>
            )}
          </>
        )}
      </section>

      {/* Modal de criação */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Novo Membro da Equipe"
        size="medium"
      >
        <form className="master-form" onSubmit={handleCreateSubmit} noValidate>
          <div className="master-form-field">
            <label htmlFor="full_name_oab">Nome completo (OAB) *</label>
            <input
              id="full_name_oab"
              name="full_name_oab"
              type="text"
              value={form.full_name_oab}
              onChange={handleFormChange}
              placeholder="Ex: Carla Souza Mendes"
              required
            />
          </div>

          <div className="master-form-row">
            <div className="master-form-field">
              <label htmlFor="username">Usuário *</label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleFormChange}
                placeholder="Ex: carla.souza"
                required
              />
            </div>
            <div className="master-form-field">
              <label htmlFor="role">Cargo *</label>
              <select id="role" name="role" value={form.role} onChange={handleFormChange}>
                <option value="ADVOGADO">Advogado(a)</option>
                <option value="ESTAGIARIO">Estagiário(a)</option>
              </select>
            </div>
          </div>

          <div className="master-form-field">
            <label htmlFor="email">E-mail *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleFormChange}
              placeholder="carla@escritorio.com"
              required
            />
          </div>

          <div className="master-form-row">
            <div className="master-form-field">
              <label htmlFor="oab_number">Número OAB</label>
              <input
                id="oab_number"
                name="oab_number"
                type="text"
                value={form.oab_number}
                onChange={handleFormChange}
                placeholder="Ex: 123456"
              />
            </div>
            <div className="master-form-field">
              <label htmlFor="password">Senha provisória *</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleFormChange}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
          </div>

          {formError && <p className="master-form-error">{formError}</p>}

          <div className="master-form-footer">
            <button
              type="button"
              className="master-btn master-btn--ghost"
              onClick={() => setIsCreateOpen(false)}
              disabled={formLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="master-btn master-btn--primary"
              disabled={formLoading}
            >
              {formLoading ? 'Salvando…' : 'Criar Membro'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TeamTable({ rows, isInactive = false, onDeactivate, onReactivate, currentUserId }) {
  if (rows.length === 0) {
    return <p className="master-empty-note">Nenhum membro ativo no momento.</p>;
  }

  return (
    <div className="master-table-wrapper">
      <table className="master-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Usuário</th>
            <th>OAB</th>
            <th>Cargo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className={isInactive ? 'master-row--inactive' : ''}>
              <td className="master-cell-name">{m.full_name_oab || '—'}</td>
              <td className="master-cell-username">{m.username}</td>
              <td>{m.oab_number || '—'}</td>
              <td>
                <span className={`master-role-badge master-role-badge--${m.role?.toLowerCase()}`}>
                  {ROLE_LABELS[m.role] || m.role}
                </span>
              </td>
              <td>
                <span className={`master-status-dot ${m.profile_is_active ? 'master-status-dot--active' : 'master-status-dot--inactive'}`}>
                  {m.profile_is_active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                {!isInactive && m.id !== currentUserId && (
                  <button
                    className="master-btn master-btn--danger-sm"
                    onClick={() => onDeactivate(m)}
                    title="Desativar membro"
                  >
                    Desativar
                  </button>
                )}
                {isInactive && (
                  <button
                    className="master-btn master-btn--success-sm"
                    onClick={() => onReactivate(m)}
                    title="Reativar membro"
                  >
                    Reativar
                  </button>
                )}
                {!isInactive && m.id === currentUserId && (
                  <span className="master-self-label">Você</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
