import { Plus, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import './TasksSection.css';

/**
 * TasksSection - Display tasks linked to a specific prazo
 * Separates automatic tasks from manual tasks
 */
function TasksSection({ 
  tasks = [],
  movimentacao = null,
  onAddTask = () => {},
  onDeleteTask = () => {},
  onToggleTaskCompleted = () => {},
}) {
  const tasksForMovimentacao = tasks.filter((task) =>
    Number(task.movimentacao) === Number(movimentacao?.id)
  );

  const automaticTasks = tasksForMovimentacao.filter((task) => Boolean(task.auto_created));
  const manualTasks = tasksForMovimentacao.filter((task) => !task.auto_created);

  return (
    <div className="tasks-section">
      <div className="tasks-section-header">
        <span className="tasks-label">📌 TAREFAS VINCULADAS</span>
      </div>

      {tasksForMovimentacao.length === 0 ? (
        <div className="no-tasks">
          <span>(nenhuma tarefa criada)</span>
        </div>
      ) : (
        <>
          {automaticTasks.length > 0 && (
            <div className="task-group">
              <div className="task-group-label">Automáticas</div>
              {automaticTasks.map((task) => (
                <div key={task.id} className={`task-row ${task.status === 'CONCLUIDA' ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.status === 'CONCLUIDA'}
                    onChange={() => onToggleTaskCompleted(task)}
                    className="task-checkbox"
                  />
                  <span className="task-title">{task.titulo}</span>
                  {task.concluida_em && (
                    <span className="task-date">
                      {formatDate(task.concluida_em)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {manualTasks.length > 0 && (
            <div className="task-group">
              <div className="task-group-label">Manuais</div>
              {manualTasks.map((task) => (
                <div key={task.id} className={`task-row ${task.status === 'CONCLUIDA' ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.status === 'CONCLUIDA'}
                    onChange={() => onToggleTaskCompleted(task)}
                    className="task-checkbox"
                  />
                  <span className="task-title">{task.titulo}</span>
                  <button
                    className="task-delete-btn"
                    onClick={() => onDeleteTask(task.id)}
                    title="Deletar tarefa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <button
        className="add-task-btn"
        onClick={() => onAddTask(movimentacao?.id)}
        title="Adicionar nova tarefa"
      >
        <Plus size={16} />
        <span>Adicionar tarefa</span>
      </button>
    </div>
  );
}

export default TasksSection;
