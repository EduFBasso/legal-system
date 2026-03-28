import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import caseTasksService from '../services/caseTasksService';
import DeadlinesContent from '../components/DeadlinesContent';
import { Button } from '../components/common/Button';
import Toast from '../components/common/Toast';
import { validateDueDateAtLeastTomorrow } from '../utils/taskDueDateValidation';
import { notifyTaskUpdate } from '../services/taskSyncService';
import './DeadlinesPage.css';

/**
 * Dashboard de Tarefas por Urgência
 * 
 * Exibe todas as tarefas do sistema agrupadas por urgência (URGENTISSIMO, URGENTE, NORMAL)
 * Ordenadas por data de vencimento (menores prazos primeiro)
 */
export default function DeadlinesPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const readOnly = searchParams.get('readonly') === '1';
  const [editingTask, setEditingTask] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', autoCloseMs = 3000) => {
    setToast({ message, type, autoCloseMs });
  }, []);

  // Evita recriar params por identidade instável do URLSearchParams.
  // Mantém o mesmo objeto enquanto a querystring não muda.
  const tasksQueryKey = searchParams.toString();
  const tasksQueryParams = useMemo(() => {
    const params = {};
    const sp = new URLSearchParams(tasksQueryKey);
    const teamMemberId = sp.get('team_member_id');
    const teamScope = sp.get('team_scope');
    const excludeOwnerSelf = sp.get('exclude_owner_self');
    const excludeOwnerless = sp.get('exclude_ownerless');

    if (teamMemberId) params.team_member_id = teamMemberId;
    if (teamScope) params.team_scope = teamScope;
    if (excludeOwnerSelf) params.exclude_owner_self = excludeOwnerSelf;
    if (excludeOwnerless) params.exclude_ownerless = excludeOwnerless;

    return params;
  }, [tasksQueryKey]);

  const scopeLabel = searchParams.get('scope_label') || '';

  const displayLabel = useMemo(() => {
    if (scopeLabel) return scopeLabel;
    if (!user) return '';
    const name = user.full_name_oab || user.first_name || user.username || '';
    const oab = user.oab_number || '';
    return oab ? `${name} ${oab}` : name;
  }, [scopeLabel, user]);

  const handleOpenEditTask = useCallback(
    (task) => {
      if (readOnly) return;
      setEditingTask({
        ...task,
        hora_vencimento: task?.hora_vencimento ?? '',
      });
    },
    [readOnly]
  );

  const normalizeTimeHHmm = useCallback((timeValue) => {
    const value = (timeValue || '').toString().trim();
    if (!value) return '';

    const match = value.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
    if (!match) return value;

    const hh = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  const handleDeleteTask = useCallback(
    async (task) => {
      if (readOnly) return;
      if (!task?.id) return;
      const ok = window.confirm('Excluir esta tarefa?');
      if (!ok) return;

      try {
        await caseTasksService.deleteTask(task.id);
        showToast('Tarefa excluída com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao excluir tarefa:', err);
        showToast('Erro ao excluir tarefa.', 'error');
      }
    },
    [readOnly, showToast]
  );

  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!editingTask) return;

    const titulo = (editingTask.titulo || '').toString().trim();
    if (!titulo) {
      showToast('Título da tarefa é obrigatório', 'error');
      return;
    }

    const dueDateValidation = validateDueDateAtLeastTomorrow(editingTask.data_vencimento);
    if (!dueDateValidation.ok) {
      showToast(dueDateValidation.message, 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const normalizedHora = normalizeTimeHHmm(editingTask.hora_vencimento);
      await caseTasksService.patchTask(editingTask.id, {
        titulo: editingTask.titulo,
        descricao: editingTask.descricao,
        data_vencimento: editingTask.data_vencimento,
        hora_vencimento: normalizedHora || null,
      });

      notifyTaskUpdate({
        type: 'task-updated',
        action: 'edited',
        taskId: editingTask.id,
        caseId: editingTask.case,
        titulo: editingTask.titulo,
        data_vencimento: editingTask.data_vencimento,
        timestamp: new Date().toISOString(),
      });

      setEditingTask(null);
      showToast('Tarefa atualizada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      showToast('Erro ao atualizar tarefa.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };


  return (
    <>
      <DeadlinesContent
        tasksQueryParams={tasksQueryParams}
        displayLabel={displayLabel}
        readOnly={readOnly}
        onEditTask={handleOpenEditTask}
        onDeleteTask={handleDeleteTask}
      />

      <Toast
        isOpen={Boolean(toast?.message)}
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        autoCloseMs={toast?.autoCloseMs || 3000}
        onClose={() => setToast(null)}
      />

      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content create-task-modal">
            <div className="modal-header">
              <h2>✏️ Editar Tarefa do Processo</h2>
              <button className="modal-close" onClick={() => setEditingTask(null)}>
                ×
              </button>
            </div>
            <form className="create-task-form" onSubmit={handleSaveEditTask}>
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={editingTask.titulo || ''}
                  onChange={(e) => setEditingTask((prev) => ({ ...prev, titulo: e.target.value }))}
                  disabled={savingEdit}
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  rows={3}
                  value={editingTask.descricao || ''}
                  onChange={(e) => setEditingTask((prev) => ({ ...prev, descricao: e.target.value }))}
                  disabled={savingEdit}
                />
              </div>
              <div className="form-group">
                <label>Data de vencimento</label>
                <input
                  type="date"
                  value={editingTask.data_vencimento || ''}
                  onChange={(e) => setEditingTask((prev) => ({ ...prev, data_vencimento: e.target.value }))}
                  disabled={savingEdit}
                />
              </div>

              <div className="form-group">
                <label>Hora (opcional)</label>
                <input
                  type="time"
                  value={editingTask.hora_vencimento || ''}
                  onChange={(e) =>
                    setEditingTask((prev) => ({
                      ...prev,
                      hora_vencimento: e.target.value,
                    }))
                  }
                  disabled={savingEdit}
                />
              </div>
              <div className="form-actions">
                <Button variant="secondary" type="button" onClick={() => setEditingTask(null)} disabled={savingEdit}>
                  Cancelar
                </Button>
                <Button variant="success" type="submit" disabled={savingEdit}>
                  {savingEdit ? '⏳ Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
