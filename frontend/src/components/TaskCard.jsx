import React from 'react';

/**
 * TaskCard Component - Cartão de Tarefa Reutilizável
 * 
 * Exibe uma única tarefa com:
 * - Checkbox para marcar como concluída
 * - Informações da tarefa (título, descrição)
 * - Links para caso e movimentação
 * - Data de vencimento e dias restantes
 * - Estados visual (selected, completed, overdue, today)
 * 
 * Usado em:
 * - DeadlinesPage (agrupado por urgência)
 * - MovimentacoesTab (dentro de uma movimentação)
 * - TasksTab (tarefas do processo)
 */
export default function TaskCard({
  task,
  urgency,
  selectedTaskId,
  onSelectTask,
  onToggleStatus,
  onOpenCase,
  onOpenMovement,
  isOverdue,
  isToday,
  formatDate,
  formatDaysRemaining,
}) {
  const isSelected = selectedTaskId === task.id;
  const isCompleted = task.status === 'CONCLUIDA';
  
  // Normaliza urgency para lowercase (CSS classes são minúsculas)
  const urgencyClass = urgency.toLowerCase();

  const handleSelectClick = () => {
    onSelectTask(isSelected ? null : task.id);
  };

  const handleCaseClick = (e) => {
    e.stopPropagation();
    onOpenCase(task.case);
  };

  const handleMovementClick = (e) => {
    e.stopPropagation();
    onOpenMovement(task.case, task.movimentacao, task.id);
  };

  const handleCheckboxChange = () => {
    onToggleStatus(task);
  };

  return (
    <div
      key={task.id}
      className={`task-item ${urgencyClass} ${isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
    >
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleCheckboxChange}
          className="checkbox-input"
        />
      </div>

      <div className="task-main" onClick={handleSelectClick}>
        <div className="task-title">{task.titulo}</div>
        {task.descricao && <div className="task-description">{task.descricao}</div>}

        <div className="task-process-meta">
          <a
            className="task-process-link"
            onClick={handleCaseClick}
            style={{ cursor: 'pointer' }}
          >
            {task.case_numero}
          </a>
          {task.movimentacao && (
            <>
              <span className="task-meta-dot">•</span>
              <a
                className="task-movement-link-anchor"
                onClick={handleMovementClick}
                style={{ cursor: 'pointer' }}
              >
                📋 {task.movimentacao_titulo}
              </a>
            </>
          )}
        </div>

        <div className="task-meta">
          <span
            className={`task-date ${isOverdue(task.data_vencimento) ? 'overdue-date' : ''} ${
              isToday(task.data_vencimento) ? 'today-date' : ''
            }`}
          >
            {formatDate(task.data_vencimento)}
          </span>
          <span className="task-meta-dot">•</span>
          <span
            className={`task-remaining ${isOverdue(task.data_vencimento) ? 'overdue-remaining' : ''} ${
              isToday(task.data_vencimento) ? 'today-remaining' : ''
            }`}
          >
            {formatDaysRemaining(task.data_vencimento)}
          </span>
        </div>
      </div>
    </div>
  );
}
