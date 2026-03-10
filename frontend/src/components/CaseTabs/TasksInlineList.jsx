import { Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { calculateUrgency } from '../../utils/movementUtils';
import TaskForm from './TaskForm';
import { tasksInlineStyles, getTaskCardStyle } from './movementCardStyles';
import { caseTheme, getUrgencyStyle, getUrgencyButtonStyle } from './caseTheme';
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
}) {
  const taskList = (tasks || []).filter((task) => Number(task.movimentacao) === Number(movimentoId));
  const isCreating = addingTaskForMovement === movimentoId;

  return (
    <div style={tasksInlineStyles.wrapper}>
      <div style={tasksInlineStyles.innerContainer}>
      <div style={tasksInlineStyles.titleRow}>
        <span style={tasksInlineStyles.sectionTitle}>Tarefas vinculadas a esta movimentacao</span>
        {!isCreating && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddTask(movimentoId);
            }}
            style={tasksInlineStyles.addButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = caseTheme.button.primaryDark;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 101, 52, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = caseTheme.button.primary;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Plus size={16} /> Nova Tarefa
          </button>
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
        <p style={tasksInlineStyles.emptyText}>Nenhuma tarefa vinculada a esta movimentacao.</p>
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
                    onChange={() => onToggleTaskStatus(task)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      marginTop: '0.2rem',
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ ...tasksInlineStyles.taskTitle, color: isDone ? '#9ca3af' : taskToneColor }}>
                      {task.titulo}
                    </div>

                    {task.descricao && (
                      <div style={{ ...tasksInlineStyles.taskDescription, color: isDone ? '#9ca3af' : taskToneColor }}>
                        {task.descricao}
                      </div>
                    )}

                  </div>
                </div>

                <div style={{ marginTop: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  {task.data_vencimento ? (
                    <span
                      style={{
                        ...tasksInlineStyles.metaBadge,
                        background: urgencyMeta.background,
                        color: urgencyMeta.color,
                        fontWeight: 700,
                      }}
                    >
                      Vence: {formatDate(task.data_vencimento)}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditTask(task);
                    }}
                    style={{
                      ...tasksInlineStyles.editTaskButton,
                      background: editButtonBaseColor,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = editButtonHoverColor;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = editButtonShadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = editButtonBaseColor;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Editar
                  </button>
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
