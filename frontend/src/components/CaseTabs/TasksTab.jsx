import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { formatDate } from '../../utils/formatters';

const URGENCY_OPTIONS = [
  { value: 'NORMAL', label: 'Normal', color: '#10b981' },
  { value: 'URGENTE', label: 'Urgente', color: '#f59e0b' },
  { value: 'URGENTISSIMO', label: 'Urgentíssimo', color: '#dc2626' },
];

function TasksTab({
  caseId,
  tasks = [],
  movimentacoes = [],
  loading = false,
  onRefresh = () => {},
  onCreateTask = () => {},
  onUpdateTaskStatus = () => {},
  onDeleteTask = () => {},
}) {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    urgencia: 'NORMAL',
    movimentacao: '',
    data_vencimento: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    await onCreateTask({
      case: Number(caseId),
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      urgencia: form.urgencia,
      movimentacao: form.movimentacao ? Number(form.movimentacao) : null,
      data_vencimento: form.data_vencimento || null,
      status: 'PENDENTE',
    });

    setForm({
      titulo: '',
      descricao: '',
      urgencia: 'NORMAL',
      movimentacao: '',
      data_vencimento: '',
    });
  };

  const urgencyColor = (urgencia) => {
    const option = URGENCY_OPTIONS.find(item => item.value === urgencia);
    return option?.color || '#64748b';
  };

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">✅ Tarefas do Processo</h2>
            <p className="section-subtitle">Compromissos e pendências vinculadas a este caso</p>
          </div>
          <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>🔄 Atualizar</button>
        </div>

        <form onSubmit={handleSubmit} className="form-group" style={{ marginBottom: '1rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Título da tarefa *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Ligar para cliente antes da audiência"
                required
              />
            </div>
            <div className="form-group">
              <label>Vincular à movimentação (opcional)</label>
              <select
                value={form.movimentacao}
                onChange={(e) => setForm(prev => ({ ...prev, movimentacao: e.target.value }))}
              >
                <option value="">Tarefa solta do processo</option>
                {movimentacoes.map(mov => (
                  <option key={mov.id} value={mov.id}>{mov.data} - {mov.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              rows="3"
              value={form.descricao}
              onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Urgência</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {URGENCY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-btn ${form.urgencia === option.value ? 'active' : ''}`}
                    onClick={() => setForm(prev => ({ ...prev, urgencia: option.value }))}
                    style={{
                      borderColor: option.color,
                      color: form.urgencia === option.value ? '#fff' : option.color,
                      background: form.urgencia === option.value ? option.color : '#fff',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Data de vencimento (opcional)</label>
              <input
                type="date"
                value={form.data_vencimento}
                onChange={(e) => setForm(prev => ({ ...prev, data_vencimento: e.target.value }))}
              />
              <small className="form-helper-text">Se vazio, o sistema calcula pelo nível de urgência.</small>
            </div>
          </div>

          <button className="btn btn-primary" type="submit">
            <Plus size={16} />
            Adicionar Tarefa
          </button>
        </form>

        {loading ? (
          <div className="loading-container"><p>Carregando tarefas...</p></div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={Circle}
            message="Nenhuma tarefa cadastrada"
            hint="Crie tarefas vinculadas ao processo para organizar próximos passos."
          />
        ) : (
          <div className="publicacoes-list">
            {tasks.map(task => (
              <div key={task.id} className="publicacao-card" style={{ borderLeft: `5px solid ${urgencyColor(task.urgencia)}` }}>
                <div className="publicacao-header">
                  <div className="publicacao-meta-group">
                    <span className="publicacao-tipo" style={{ background: urgencyColor(task.urgencia), color: '#fff' }}>
                      {task.urgencia_display || task.urgencia}
                    </span>
                    <span className="publicacao-date">Vence: {formatDate(task.data_vencimento)}</span>
                    <span className="publicacao-tribunal">{task.status_display || task.status}</span>
                  </div>

                  <div className="publicacao-actions">
                    <button
                      className="btn-icon-small"
                      title={task.status === 'CONCLUIDA' ? 'Marcar como pendente' : 'Marcar como concluída'}
                      onClick={() => onUpdateTaskStatus(task.id, task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA')}
                    >
                      {task.status === 'CONCLUIDA' ? <Circle size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                    <button
                      className="btn-icon-small btn-danger-ghost"
                      title="Excluir tarefa"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h4 style={{ margin: '0.5rem 0' }}>{task.titulo}</h4>
                {task.descricao && <p style={{ margin: 0, color: '#334155' }}>{task.descricao}</p>}
                {task.movimentacao_titulo && (
                  <small className="form-helper-text">Movimentação: {task.movimentacao_titulo}</small>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TasksTab;
