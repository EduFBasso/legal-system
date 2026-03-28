import { useState, useCallback, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import * as caseTasksService from '../../services/caseTasksService';
import { validateDueDateAtLeastTomorrow } from '../../utils/taskDueDateValidation';
import DeadlineCard from './DeadlineCard';
import TasksSection from './TasksSection';
import EmptyState from '../common/EmptyState';
import './DeadlinesTab.css';

/**
 * DeadlinesTab - Tab for managing deadlines (prazos) and linked tasks
 * Displays movements with their nested deadlines (prazos) and linked tasks
 * Structure: Movimentação → Prazos → Tarefas (Automáticas + Manuais)
 */
function DeadlinesTab({ 
  movements = [],
  loadingMovements = false,
  caseId = null,
  numeroProcesso = '',
  highlightedMovimentacaoId = null,
  autoOpenTaskForMovimentacaoId = null,
  onClearAutoOpenTask = () => {},
}) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Load tasks on component mount
  const loadTasks = useCallback(async () => {
    if (!caseId) return;
    setLoadingTasks(true);
    try {
      const data = await caseTasksService.getTasksByCase(caseId);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  }, [caseId]);

  // Initial load
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const movementHasTasks = useCallback((movementId) => {
    return tasks.some((task) => Number(task.movimentacao) === Number(movementId));
  }, [tasks]);

  const movementsForDeadlinesTab = movements
    .filter((mov) => {
      const hasPrazo = Boolean(mov.prazos && mov.prazos.length > 0);
      const hasTask = movementHasTasks(mov.id);
      const isHighlighted = Number(highlightedMovimentacaoId) === Number(mov.id);
      const isAutoOpen = Number(autoOpenTaskForMovimentacaoId) === Number(mov.id);
      return hasPrazo || hasTask || isHighlighted || isAutoOpen;
    })
    .sort((a, b) => {
      const firstPrazoA = a.prazos?.[0]?.data_limite;
      const firstPrazoB = b.prazos?.[0]?.data_limite;
      const dateA = firstPrazoA || a.data;
      const dateB = firstPrazoB || b.data;
      return new Date(dateA) - new Date(dateB);
    });

  const handleTogglePrazoCompleted = async (prazo) => {
    try {
      // Update via dedicated CasePrazo endpoint
      const response = await fetch(`/api/case-prazos/${prazo.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.content,
        },
        body: JSON.stringify({ completed: !prazo.completed }),
      });
      
      if (!response.ok) throw new Error('Failed to update prazo');
      
      // Reload movements to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating prazo:', error);
    }
  };

  const handleAddTask = (movimentacaoId) => {
    setShowAddTaskForm(movimentacaoId);
    setNewTaskTitle('');
  };

  const handleSaveTask = async (movimentacaoId) => {
    if (!newTaskTitle.trim()) return;

    try {
      await caseTasksService.createTask({
        case: Number(caseId),
        movimentacao: Number(movimentacaoId),
        titulo: newTaskTitle.trim(),
        descricao: '',
        urgencia: 'NORMAL',
        status: 'PENDENTE',
      });

      setShowAddTaskForm(null);
      setNewTaskTitle('');
      await loadTasks();
      onClearAutoOpenTask();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;
    
    try {
      await caseTasksService.deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleTaskCompleted = async (task) => {
    try {
      // Mantém regra de vencimento (>= amanhã) quando aplicável.
      const validation = validateDueDateAtLeastTomorrow(task?.data_vencimento || '');
      if (!validation?.isValid) {
        alert(validation?.message || 'Data de vencimento inválida');
        return;
      }
      await caseTasksService.patchTask(task.id, {
        status: task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA',
      });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  useEffect(() => {
    if (!autoOpenTaskForMovimentacaoId) return;
    setShowAddTaskForm(Number(autoOpenTaskForMovimentacaoId));
  }, [autoOpenTaskForMovimentacaoId]);

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">📅 PRAZOS{numeroProcesso && ` - ${numeroProcesso}`}</h2>
            <p className="section-subtitle">Gestão de prazos processuais e tarefas vinculadas</p>
          </div>
        </div>

        {loadingMovements || loadingTasks ? (
          <div className="loading-container">
            <RefreshCw className="spinning" size={32} />
            <p>Carregando dados...</p>
          </div>
        ) : movementsForDeadlinesTab.length === 0 ? (
          <EmptyState
            icon={Calendar}
            message="Nenhum prazo ou tarefa vinculada"
            hint="Adicione prazo nas movimentações ou crie tarefa vinculada à movimentação."
          />
        ) : (
          <div className="deadlines-container">
            {movementsForDeadlinesTab.map((movement) => {
              const hasPrazos = Boolean(movement.prazos && movement.prazos.length > 0);
              const isHighlighted = Number(highlightedMovimentacaoId) === Number(movement.id);

              if (hasPrazos) {
                return (
                  <div
                    key={movement.id}
                    className={isHighlighted ? 'deadline-highlight' : ''}
                  >
                    <DeadlineCard
                      movimentacao={movement}
                      tasks={tasks}
                      onTogglePrazoCompleted={handleTogglePrazoCompleted}
                      onAddTask={handleAddTask}
                      onDeleteTask={handleDeleteTask}
                      onToggleTaskCompleted={handleToggleTaskCompleted}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={movement.id}
                  className={`deadline-card ${isHighlighted ? 'deadline-highlight' : ''}`}
                >
                  <div className="movement-header">
                    <div className="movement-date">📅 {formatDate(movement.data)}</div>
                    <div className="movement-orgao">🏛️ {movement.orgao || 'Órgão não informado'}</div>
                  </div>
                  <div className="no-deadline-message">Sem prazo cadastrado para esta movimentação.</div>
                  <TasksSection
                    tasks={tasks}
                    movimentacao={movement}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onToggleTaskCompleted={handleToggleTaskCompleted}
                  />
                </div>
              );
            })}

            {showAddTaskForm && (
              <div className="add-task-modal">
                <div className="modal-content">
                  <h3>Adicionar Nova Tarefa</h3>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Descreva a tarefa..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTask(showAddTaskForm);
                      }
                    }}
                  />
                  <div className="modal-buttons">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSaveTask(showAddTaskForm)}
                    >
                      Salvar
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddTaskForm(null);
                        onClearAutoOpenTask();
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeadlinesTab;
