import React from 'react';
import TaskCard from './TaskCard';

/**
 * UrgencySection Component - Seção de Tarefas por Urgência
 * 
 * Renderiza todas as tarefas de uma urgência específica (URGENTISSIMO, URGENTE, NORMAL)
 * Reutiliza TaskCard para cada tarefa individual.
 * 
 * Props:
 * - urgency: string (URGENTISSIMO, URGENTE, NORMAL) - usado para CSS classes
 * - tasks: Array - tarefas a renderizar nesta seção
 * - sectionClassName: string - classe customizada para a seção
 * - selectedTaskId: number - ID da tarefa selecionada
 * - onSelectTask: function - handler para selecionar tarefa
 * - onToggleStatus: function - handler para marcar concluída
 * - onOpenCase: function - handler para abrir case
 * - onOpenMovement: function - handler para abrir movimentação
 * - isOverdue: function - utility para verificar atraso
 * - isToday: function - utility para verificar se é hoje
 * - formatDate: function - utility para formatar data
 * - formatDaysRemaining: function - utility para formatar dias restantes
 * - showBorder: boolean - mostra border container quando todos urgências estão visíveis
 */
export default function UrgencySection({
  urgency,
  tasks,
  sectionClassName,
  selectedTaskId,
  onSelectTask,
  onToggleStatus,
  onOpenCase,
  onOpenMovement,
  onOpenContact,
  isOverdue,
  isToday,
  formatDate,
  formatDaysRemaining,
  showBorder,
  readOnly = false,
}) {
  return (
    <div className={`urgency-section ${showBorder ? sectionClassName : ''}`}>
      <div className="tasks-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            urgency={urgency}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onToggleStatus={onToggleStatus}
            onOpenCase={onOpenCase}
            onOpenMovement={onOpenMovement}
            onOpenContact={onOpenContact}
            isOverdue={isOverdue}
            isToday={isToday}
            formatDate={formatDate}
            formatDaysRemaining={formatDaysRemaining}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}
