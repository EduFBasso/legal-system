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

const MASTER_SCOPE_STORAGE_KEY = 'master_selected_member_scope';

const MASTER_TABS = {
  EQUIPE: 'EQUIPE',
  CONTATOS: 'CONTATOS',
  PROCESSOS: 'PROCESSOS',
  TAREFAS: 'TAREFAS',
};

export default function MasterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [activeTab, setActiveTab] = useState(MASTER_TABS.EQUIPE);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Modal de criação
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Mensagem de feedback inline
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  // Modal de edição de credenciais
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Fluxo de substituição
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [replaceStep, setReplaceStep] = useState(1);
  const [replaceNewMode, setReplaceNewMode] = useState('criar'); // 'criar' | 'reativar'
  const [replaceForm, setReplaceForm] = useState(EMPTY_FORM);
  const [replaceSelectedInactiveId, setReplaceSelectedInactiveId] = useState('');
  const [replaceTransfer, setReplaceTransfer] = useState({
    processos_ativos: true,
    tarefas_pendentes: true,
    contatos: true,
    honorarios: true,
    processos_encerrados: false,
  });
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);

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

  useEffect(() => {
    if (!members.length) return;
    const hasSelected = members.some((m) => String(m.id) === String(selectedMemberId));
    if (selectedMemberId && hasSelected) return;

    const preferred = members.find((m) => m.profile_is_active && m.role !== 'MASTER')
      || members.find((m) => m.profile_is_active)
      || members[0];

    if (preferred) {
      setSelectedMemberId(String(preferred.id));
    }
  }, [members, selectedMemberId]);

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

  const handleEditOpen = (member) => {
    setEditTarget(member);
    setEditForm({
      full_name_oab: member.full_name_oab || '',
      username: member.username || '',
      email: member.email || '',
      password: '',
      role: member.role || 'ADVOGADO',
      oab_number: member.oab_number || '',
    });
    setIsEditOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    showFeedback(`Credenciais de ${editTarget?.full_name_oab || editTarget?.username} atualizadas. (integração com API pendente)`, 'success');
    setIsEditOpen(false);
  };

  const handleReplaceOpen = (member) => {
    setReplaceTarget(member);
    setReplaceStep(1);
    setReplaceNewMode('criar');
    setReplaceForm(EMPTY_FORM);
    setReplaceSelectedInactiveId('');
    setReplaceTransfer({
      processos_ativos: true,
      tarefas_pendentes: true,
      contatos: true,
      honorarios: true,
      processos_encerrados: false,
    });
    setReplaceConfirmed(false);
    setIsReplaceOpen(true);
  };

  const handleReplaceExecute = () => {
    showFeedback(`Substituição de ${replaceTarget?.full_name_oab || replaceTarget?.username} registrada com sucesso. (integração com API pendente)`, 'success');
    setIsReplaceOpen(false);
  };

  if (!user || user.role !== 'MASTER') return null;

  const activeMembers = members.filter((m) => m.profile_is_active);
  const inactiveMembers = members.filter((m) => !m.profile_is_active);
  const selectedMember = members.find((m) => String(m.id) === String(selectedMemberId)) || null;

  const navigateWithScope = (basePath) => {
    if (!selectedMember) {
      showFeedback('Selecione um membro da equipe para continuar.', 'error');
      return;
    }

    const scope = {
      id: selectedMember.id,
      username: selectedMember.username,
      role: selectedMember.role,
      full_name_oab: selectedMember.full_name_oab,
      email: selectedMember.email,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(MASTER_SCOPE_STORAGE_KEY, JSON.stringify(scope));
    const separator = basePath.includes('?') ? '&' : '?';
    navigate(`${basePath}${separator}teamMemberId=${selectedMember.id}&masterView=1`);
  };

  return (
    <div className="master-page">
      <div className="master-page-header">
        <div className="master-page-title-group">
          <span className="master-page-badge">M</span>
          <h1 className="master-page-title">Painel Master</h1>
        </div>
        <p className="master-page-subtitle">Gerenciamento da equipe do escritório</p>
        <div className="master-tabs" role="tablist" aria-label="Seções do painel master">
          <button
            type="button"
            className={`master-tab ${activeTab === MASTER_TABS.EQUIPE ? 'master-tab--active' : ''}`}
            onClick={() => setActiveTab(MASTER_TABS.EQUIPE)}
          >
            Equipe
          </button>
          <button
            type="button"
            className={`master-tab ${activeTab === MASTER_TABS.CONTATOS ? 'master-tab--active' : ''}`}
            onClick={() => setActiveTab(MASTER_TABS.CONTATOS)}
          >
            Contatos
          </button>
          <button
            type="button"
            className={`master-tab ${activeTab === MASTER_TABS.PROCESSOS ? 'master-tab--active' : ''}`}
            onClick={() => setActiveTab(MASTER_TABS.PROCESSOS)}
          >
            Processos
          </button>
          <button
            type="button"
            className={`master-tab ${activeTab === MASTER_TABS.TAREFAS ? 'master-tab--active' : ''}`}
            onClick={() => setActiveTab(MASTER_TABS.TAREFAS)}
          >
            Tarefas
          </button>
        </div>
      </div>

      {feedback.text && (
        <div className={`master-feedback master-feedback--${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      {activeTab === MASTER_TABS.EQUIPE && (
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
              onEdit={handleEditOpen}
              onReplace={handleReplaceOpen}
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
      )}

      {activeTab === MASTER_TABS.CONTATOS && (
        <MasterNavigationPanel
          title="📇 Contatos"
          members={activeMembers}
          selectedMemberId={selectedMemberId}
          setSelectedMemberId={setSelectedMemberId}
          selectedMember={selectedMember}
          helper="Abra a tela de contatos com o membro selecionado como escopo de visualização do Master."
          actionLabel="Abrir Contatos"
          onNavigate={() => navigateWithScope('/contacts')}
        />
      )}

      {activeTab === MASTER_TABS.PROCESSOS && (
        <MasterNavigationPanel
          title="⚖️ Processos"
          members={activeMembers}
          selectedMemberId={selectedMemberId}
          setSelectedMemberId={setSelectedMemberId}
          selectedMember={selectedMember}
          helper="Abra a tela de processos com o membro selecionado como escopo de visualização do Master."
          actionLabel="Abrir Processos"
          onNavigate={() => navigateWithScope('/cases')}
        />
      )}

      {activeTab === MASTER_TABS.TAREFAS && (
        <MasterNavigationPanel
          title="⏰ Tarefas"
          members={activeMembers}
          selectedMemberId={selectedMemberId}
          setSelectedMemberId={setSelectedMemberId}
          selectedMember={selectedMember}
          helper="Abra a tela de tarefas agendadas com o membro selecionado como escopo de visualização do Master."
          actionLabel="Abrir Tarefas"
          onNavigate={() => navigateWithScope('/deadlines')}
        />
      )}

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

      {/* Modal de edição de credenciais */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Editar Credenciais — ${editTarget?.full_name_oab || editTarget?.username || ''}`}
        size="medium"
      >
        <div className="master-proto-banner">
          ⚠️ Protótipo visual — salvamento real pendente de integração com API.
        </div>
        <form className="master-form" onSubmit={handleEditSave} noValidate>
          <div className="master-form-field">
            <label htmlFor="edit_full_name_oab">Nome completo (OAB)</label>
            <input
              id="edit_full_name_oab"
              name="full_name_oab"
              type="text"
              value={editForm.full_name_oab}
              onChange={handleEditFormChange}
            />
          </div>
          <div className="master-form-row">
            <div className="master-form-field">
              <label htmlFor="edit_username">Usuário</label>
              <input
                id="edit_username"
                name="username"
                type="text"
                value={editForm.username}
                onChange={handleEditFormChange}
              />
            </div>
            <div className="master-form-field">
              <label htmlFor="edit_role">Cargo</label>
              <select id="edit_role" name="role" value={editForm.role} onChange={handleEditFormChange}>
                <option value="ADVOGADO">Advogado(a)</option>
                <option value="ESTAGIARIO">Estagiário(a)</option>
              </select>
            </div>
          </div>
          <div className="master-form-field">
            <label htmlFor="edit_email">E-mail</label>
            <input
              id="edit_email"
              name="email"
              type="email"
              value={editForm.email}
              onChange={handleEditFormChange}
            />
          </div>
          <div className="master-form-row">
            <div className="master-form-field">
              <label htmlFor="edit_oab_number">Número OAB</label>
              <input
                id="edit_oab_number"
                name="oab_number"
                type="text"
                value={editForm.oab_number}
                onChange={handleEditFormChange}
              />
            </div>
            <div className="master-form-field">
              <label htmlFor="edit_password">Nova senha <span className="master-form-optional">(deixe em branco para manter)</span></label>
              <input
                id="edit_password"
                name="password"
                type="password"
                value={editForm.password}
                onChange={handleEditFormChange}
                placeholder="Nova senha (opcional)"
              />
            </div>
          </div>
          <div className="master-form-footer">
            <button type="button" className="master-btn master-btn--ghost" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="master-btn master-btn--primary">
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>

      {/* Wizard de substituição */}
      <Modal
        isOpen={isReplaceOpen}
        onClose={() => setIsReplaceOpen(false)}
        title="Substituir Advogado(a)"
        size="large"
      >
        <SubstituirModal
          target={replaceTarget}
          step={replaceStep}
          setStep={setReplaceStep}
          newMode={replaceNewMode}
          setNewMode={setReplaceNewMode}
          replaceForm={replaceForm}
          setReplaceForm={setReplaceForm}
          inactiveMembers={inactiveMembers}
          replaceSelectedInactiveId={replaceSelectedInactiveId}
          setReplaceSelectedInactiveId={setReplaceSelectedInactiveId}
          transfer={replaceTransfer}
          setTransfer={setReplaceTransfer}
          confirmed={replaceConfirmed}
          setConfirmed={setReplaceConfirmed}
          onExecute={handleReplaceExecute}
          onCancel={() => setIsReplaceOpen(false)}
        />
      </Modal>
    </div>
  );
}

function MasterNavigationPanel({
  title,
  members,
  selectedMemberId,
  setSelectedMemberId,
  selectedMember,
  helper,
  actionLabel,
  onNavigate,
}) {
  return (
    <section className="master-section">
      <div className="master-section-header">
        <h2 className="master-section-title">{title}</h2>
      </div>

      <div className="master-scope-row">
        <div className="master-scope-field">
          <label htmlFor="master-member-scope">Membro da equipe</label>
          <select
            id="master-member-scope"
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name_oab || member.username} ({ROLE_LABELS[member.role] || member.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="master-scope-helper">{helper}</p>

      {selectedMember && (
        <p className="master-scope-preview">
          Selecionado: <strong>{selectedMember.full_name_oab || selectedMember.username}</strong>
          {selectedMember.oab_number ? ` • OAB ${selectedMember.oab_number}` : ''}
        </p>
      )}

      <div className="master-scope-actions">
        <button
          type="button"
          className="master-btn master-btn--primary"
          onClick={onNavigate}
          disabled={!selectedMember}
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

// ── Mock carteira helper ──────────────────────────────────────────────────────
function getMockCarteira(member) {
  const seed = member?.id || 1;
  return {
    processos_ativos:    12 + (seed % 9),
    tarefas_pendentes:    5 + (seed % 7),
    tarefas_urgentes:     1 + (seed % 4),
    contatos_vinculados: 18 + (seed % 13),
    honorarios_aberto:  3200 + seed * 380,
    processos_encerrados: 28 + (seed % 22),
  };
}

function TeamTable({ rows, isInactive = false, onDeactivate, onReactivate, onEdit, onReplace, currentUserId }) {
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
                <div className="master-cell-actions">
                  {!isInactive && m.id !== currentUserId && (
                    <>
                      <button
                        className="master-btn master-btn--edit-sm"
                        onClick={() => onEdit(m)}
                        title="Editar credenciais"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        className="master-btn master-btn--replace-sm"
                        onClick={() => onReplace(m)}
                        title="Substituir advogado"
                      >
                        🔄 Substituir
                      </button>
                      <button
                        className="master-btn master-btn--danger-sm"
                        onClick={() => onDeactivate(m)}
                        title="Desativar membro"
                      >
                        Desativar
                      </button>
                    </>
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Wizard de Substituição ────────────────────────────────────────────────────
const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

function SubstituirModal({
  target, step, setStep,
  newMode, setNewMode,
  replaceForm, setReplaceForm,
  inactiveMembers,
  replaceSelectedInactiveId, setReplaceSelectedInactiveId,
  transfer, setTransfer,
  confirmed, setConfirmed,
  onExecute, onCancel,
}) {
  const carteira = getMockCarteira(target);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setReplaceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransferChange = (key) => {
    setTransfer((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canProceedStep2 = newMode === 'criar'
    ? replaceForm.full_name_oab.trim() && replaceForm.email.trim() && replaceForm.username.trim()
    : !!replaceSelectedInactiveId;

  return (
    <div className="substituir-wizard">

      {/* Banner protótipo */}
      <div className="master-proto-banner">
        ⚠️ Protótipo visual — operação real pendente de integração com API.
      </div>

      {/* Indicador de passos */}
      <div className="substituir-steps">
        {[
          { n: 1, label: 'Confirmar saída' },
          { n: 2, label: 'Cadastrar substituto' },
          { n: 3, label: 'Transferir carteira' },
        ].map(({ n, label }) => (
          <div key={n} className={`substituir-step ${step === n ? 'substituir-step--active' : ''} ${step > n ? 'substituir-step--done' : ''}`}>
            <span className="substituir-step-num">{step > n ? '✓' : n}</span>
            <span className="substituir-step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Passo 1: Confirmar saída de A ── */}
      {step === 1 && (
        <div className="substituir-body">
          <div className="substituir-alert substituir-alert--warning">
            <strong>Atenção:</strong> O advogado(a) será desativado(a) e não poderá mais acessar o sistema.
            Todo o histórico (processos encerrados, publicações, ações) será <strong>preservado</strong> para auditoria.
          </div>

          <div className="substituir-who">
            <span className="substituir-who-avatar">
              {(target?.full_name_oab || target?.username || 'A')[0].toUpperCase()}
            </span>
            <div>
              <p className="substituir-who-name">{target?.full_name_oab || target?.username}</p>
              <p className="substituir-who-sub">
                {target?.email || ''}
                {target?.oab_number ? ` · OAB ${target.oab_number}` : ''}
              </p>
            </div>
          </div>

          <h3 className="substituir-carteira-title">Carteira atual <span className="master-proto-tag">mock</span></h3>
          <div className="substituir-carteira-grid">
            <div className="substituir-carteira-card">
              <span className="substituir-carteira-num">{carteira.processos_ativos}</span>
              <span className="substituir-carteira-label">Processos ativos</span>
            </div>
            <div className="substituir-carteira-card">
              <span className="substituir-carteira-num substituir-carteira-num--warn">{carteira.tarefas_pendentes}</span>
              <span className="substituir-carteira-label">Tarefas pendentes</span>
            </div>
            <div className="substituir-carteira-card">
              <span className="substituir-carteira-num substituir-carteira-num--danger">{carteira.tarefas_urgentes}</span>
              <span className="substituir-carteira-label">Urgentes</span>
            </div>
            <div className="substituir-carteira-card">
              <span className="substituir-carteira-num">{carteira.contatos_vinculados}</span>
              <span className="substituir-carteira-label">Contatos</span>
            </div>
            <div className="substituir-carteira-card">
              <span className="substituir-carteira-num substituir-carteira-num--money">{fmt(carteira.honorarios_aberto)}</span>
              <span className="substituir-carteira-label">Honorários em aberto</span>
            </div>
            <div className="substituir-carteira-card substituir-carteira-card--muted">
              <span className="substituir-carteira-num">{carteira.processos_encerrados}</span>
              <span className="substituir-carteira-label">Processos encerrados (ficam com A)</span>
            </div>
          </div>

          <div className="substituir-footer">
            <button type="button" className="master-btn master-btn--ghost" onClick={onCancel}>Cancelar</button>
            <button type="button" className="master-btn master-btn--primary" onClick={() => setStep(2)}>
              Continuar → Cadastrar substituto
            </button>
          </div>
        </div>
      )}

      {/* ── Passo 2: Cadastrar B ── */}
      {step === 2 && (
        <div className="substituir-body">
          <div className="substituir-mode-toggle">
            <button
              type="button"
              className={`substituir-mode-btn ${newMode === 'criar' ? 'substituir-mode-btn--active' : ''}`}
              onClick={() => setNewMode('criar')}
            >
              ➕ Criar novo cadastro
            </button>
            <button
              type="button"
              className={`substituir-mode-btn ${newMode === 'reativar' ? 'substituir-mode-btn--active' : ''}`}
              onClick={() => setNewMode('reativar')}
            >
              🔄 Reativar membro inativo
            </button>
          </div>

          {newMode === 'criar' && (
            <div className="master-form">
              <div className="master-form-field">
                <label>Nome completo (OAB) *</label>
                <input name="full_name_oab" type="text" value={replaceForm.full_name_oab}
                  onChange={handleFormChange} placeholder="Ex: Ana Lima Santos" />
              </div>
              <div className="master-form-row">
                <div className="master-form-field">
                  <label>Usuário *</label>
                  <input name="username" type="text" value={replaceForm.username}
                    onChange={handleFormChange} placeholder="Ex: ana.lima" />
                </div>
                <div className="master-form-field">
                  <label>Cargo</label>
                  <select name="role" value={replaceForm.role} onChange={handleFormChange}>
                    <option value="ADVOGADO">Advogado(a)</option>
                    <option value="ESTAGIARIO">Estagiário(a)</option>
                  </select>
                </div>
              </div>
              <div className="master-form-row">
                <div className="master-form-field">
                  <label>E-mail *</label>
                  <input name="email" type="email" value={replaceForm.email}
                    onChange={handleFormChange} placeholder="ana@escritorio.com" />
                </div>
                <div className="master-form-field">
                  <label>Número OAB</label>
                  <input name="oab_number" type="text" value={replaceForm.oab_number}
                    onChange={handleFormChange} placeholder="Ex: 412345" />
                </div>
              </div>
              <div className="master-form-field">
                <label>Senha provisória *</label>
                <input name="password" type="password" value={replaceForm.password}
                  onChange={handleFormChange} placeholder="Mínimo 8 caracteres" />
              </div>
            </div>
          )}

          {newMode === 'reativar' && (
            <div className="master-form">
              {inactiveMembers.length === 0 ? (
                <p className="master-empty-note">Nenhum membro inativo disponível para reativação.</p>
              ) : (
                <div className="master-form-field">
                  <label>Selecionar membro inativo para reativar</label>
                  <select
                    value={replaceSelectedInactiveId}
                    onChange={(e) => setReplaceSelectedInactiveId(e.target.value)}
                  >
                    <option value="">— Selecione —</option>
                    {inactiveMembers.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.full_name_oab || m.username}
                        {m.oab_number ? ` (OAB ${m.oab_number})` : ''}
                        {m.email ? ` · ${m.email}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="substituir-reativar-note">
                    O membro será reativado e passará a receber a carteira transferida.
                    Login e credenciais permanecem as mesmas — recomende alterar a senha.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="substituir-footer">
            <button type="button" className="master-btn master-btn--ghost" onClick={() => setStep(1)}>← Voltar</button>
            <button
              type="button"
              className="master-btn master-btn--primary"
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
            >
              Continuar → Transferir carteira
            </button>
          </div>
        </div>
      )}

      {/* ── Passo 3: Configurar transferência ── */}
      {step === 3 && (
        <div className="substituir-body">
          <h3 className="substituir-transfer-title">O que transferir para o substituto?</h3>
          <p className="substituir-transfer-sub">
            Itens não transferidos permanecem vinculados a{' '}
            <strong>{target?.full_name_oab || target?.username}</strong>{' '}
            de forma histórica (somente leitura).
          </p>

          <div className="substituir-transfer-list">
            <label className="substituir-transfer-item">
              <input type="checkbox" checked={transfer.processos_ativos}
                onChange={() => handleTransferChange('processos_ativos')} />
              <div>
                <span className="substituir-transfer-item-label">Processos ativos</span>
                <span className="substituir-transfer-item-count">{carteira.processos_ativos} processos</span>
              </div>
            </label>

            <label className="substituir-transfer-item">
              <input type="checkbox" checked={transfer.tarefas_pendentes}
                onChange={() => handleTransferChange('tarefas_pendentes')} />
              <div>
                <span className="substituir-transfer-item-label">Tarefas pendentes e urgentes</span>
                <span className="substituir-transfer-item-count">
                  {carteira.tarefas_pendentes} pendentes · {carteira.tarefas_urgentes} urgentes
                </span>
              </div>
            </label>

            <label className="substituir-transfer-item">
              <input type="checkbox" checked={transfer.contatos}
                onChange={() => handleTransferChange('contatos')} />
              <div>
                <span className="substituir-transfer-item-label">Contatos vinculados</span>
                <span className="substituir-transfer-item-count">{carteira.contatos_vinculados} contatos</span>
              </div>
            </label>

            <label className="substituir-transfer-item">
              <input type="checkbox" checked={transfer.honorarios}
                onChange={() => handleTransferChange('honorarios')} />
              <div>
                <span className="substituir-transfer-item-label">Honorários em aberto</span>
                <span className="substituir-transfer-item-count">{fmt(carteira.honorarios_aberto)}</span>
              </div>
            </label>

            <label className="substituir-transfer-item substituir-transfer-item--muted">
              <input type="checkbox" checked={transfer.processos_encerrados}
                onChange={() => handleTransferChange('processos_encerrados')} />
              <div>
                <span className="substituir-transfer-item-label">Processos encerrados</span>
                <span className="substituir-transfer-item-count">
                  {carteira.processos_encerrados} processos · ⚠️ Não recomendado — preserva auditoria histórica
                </span>
              </div>
            </label>
          </div>

          <div className="substituir-confirm-block">
            <label className="substituir-confirm-label">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              <span>
                Entendo que esta operação desativa{' '}
                <strong>{target?.full_name_oab || target?.username}</strong>,
                transfere os itens selecionados ao substituto e{' '}
                <strong>não pode ser desfeita automaticamente</strong>.
              </span>
            </label>
          </div>

          <div className="substituir-footer">
            <button type="button" className="master-btn master-btn--ghost" onClick={() => setStep(2)}>← Voltar</button>
            <button
              type="button"
              className="master-btn master-btn--danger"
              onClick={onExecute}
              disabled={!confirmed}
            >
              ✓ Executar Substituição
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
