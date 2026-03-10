import {
  getTipoDisplay,
  sanitizeManualDescription
} from '../../utils/movementUtils';
import MovimentacaoEditForm from './MovimentacaoEditForm';
import MovimentacaoDisplay from './MovimentacaoDisplay';
import TasksInlineList from './TasksInlineList';

/**
 * MovimentacaoCard - Card de movimentação com modo edição e tarefas
 * 
 * Props:
 * - mov: Movimento object
 * - isTemporaryHighlighted: boolean
 * - isSelected: boolean
 * - isEditing: boolean
 * - editForm: {data, tipo, tipo_customizado, titulo, descricao, prazo}
 * - onEditFormChange: (newForm) => void
 * - onEditStart: () => void
 * - onEditCancel: () => void
 * - onEditSave: () => Promise
 * - onDelete: () => void
 * - saving: boolean
 * - onClick: () => void
 * - tasks: Task[]
 * - addingTaskForMovement, editingTaskId, selectedTaskId, auxiliarHighlightedTaskId
 * - newTaskForm, editTaskForm
 * - savingTask, savingEditedTask
 * - onOpenAddTask, onCancelAddTask, onSaveTask
 * - onOpenEditTask, onCancelEditTask, onSaveEditedTask
 * - onToggleTaskStatus
 * - onNewTaskFormChange, onEditTaskFormChange
 */
export default function MovimentacaoCard({
  mov,
  isTemporaryHighlighted,
  isSelected,
  isEditing,
  editForm,
  onEditFormChange,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  saving,
  onClick,
  // Task props
  tasks = [],
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
  onNewTaskFormChange,
  onEditTaskFormChange
}) {
  const tipoDisplay = getTipoDisplay(mov.tipo, mov.tipo_customizado);
  const manualDescricao = mov.origem === 'MANUAL'
    ? sanitizeManualDescription(mov.descricao, tipoDisplay, mov.tipo)
    : mov.descricao;

  return (
    <div
      id={`movimentacao-${mov.id}`}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        ...(isTemporaryHighlighted
          ? {
              background: '#eff6ff',
              border: '3px solid #3b82f6',
              boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
            }
          : isSelected
            ? {
                border: '3px solid #6b21a8',
              }
            : {}),
      }}
    >
      <div className="timeline-marker"></div>
      
      <div className="timeline-content">
        {/* MODO EDIÇÃO */}
        {isEditing && (
          <MovimentacaoEditForm
            form={editForm}
            onChange={onEditFormChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
            saving={saving}
          />
        )}
        
        {/* MODO VISUALIZAÇÃO */}
        {!isEditing && (
          <>
            <MovimentacaoDisplay
              mov={mov}
              tipoDisplay={tipoDisplay}
              manualDescricao={manualDescricao}
              onEditClick={onEditStart}
              onDeleteClick={onDelete}
            />

            {/* SEÇÃO DE TAREFAS */}
            <TasksInlineList
              tasks={tasks}
              movimentoId={mov.id}
              addingTaskForMovement={addingTaskForMovement}
              editingTaskId={editingTaskId}
              selectedTaskId={selectedTaskId}
              auxiliarHighlightedTaskId={auxiliarHighlightedTaskId}
              newTaskForm={newTaskForm}
              editTaskForm={editTaskForm}
              savingTask={savingTask}
              savingEditedTask={savingEditedTask}
              onOpenAddTask={onOpenAddTask}
              onCancelAddTask={onCancelAddTask}
              onSaveTask={onSaveTask}
              onOpenEditTask={onOpenEditTask}
              onCancelEditTask={onCancelEditTask}
              onSaveEditedTask={onSaveEditedTask}
              onToggleTaskStatus={onToggleTaskStatus}
              onNewTaskFormChange={onNewTaskFormChange}
              onEditTaskFormChange={onEditTaskFormChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
