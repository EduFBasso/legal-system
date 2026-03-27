import { Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { calculateUrgency } from '../../utils/movementUtils';
import { formatDaysRemaining } from '../../utils/taskUrgency';
import { htmlToText } from '../../utils/htmlToText';
import TaskForm from './TaskForm';
import { tasksInlineStyles, getTaskCardStyle } from './movementCardStyles';
import { caseTheme, getUrgencyStyle, getUrgencyButtonStyle, getButtonHoverHandlers } from './caseTheme';
import { Button } from '../common/Button';
import { notifyTaskUpdate } from '../../services/taskSyncService';
import caseTasksService from '../../services/caseTasksService';
import './TasksInlineList.css';

export default function TasksInlineList({
  tasks,
  movimentoId,
  addingTaskForMovement,
  editingTaskId,
  auxiliarHighlightedTaskId,
  newTaskForm,
  editTaskForm,
  savingTask,
  savingEditedTask,
  onOpenAddTask,
  onCancelAddTask,
  onSaveTask,
  onOpenEditTask,
  onCancelEditTask,
  onSaveEditedTask,
  onToggleTaskStatus,
  onRefreshTasks,
  caseId,
  readOnly = false,
}) {
  const taskList = (tasks || []).filter((task) => Number(task.movimentacao) === Number(movimentoId));
  const isCreating = addingTaskForMovement === movimentoId;

  return (
    <div style={tasksInlineStyles.wrapper}>
      <div style={tasksInlineStyles.innerContainer}>
      <div style={tasksInlineStyles.titleRow}>
        <span style={tasksInlineStyles.sectionTitle}>Tarefas vinculadas a esta movimentação</span>
        {!isCreating && (
          <Button
            variant="success"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (readOnly) return;
              onOpenAddTask(movimentoId);
            }}
            disabled={readOnly}
            aria-disabled={readOnly ? 'true' : undefined}
          >
            <Plus size={16} /> Nova Tarefa
          </Button>
        )}
      </div>

      {isCreating && (
        <div onClick={(e) => e.stopPropagation()}>
          <TaskForm
            initialData={newTaskForm}
            onSave={(formData) => onSaveTask(movimentoId, formData)}
            onCancel={onCancelAddTask}
            isLoading={savingTask}
            submitLabel="Criar tarefa"
          />
        </div>
      )}

      {taskList.length === 0 && !isCreating && (
        <p style={tasksInlineStyles.emptyText}>Nenhuma tarefa vinculada a esta movimentação.</p>
      )}

      {taskList.map((task) => {
        const isEditing = editingTaskId === task.id;
        const isDone = task.status === 'CONCLUIDA';
        const isHighlighted = auxiliarHighlightedTaskId === task.id;
        const urgency = calculateUrgency(task.data_vencimento);
        const urgencyMeta = getUrgencyStyle(urgency);
        const taskToneColor = task.data_vencimento ? urgencyMeta.color : caseTheme.darkText;
        const urgencyButtonStyle = getUrgencyButtonStyle(urgency);
        const editButtonBaseColor = task.data_vencimento ? urgencyButtonStyle.base : caseTheme.button.primary;
        const editButtonHoverColor = task.data_vencimento ? urgencyButtonStyle.hover : caseTheme.button.primaryDark;
        const editButtonShadow = task.data_vencimento ? urgencyButtonStyle.shadow : '0 2px 8px rgba(22, 101, 52, 0.3)';
        const editTaskButtonInteractions = getButtonHoverHandlers({
          base: editButtonBaseColor,
          hover: editButtonHoverColor,
          shadow: editButtonShadow,
        });

        return (
          <div
            id={`task-${task.id}`}
            key={task.id}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...getTaskCardStyle({ isHighlighted, isSelected: false, isDone }),
              ...(!isDone && task.data_vencimento
                ? {
                    background: urgencyMeta.background,
                    border: `1px solid ${urgencyMeta.color}`,
                  }
                : {}),
            }}
          >
            {isEditing ? (
              <TaskForm
                initialData={editTaskForm}
                onSave={(formData) => onSaveEditedTask(task.id, formData)}
                onCancel={onCancelEditTask}
                isLoading={savingEditedTask}
                submitLabel="Salvar tarefa"
              />
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <input
                    className={`movement-task-checkbox movement-task-checkbox--${urgency.toLowerCase()}`}
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {
                      if (readOnly) return;
                      onToggleTaskStatus(task);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={readOnly}
                    aria-disabled={readOnly ? 'true' : undefined}
                    style={{
                      marginTop: '0.2rem',
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ ...tasksInlineStyles.taskTitle, color: isDone ? '#9ca3af' : taskToneColor }}>
                      {htmlToText(task.titulo)}
                    </div>

                    {task.descricao && (
                      <div style={{ ...tasksInlineStyles.taskDescription, color: isDone ? '#9ca3af' : taskToneColor }}>
                        {htmlToText(task.descricao)}
                      </div>
                    )}

                  </div>
                </div>

                <div style={{ marginTop: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 2 }}>
                  {task.data_vencimento ? (
                    <span
                      style={{
                        ...tasksInlineStyles.metaBadge,
                        background: urgencyMeta.background,
                        color: urgencyMeta.color,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{formatDate(task.data_vencimento)}</span>
                      <span style={{ opacity: 0.8 }}>•</span>
                      <span>{formatDaysRemaining(task.data_vencimento)}</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        ...tasksInlineStyles.metaBadge,
                        ...tasksInlineStyles.noDueDateBadge,
                      }}
                    >
                      Sem vencimento
                    </span>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', position: 'relative', zIndex: 3 }}>
                    <button
                      type="button"
                      className="task-action-btn task-action-btn--icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (readOnly) return;
                        onOpenEditTask(task);
                      }}
                      title="Editar"
                      disabled={readOnly}
                      aria-disabled={readOnly ? 'true' : undefined}
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      className="task-action-btn task-action-btn--icon task-action-btn--danger"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (readOnly) return;
                        if (!task?.id) return;
                        const ok = window.confirm('Excluir esta tarefa?');
                        if (!ok) return;
                        try {
                          await caseTasksService.deleteTask(task.id);
                          await Promise.resolve(onRefreshTasks?.());

                          notifyTaskUpdate({
                            type: 'task-updated',
                            action: 'deleted',
                            taskId: task.id,
                            caseId: caseId,
                            timestamp: new Date().toISOString(),
                          });
                        } catch (error) {
                          console.error('Error deleting task:', error);
                          alert('Erro ao excluir tarefa');
                        }
                      }}
                      title="Excluir"
                      disabled={readOnly}
                      aria-disabled={readOnly ? 'true' : undefined}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
