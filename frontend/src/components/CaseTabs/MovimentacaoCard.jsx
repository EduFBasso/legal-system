import {
  getTipoDisplay,
  sanitizeManualDescription
} from '../../utils/movementUtils';
import { movementCardStyles } from './movementCardStyles';
import MovimentacaoEditForm from './MovimentacaoEditForm';
import MovimentacaoDisplay from './MovimentacaoDisplay';
import TasksInlineList from './TasksInlineList';

/**
 * MovimentacaoCard - Card de movimentação com modo edição e tarefas
 * 
 * Props:
 * - mov: Movimento object
 * - isTemporaryHighlighted: boolean
 * - isEditing: boolean
 * - editForm: {data, tipo, tipo_customizado, titulo, descricao, prazo}
 * - onEditFormChange: (newForm) => void
 * - onEditStart: () => void
 * - onEditCancel: () => void
 * - onEditSave: () => Promise
 * - saving: boolean
 * - tasks: Task[]
 * - addingTaskForMovement, editingTaskId, auxiliarHighlightedTaskId
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
  isEditing,
  editForm,
  onEditFormChange,
  onEditStart,
  onEditCancel,
  onEditSave,
  saving,
  // Task props
  tasks = [],
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
      className="timeline-item"
      style={{
        ...movementCardStyles.base,
        ...(isTemporaryHighlighted ? movementCardStyles.highlighted : {}),
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
            />

            {/* SEÇÃO DE TAREFAS */}
            <TasksInlineList
              tasks={tasks}
              movimentoId={mov.id}
              addingTaskForMovement={addingTaskForMovement}
              editingTaskId={editingTaskId}
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
