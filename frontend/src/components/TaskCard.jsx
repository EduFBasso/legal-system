import React from 'react';
import { htmlToText } from '../utils/htmlToText';
import './TaskCard.css';

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
  onEditTask,
  onDeleteTask,
  onOpenCase,
  onOpenMovement,
  onOpenContact,
  isOverdue,
  isToday,
  formatDate,
  formatDaysRemaining,
  readOnly = false,
}) {
  const isSelected = selectedTaskId === task.id;
  const isCompleted = task.status === 'CONCLUIDA';
  const isContactTask = Boolean(task.contact && task.contact_name);
  
  // Normaliza urgency para lowercase (CSS classes são minúsculas)
  const urgencyClass = urgency.toLowerCase();

  const titleText = htmlToText(task.titulo);
  const dueTimeText = (task.hora_vencimento || '').toString().trim();
  const descriptionText = htmlToText(task.descricao);
  const movementTitleText = htmlToText(task.movimentacao_titulo);

  const handleSelectClick = () => {
    onSelectTask(isSelected ? null : task.id);
  };

  const handleCaseClick = (e) => {
    e.stopPropagation();
    if (readOnly) return;
    if (!task.case) return;
    onOpenCase(task.case);
  };

  const handleMovementClick = (e) => {
    e.stopPropagation();
    if (readOnly) return;
    if (!task.case || !task.movimentacao) return;
    onOpenMovement(task.case, task.movimentacao, task.id);
  };

  const handleContactClick = (e) => {
    e.stopPropagation();
    if (!onOpenContact) return;
    if (!task.contact) return;
    onOpenContact(task.contact);
  };

  const handleCheckboxChange = () => {
    if (readOnly) return;
    onToggleStatus(task);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (readOnly) return;
    if (!onEditTask) return;
    onEditTask(task);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (readOnly) return;
    if (!onDeleteTask) return;
    onDeleteTask(task);
  };

  return (
    <div
      key={task.id}
      className={`task-item ${urgencyClass} ${isCompleted ? 'completed' : ''} ${isSelected ? 'selected' : ''}`}
    >
      {isCompleted && (
        <div className="task-stamp task-stamp--completed" aria-label="Tarefa concluída">
          CONCLUÍDA
        </div>
      )}
      <div className="task-main" onClick={handleSelectClick}>
        {isContactTask ? (
          <div className="task-contact-meta task-contact-meta--top">
            <a className="task-contact-link" onClick={handleContactClick} style={{ cursor: 'pointer' }}>
              Contato: {task.contact_name}
            </a>

            {!readOnly && (onEditTask || onDeleteTask) ? (
              <div className="task-contact-actions">
                {onEditTask ? (
                  <button
                    type="button"
                    className="task-icon-action task-icon-action--edit"
                    onClick={handleEditClick}
                    aria-label="Editar tarefa"
                    title="Editar"
                  >
                    ✏️
                  </button>
                ) : null}
                {onDeleteTask ? (
                  <button
                    type="button"
                    className="task-icon-action task-icon-action--delete"
                    onClick={handleDeleteClick}
                    aria-label="Excluir tarefa"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="task-title-row">
          {isContactTask ? (
            <div className="task-checkbox task-checkbox--inline">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={handleCheckboxChange}
                className="checkbox-input"
                disabled={readOnly}
              />
            </div>
          ) : null}
          <div className="task-title">{titleText}{dueTimeText ? ` ${dueTimeText} hs` : ''}</div>
          {!isContactTask && !readOnly && (onEditTask || onDeleteTask) ? (
            <div className="task-actions">
              {onEditTask ? (
                <button
                  type="button"
                  className="task-action-btn task-action-btn--icon"
                  onClick={handleEditClick}
                  aria-label="Editar tarefa"
                  title="Editar"
                >
                  ✏️
                </button>
              ) : null}
              {onDeleteTask ? (
                <button
                  type="button"
                  className="task-action-btn task-action-btn--icon task-action-btn--danger"
                  onClick={handleDeleteClick}
                  aria-label="Excluir tarefa"
                  title="Excluir"
                >
                  🗑️
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {descriptionText && <div className="task-description">{descriptionText}</div>}

        {!isContactTask ? (
          <div className="task-checkbox">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={handleCheckboxChange}
              className="checkbox-input"
              disabled={readOnly}
            />
          </div>
        ) : null}

        <div className="task-process-meta">
          {task.case && task.case_numero ? (
            <a
              className="task-process-link"
              onClick={handleCaseClick}
              style={{ cursor: readOnly ? 'default' : 'pointer', pointerEvents: readOnly ? 'none' : 'auto' }}
              aria-disabled={readOnly}
            >
              {task.case_numero}
            </a>
          ) : (
            <span className="task-process-link task-process-link--empty">Sem processo</span>
          )}
          {movementTitleText && (
            <>
              <span className="task-meta-dot">•</span>
              <a
                className="task-movement-link-anchor"
                onClick={handleMovementClick}
                style={{ cursor: readOnly ? 'default' : 'pointer', pointerEvents: readOnly ? 'none' : 'auto' }}
                aria-disabled={readOnly}
              >
                {/^\s*📋/u.test(movementTitleText) ? movementTitleText : `📋 ${movementTitleText}`}
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
