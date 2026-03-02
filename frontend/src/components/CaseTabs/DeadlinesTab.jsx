import { useState, useCallback, useEffect } from 'react';
import { Calendar, RefreshCw, Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import * as caseTasksService from '../../services/caseTasksService';
import DeadlineCard from './DeadlineCard';
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
  onUpdateMovement = () => {},
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

  // Filter movements with prazos
  const movementsWithPrazos = movements.filter(mov => 
    mov.prazos && mov.prazos.length > 0
  ).sort((a, b) => {
    const dateA = a.prazos[0]?.data_limite;
    const dateB = b.prazos[0]?.data_limite;
    if (!dateA || !dateB) return 0;
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
        movimentacao_id: movimentacaoId,
        case_id: caseId,
        titulo: newTaskTitle,
        auto_created: false,
      });
      
      setShowAddTaskForm(null);
      setNewTaskTitle('');
      await loadTasks();
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
      await caseTasksService.patchTask(task.id, {
        completed: !task.completed,
      });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

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
        ) : movementsWithPrazos.length === 0 ? (
          <EmptyState
            icon={Calendar}
            message="Nenhum prazo cadastrado"
            hint="Adicione prazos às movimentações para acompanhar vencimentos."
          />
        ) : (
          <div className="deadlines-container">
            {movementsWithPrazos.map(movement => (
              <DeadlineCard
                key={movement.id}
                movimentacao={movement}
                tasks={tasks}
                onTogglePrazoCompleted={handleTogglePrazoCompleted}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onToggleTaskCompleted={handleToggleTaskCompleted}
              />
            ))}

            {/* Add Task Form Modal - Simplified version */}
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
                    onKeyPress={(e) => {
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
                      onClick={() => setShowAddTaskForm(null)}
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
