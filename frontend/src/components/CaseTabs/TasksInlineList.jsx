import { Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { getDaysToDueDate, calculateUrgency } from '../../utils/movementUtils';
import TaskForm from './TaskForm';
import { tasksInlineStyles, getTaskCardStyle } from './movementCardStyles';

const urgencyStyle = {
  URGENTISSIMO: { background: '#fee2e2', color: '#991b1b', label: 'Urgentissimo' },
  URGENTE: { background: '#fef3c7', color: '#92400e', label: 'Urgente' },
  NORMAL: { background: '#dcfce7', color: '#166534', label: 'Normal' },
};

export default function TasksInlineList({
  tasks,
  movimentoId,
  addingTaskForMovement,
  editingTaskId,
  selectedTaskId,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={tasksInlineStyles.sectionTitle}>TAREFAS VINCULADAS</span>
          <span
            style={{
              background: '#16a34a',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '999px',
              padding: '0.15rem 0.5rem',
              minWidth: '1.5rem',
              textAlign: 'center',
            }}
          >
            TODAS <strong>({taskList.length})</strong>
          </span>
        </div>
        {!isCreating && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddTask(movimentoId);
            }}
            style={tasksInlineStyles.addButton}
          >
            <Plus size={16} /> Add Task
          </button>
        )}
      </div>

      {isCreating && (
        <div onClick={(e) => e.stopPropagation()}>
          <TaskForm
            initialData={newTaskForm}
            onSave={() => onSaveTask(movimentoId)}
            onCancel={onCancelAddTask}
            isLoading={savingTask}
            submitLabel="Criar tarefa"
          />
        </div>
      )}

      {taskList.length === 0 && !isCreating && (
        <p style={tasksInlineStyles.emptyText}>Nenhuma tarefa para esta movimentacao.</p>
      )}

      {taskList.map((task) => {
        const isEditing = editingTaskId === task.id;
        const isDone = task.status === 'CONCLUIDA';
        const isSelected = selectedTaskId === task.id;
        const isHighlighted = auxiliarHighlightedTaskId === task.id;
        const daysRemaining = getDaysToDueDate(task.data_vencimento);
        const urgency = calculateUrgency(task.data_vencimento);
        const urgencyMeta = urgencyStyle[urgency] || urgencyStyle.NORMAL;

        return (
          <div
            id={`task-${task.id}`}
            key={task.id}
            onClick={(e) => e.stopPropagation()}
            style={getTaskCardStyle({ isHighlighted, isSelected, isDone })}
          >
            {isEditing ? (
              <TaskForm
                initialData={editTaskForm}
                onSave={() => onSaveEditedTask(task.id)}
                onCancel={onCancelEditTask}
                isLoading={savingEditedTask}
                submitLabel="Salvar tarefa"
              />
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => onToggleTaskStatus(task)}
                    style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ ...tasksInlineStyles.taskTitle, color: isDone ? '#6b7280' : '#111827' }}>
                      {task.titulo}
                    </div>

                    {task.descricao && (
                      <div style={tasksInlineStyles.taskDescription}>
                        {task.descricao}
                      </div>
                    )}

                    <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {task.data_vencimento ? (
                        <>
                          <span
                            style={{
                              ...tasksInlineStyles.metaBadge,
                              ...tasksInlineStyles.dueDateBadge,
                            }}
                          >
                            Vence: {formatDate(task.data_vencimento)}
                          </span>
                          <span
                            style={{
                              ...tasksInlineStyles.metaBadge,
                              background: urgencyMeta.background,
                              color: urgencyMeta.color,
                              fontWeight: 700,
                            }}
                          >
                            {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d atrasada` : `${daysRemaining}d restantes`} - {urgencyMeta.label}
                          </span>
                        </>
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
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.45rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onOpenEditTask(task)}
                    style={tasksInlineStyles.editTaskButton}
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
