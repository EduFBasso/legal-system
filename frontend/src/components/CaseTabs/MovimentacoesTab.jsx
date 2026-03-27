import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { notifyTaskUpdate } from '../../services/taskSyncService';
import useSyncTaskUpdates from '../../hooks/useSyncTaskUpdates';
import EmptyState from '../common/EmptyState';
import { Button } from '../common/Button';
import caseTasksService from '../../services/caseTasksService';
import caseMovementsService from '../../services/caseMovementsService';
import MovimentacaoCard from './MovimentacaoCard';
import MovimentacaoEditForm from './MovimentacaoEditForm';

import './MovimentacoesTab.css';

const HIGHLIGHT_DURATION_MS = 3000;
const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

/**
 * MovimentacoesTab - Aba de Movimentações Processuais
 * Exibe lista de movimentações (publicações DJE, despachos, decisões)
 * 
 * 2-Phase Highlight System:
 * - Fase 1 (0-5s): movimento + tarefa com destaque azul
 * - Fase 2 (5s+): apenas tarefa mantém destaque permanente
 */
function MovimentacoesTab({ 
  id,
  movimentacoes = [],
  highlightedMovimentacaoId = null,
  highlightedTaskId = null,
  numeroProcesso = '',
  tasks = [],
  onRefreshTasks = () => {},
  onRefreshMovements = () => {},
  onMentionProcess = null,
  excludeCnj = null,
  readOnly = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Movimentação - Estados
  const [editingMovimentacaoId, setEditingMovimentacaoId] = useState(null);
  const [temporaryHighlightedMovimentacaoId, setTemporaryHighlightedMovimentacaoId] = useState(null);
  const [editMovimentacaoForm, setEditMovimentacaoForm] = useState({
    data: '',
    tipo: '',
    tipo_customizado: '',
    titulo: '',
    descricao: '',
    prazo: '',
  });
  const [savingMovimentacao, setSavingMovimentacao] = useState(false);
  const [creatingMovimentacao, setCreatingMovimentacao] = useState(false);
  const [newMovimentacaoForm, setNewMovimentacaoForm] = useState({
    data: getTodayIsoDate(),
    tipo: 'DESPACHO',
    tipo_customizado: '',
    titulo: '',
    descricao: '',
    prazo: '',
  });

  // Tarefa - Estados
  const [addingTaskForMovement, setAddingTaskForMovement] = useState(null);
  const [newTaskForm, setNewTaskForm] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: '',
  });
  const [savingTask, setSavingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskForm, setEditTaskForm] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: '',
  });
  const [savingEditedTask, setSavingEditedTask] = useState(false);
  const [auxiliarHighlightedTaskId, setAuxiliarHighlightedTaskId] = useState(null);

  // ========== HANDLERS MOVIMENTAÇÃO ==========
  const handleOpenEditMovimentacao = (mov) => {
    if (readOnly) return;
    setEditingMovimentacaoId(mov.id);
    setEditMovimentacaoForm({
      data: mov.data,
      tipo: mov.tipo || '',
      tipo_customizado: mov.tipo_customizado || '',
      titulo: mov.titulo || '',
      descricao: mov.descricao || '',
      prazo: mov.prazo || '',
    });
  };

  const handleCancelEditMovimentacao = () => {
    setEditingMovimentacaoId(null);
    setEditMovimentacaoForm({
      data: '',
      tipo: '',
      tipo_customizado: '',
      titulo: '',
      descricao: '',
      prazo: '',
    });
  };

  const handleSaveMovimentacao = async (movId) => {
    if (readOnly) return;
    if (!editMovimentacaoForm.titulo.trim()) {
      alert('Título é obrigatório');
      return;
    }

    setSavingMovimentacao(true);
    try {
      await caseMovementsService.updateMovement(movId, {
        case: parseInt(id),
        data: editMovimentacaoForm.data,
        tipo: editMovimentacaoForm.tipo,
        tipo_customizado: editMovimentacaoForm.tipo_customizado || '',
        titulo: editMovimentacaoForm.titulo,
        descricao: editMovimentacaoForm.descricao || '',
        prazo: editMovimentacaoForm.prazo ? parseInt(editMovimentacaoForm.prazo) : null,
      });
      
      await Promise.all([onRefreshTasks(), onRefreshMovements()]);
      handleCancelEditMovimentacao();
    } catch (error) {
      console.error('Error saving movimentacao:', error);
      alert('Erro ao salvar movimentação');
    } finally {
      setSavingMovimentacao(false);
    }
  };

  const handleOpenCreateMovimentacao = () => {
    if (readOnly) return;
    if (!id) {
      alert('Salve o processo antes de adicionar movimentações.');
      return;
    }

    setEditingMovimentacaoId(null);
    setCreatingMovimentacao(true);
    setNewMovimentacaoForm({
      data: getTodayIsoDate(),
      tipo: 'DESPACHO',
      tipo_customizado: '',
      titulo: '',
      descricao: '',
      prazo: '',
    });
  };

  const handleCancelCreateMovimentacao = () => {
    setCreatingMovimentacao(false);
    setNewMovimentacaoForm({
      data: getTodayIsoDate(),
      tipo: 'DESPACHO',
      tipo_customizado: '',
      titulo: '',
      descricao: '',
      prazo: '',
    });
  };

  const handleSaveNewMovimentacao = async () => {
    if (readOnly) return;
    if (!newMovimentacaoForm.titulo.trim()) {
      alert('Título é obrigatório');
      return;
    }

    setSavingMovimentacao(true);
    try {
      await caseMovementsService.createMovement({
        case: parseInt(id, 10),
        data: newMovimentacaoForm.data,
        tipo: newMovimentacaoForm.tipo,
        tipo_customizado: newMovimentacaoForm.tipo_customizado || '',
        titulo: newMovimentacaoForm.titulo,
        descricao: newMovimentacaoForm.descricao || '',
        prazo: newMovimentacaoForm.prazo ? parseInt(newMovimentacaoForm.prazo, 10) : null,
        origem: 'MANUAL',
      });

      await Promise.all([onRefreshTasks(), onRefreshMovements()]);
      handleCancelCreateMovimentacao();
    } catch (error) {
      console.error('Error creating movimentacao:', error);
      alert(`Erro ao criar movimentação:\n${error.message || error}`);
    } finally {
      setSavingMovimentacao(false);
    }
  };

  // ========== HANDLERS TAREFAS ==========
  const handleOpenAddTask = (movementId) => {
    if (readOnly) return;
    setEditingTaskId(null);
    setAddingTaskForMovement(movementId);
    setNewTaskForm({
      titulo: '',
      descricao: '',
      data_vencimento: '',
    });
  };

  const handleCancelAddTask = () => {
    setAddingTaskForMovement(null);
    setNewTaskForm({
      titulo: '',
      descricao: '',
      data_vencimento: '',
    });
  };

  const handleSaveTask = async (movementId, formData = newTaskForm) => {
    if (readOnly) return;
    if (!formData.titulo.trim()) {
      alert('Título da tarefa é obrigatório');
      return;
    }

    setSavingTask(true);
    try {
      const response = await caseTasksService.createTask({
        case: id,
        movimentacao: movementId,
        titulo: formData.titulo,
        descricao: formData.descricao || '',
        data_vencimento: formData.data_vencimento || null,
        status: 'PENDENTE',
      });
      
      await onRefreshTasks();
      handleCancelAddTask();
      
      notifyTaskUpdate({
        type: 'task-updated',
        action: 'created',
        taskId: response?.id,
        caseId: id,
        titulo: formData.titulo,
        data_vencimento: formData.data_vencimento,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Erro ao salvar tarefa');
    } finally {
      setSavingTask(false);
    }
  };

  const handleOpenEditTask = (task) => {
    if (readOnly) return;
    setAddingTaskForMovement(null);
    setEditingTaskId(task.id);
    setEditTaskForm({
      titulo: task.titulo || '',
      descricao: task.descricao || '',
      data_vencimento: task.data_vencimento || '',
    });
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskForm({
      titulo: '',
      descricao: '',
      data_vencimento: '',
    });
  };

  const handleSaveEditedTask = async (taskId, formData = editTaskForm) => {
    if (readOnly) return;
    if (!formData.titulo.trim()) {
      alert('Título da tarefa é obrigatório');
      return;
    }

    setSavingEditedTask(true);
    try {
      await caseTasksService.patchTask(taskId, {
        titulo: formData.titulo,
        descricao: formData.descricao || '',
        data_vencimento: formData.data_vencimento || null,
      });
      await onRefreshTasks();
      handleCancelEditTask();
      
      notifyTaskUpdate({
        type: 'task-updated',
        action: 'edited',
        taskId: taskId,
        caseId: id,
        titulo: formData.titulo,
        data_vencimento: formData.data_vencimento,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error editing task:', error);
      alert('Erro ao editar tarefa');
    } finally {
      setSavingEditedTask(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    if (readOnly) return;
    try {
      const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
      await caseTasksService.patchTask(task.id, { status: nextStatus });
      await onRefreshTasks();
      
      notifyTaskUpdate({
        type: 'task-updated',
        action: 'status-changed',
        taskId: task.id,
        caseId: id,
        newStatus: nextStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling task status:', error);
      alert('Erro ao atualizar status da tarefa');
    }
  };

  const handleDeleteTask = async (task) => {
    if (readOnly) return;
    if (!task?.id) return;

    const ok = window.confirm('Excluir esta tarefa?');
    if (!ok) return;

    try {
      await caseTasksService.deleteTask(task.id);
      await onRefreshTasks();

      notifyTaskUpdate({
        type: 'task-updated',
        action: 'deleted',
        taskId: task.id,
        caseId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Erro ao excluir tarefa');
    }
  };

  // ========== EFFECTS ==========
  const filteredMovimentacoes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return movimentacoes;

    return movimentacoes.filter((mov) => {
      const searchableText = [
        mov.titulo,
        mov.descricao,
        mov.tipo,
        mov.tipo_display,
        mov.origem,
        mov.origem_display,
        mov.data,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [movimentacoes, searchTerm]);

  // Highlight movimento (com clear após duração)
  useEffect(() => {
    if (!highlightedMovimentacaoId) return;

    setTemporaryHighlightedMovimentacaoId(highlightedMovimentacaoId);

    const scrollTimeout = setTimeout(() => {
      const element = document.getElementById(`movimentacao-${highlightedMovimentacaoId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    const clearHighlightTimeout = setTimeout(() => {
      setTemporaryHighlightedMovimentacaoId((currentId) =>
        currentId === highlightedMovimentacaoId ? null : currentId
      );
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(clearHighlightTimeout);
    };
  }, [highlightedMovimentacaoId, filteredMovimentacoes]);

  useEffect(() => {
    if (!readOnly) return;

    setEditingMovimentacaoId(null);
    setCreatingMovimentacao(false);
    setAddingTaskForMovement(null);
    setEditingTaskId(null);
  }, [readOnly]);

  // Highlight tarefa
  useEffect(() => {
    if (!highlightedTaskId) return;

    setAuxiliarHighlightedTaskId(highlightedTaskId);

    const scrollTimeout = setTimeout(() => {
      const element = document.getElementById(`task-${highlightedTaskId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    return () => {
      clearTimeout(scrollTimeout);
    };
  }, [highlightedTaskId]);

  // Sincronizar com outras abas
  useSyncTaskUpdates({
    onTaskUpdate: () => {
      Promise.all([onRefreshTasks(), onRefreshMovements()]);
    },
  });

  // ========== RENDER ==========
  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">⚖️ Movimentações Processuais{numeroProcesso && ` - ${numeroProcesso}`}</h2>
            <p className="section-subtitle">Publicações do DJE, despachos, decisões e movimentações do tribunal</p>
          </div>
          {id && (
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                if (readOnly) return;
                handleOpenCreateMovimentacao();
              }}
              disabled={readOnly}
              aria-disabled={readOnly ? 'true' : undefined}
            >
              <Plus size={18} /> Nova Movimentação
            </Button>
          )}
        </div>
        
        {movimentacoes.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar movimentações por título, descrição, tipo, origem ou data..."
              className="financeiro-input"
              style={{ width: '100%' }}
            />
          </div>
        )}

        {creatingMovimentacao && (
          <MovimentacaoEditForm
            form={newMovimentacaoForm}
            onChange={setNewMovimentacaoForm}
            onSave={handleSaveNewMovimentacao}
            onCancel={handleCancelCreateMovimentacao}
            saving={savingMovimentacao}
          />
        )}

        {movimentacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhuma movimentação cadastrada"
            hint="Clique em 'Nova Movimentação' para adicionar despachos, decisões, audiências, etc."
          />
        ) : filteredMovimentacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhuma movimentação encontrada"
            hint="Tente ajustar o texto de busca"
          />
        ) : (
          <div className="movimentacoes-timeline">
            {filteredMovimentacoes.map(mov => (
              <MovimentacaoCard
                key={mov.id}
                mov={mov}
                isTemporaryHighlighted={temporaryHighlightedMovimentacaoId === mov.id}
                isEditing={editingMovimentacaoId === mov.id}
                editForm={editMovimentacaoForm}
                onEditFormChange={setEditMovimentacaoForm}
                onEditStart={() => handleOpenEditMovimentacao(mov)}
                onEditCancel={handleCancelEditMovimentacao}
                onEditSave={() => handleSaveMovimentacao(mov.id)}
                saving={savingMovimentacao}
                onMentionProcess={onMentionProcess}
                excludeCnj={excludeCnj}
                readOnly={readOnly}
                // Task props
                tasks={tasks}
                addingTaskForMovement={addingTaskForMovement}
                editingTaskId={editingTaskId}
                auxiliarHighlightedTaskId={auxiliarHighlightedTaskId}
                newTaskForm={newTaskForm}
                editTaskForm={editTaskForm}
                savingTask={savingTask}
                savingEditedTask={savingEditedTask}
                onOpenAddTask={handleOpenAddTask}
                onCancelAddTask={handleCancelAddTask}
                onSaveTask={handleSaveTask}
                onOpenEditTask={handleOpenEditTask}
                onCancelEditTask={handleCancelEditTask}
                onSaveEditedTask={handleSaveEditedTask}
                onToggleTaskStatus={handleToggleTaskStatus}
                onDeleteTask={handleDeleteTask}
                onNewTaskFormChange={setNewTaskForm}
                onEditTaskFormChange={setEditTaskForm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovimentacoesTab;
