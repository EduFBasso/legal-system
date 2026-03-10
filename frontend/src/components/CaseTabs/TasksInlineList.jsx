import { Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { getDaysToDueDate, calculateUrgency } from '../../utils/movementUtils';
import TaskForm from './TaskForm';

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
    <div
      style={{
        marginTop: '1rem',
        borderTop: '1px solid #ddd6fe',
        paddingTop: '0.85rem',
      }}
    >
      <div
        style={{
          border: '1px solid #ddd6fe',
          borderLeft: '4px solid #7c3aed',
          borderRadius: '10px',
          background: '#fcfaff',
          padding: '0.7rem',
        }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5b21b6' }}>TAREFAS VINCULADAS</span>
        {!isCreating && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddTask(movimentoId);
            }}
            style={{
              border: '1px solid #6b21a8',
              background: '#fff',
              color: '#6b21a8',
              borderRadius: '6px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Add Task
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
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.84rem' }}>Nenhuma tarefa para esta movimentacao.</p>
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
            style={{
              border: isHighlighted ? '2px solid #3b82f6' : isSelected ? '2px solid #6b21a8' : '1px solid #ddd6fe',
              borderRadius: '8px',
              padding: '0.65rem',
              marginBottom: '0.5rem',
              background: isDone ? '#f9fafb' : '#fff',
            }}
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
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: isDone ? '#6b7280' : '#111827' }}>
                      {task.titulo}
                    </div>

                    {task.descricao && (
                      <div style={{ marginTop: '0.15rem', fontSize: '0.82rem', color: '#4b5563' }}>
                        {task.descricao}
                      </div>
                    )}

                    <div style={{ marginTop: '0.35rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {task.data_vencimento ? (
                        <>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '999px',
                              background: '#eef2ff',
                              color: '#3730a3',
                              fontWeight: 600,
                            }}
                          >
                            Vence: {formatDate(task.data_vencimento)}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '999px',
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
                            fontSize: '0.72rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '999px',
                            background: '#f3f4f6',
                            color: '#374151',
                            fontWeight: 600,
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
                    style={{
                      border: '1px solid #6b21a8',
                      background: '#fff',
                      color: '#6b21a8',
                      borderRadius: '6px',
                      padding: '0.2rem 0.55rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
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
