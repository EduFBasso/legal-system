import { useState, useEffect, useCallback, useRef } from 'react';
import caseMovementsService from '../services/caseMovementsService';
import caseTasksService from '../services/caseTasksService';
import publicationsService from '../services/publicationsService';
import useSyncTaskUpdates from './useSyncTaskUpdates';

/**
 * useMovementsAndTasks
 * Gerencia carregamento e operações sobre movimentações e tarefas do caso.
 * 
 * @param {number} id - ID do caso
 * @param {Object} systemSettings - Configurações do sistema
 * @param {function} showToast - Função para exibir notificações
 * @returns {Object} Estado e funções para gerenciar movimentações e tarefas
 */
export function useMovementsAndTasks(id, systemSettings, showToast) {
  // Movimentações
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loadingMovimentacoes, setLoadingMovimentacoes] = useState(false);
  const loadMovimentacoesRequestId = useRef(0);

  // Tasks
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Highlighting
  const [highlightedMovimentacaoId, setHighlightedMovimentacaoId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  /**
   * Carregar movimentações
   */
  const loadMovimentacoes = useCallback(async () => {
    if (!id) return;

    const requestId = ++loadMovimentacoesRequestId.current;
    setLoadingMovimentacoes(true);
    try {
      const data = await caseMovementsService.getMovementsByCase(id);
      if (requestId !== loadMovimentacoesRequestId.current) return; // resposta obsoleta
      setMovimentacoes(data);
    } catch (error) {
      if (requestId !== loadMovimentacoesRequestId.current) return;
      console.error('Error loading movimentacoes:', error);
      showToast('Erro ao carregar movimentações', 'error');
    } finally {
      if (requestId === loadMovimentacoesRequestId.current) {
        setLoadingMovimentacoes(false);
      }
    }
  }, [id, showToast]);

  /**
   * Carregar tarefas
   */
  const loadTasks = useCallback(async () => {
    if (!id) return;

    setLoadingTasks(true);
    try {
      const data = await caseTasksService.getTasksByCase(id);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('Erro ao carregar tarefas', 'error');
    } finally {
      setLoadingTasks(false);
    }
  }, [id, showToast]);

  /**
   * Auto-load movimentações ao montar (baseado em setting)
   */
  useEffect(() => {
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_MOVEMENTS_ON_CASE !== false;
    
    if (id && shouldAutoLoad) {
      loadMovimentacoes();
    }
  }, [id, loadMovimentacoes, systemSettings]);

  /**
   * Auto-load tarefas ao montar (baseado em setting)
   */
  useEffect(() => {
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_TASKS_ON_CASE !== false;

    if (id && shouldAutoLoad) {
      loadTasks();
    }
  }, [id, loadTasks, systemSettings]);

  // Mantem tarefas sincronizadas quando houver atualização em outras telas/abas.
  useSyncTaskUpdates({
    caseId: id,
    enabled: !!id,
    onAnyUpdate: () => {
      loadTasks();
    },
  });

  /**
   * Deletar movimentação
   */
  const handleDeleteMovimentacao = async (movimentacaoId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta movimentação?')) {
      return;
    }
    
    try {
      await caseMovementsService.deleteMovement(movimentacaoId);
      showToast('Movimentação excluída com sucesso!', 'success');
      
      // Reload movimentacoes
      await loadMovimentacoes();
    } catch (error) {
      console.error('Error deleting movimentacao:', error);
      showToast('Erro ao excluir movimentação', 'error');
    }
  };

  /**
   * Criar tarefa
   */
  const handleCreateTask = async (taskPayload) => {
    try {
      await caseTasksService.createTask(taskPayload);
      await loadTasks();
      showToast('Tarefa criada com sucesso', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Erro ao criar tarefa', 'error');
    }
  };

  /**
   * Atualizar status da tarefa
   */
  const handleUpdateTaskStatus = async (taskId, nextStatus) => {
    try {
      await caseTasksService.patchTask(taskId, { status: nextStatus });
      await loadTasks();
      showToast('Status da tarefa atualizado', 'success');
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Erro ao atualizar tarefa', 'error');
    }
  };

  /**
   * Deletar tarefa
   */
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Deseja excluir esta tarefa?')) return;

    try {
      await caseTasksService.deleteTask(taskId);
      await loadTasks();
      showToast('Tarefa excluída', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Erro ao excluir tarefa', 'error');
    }
  };

  /**
   * Destacar movimentação específica
   */
  const handleOpenLinkedMovimentacao = (movimentacaoId) => {
    if (!movimentacaoId) return;

    setHighlightedMovimentacaoId(Number(movimentacaoId));

    setTimeout(() => {
      setHighlightedMovimentacaoId(null);
    }, 3000);
  };

  /**
   * Destacar movimentação mais recente
   */
  const handleOpenLatestMovimentacao = () => {
    if (!movimentacoes || movimentacoes.length === 0) {
      return;
    }

    const latestMov = [...movimentacoes].sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);

      if (dateB.getTime() !== dateA.getTime()) {
        return dateB - dateA;
      }

      return (b.id || 0) - (a.id || 0);
    })[0];

    if (!latestMov?.id) {
      return;
    }

    setHighlightedMovimentacaoId(Number(latestMov.id));

    setTimeout(() => {
      setHighlightedMovimentacaoId(null);
    }, 3000);
  };

  /**
   * Criar movimentação a partir de publicação (modo manual)
   */
  const handleCreateMovementFromPublication = async (publicationIdApi) => {
    try {
      const result = await publicationsService.createMovementFromPublication(publicationIdApi);
      
      if (result.success) {
        showToast('Movimentação criada com sucesso!', 'success');
        
        // Reload movimentacoes
        await loadMovimentacoes();
      } else {
        showToast(result.error || 'Erro ao criar movimentação', 'error');
      }
    } catch (error) {
      console.error('Error creating movement from publication:', error);
      showToast('Erro ao criar movimentação', 'error');
    }
  };

  /**
   * Atualizar deadline/prazo
   */
  const handleUpdateDeadline = async (deadline) => {
    try {
      await caseMovementsService.updateMovement(deadline.id, {
        completed: deadline.completed,
      });
      showToast(
        deadline.completed
          ? 'Prazo marcado como resolvido'
          : 'Prazo marcado como não resolvido',
        'success'
      );
    } catch (error) {
      console.error('Error updating deadline:', error);
      showToast('Erro ao atualizar prazo', 'error');
    }
  };

  return {
    // Estado
    movimentacoes,
    setMovimentacoes,
    loadingMovimentacoes,
    tasks,
    setTasks,
    loadingTasks,
    highlightedMovimentacaoId,
    setHighlightedMovimentacaoId,
    highlightedTaskId,
    setHighlightedTaskId,

    // Funções
    loadMovimentacoes,
    loadTasks,
    handleDeleteMovimentacao,
    handleCreateTask,
    handleUpdateTaskStatus,
    handleDeleteTask,
    handleOpenLinkedMovimentacao,
    handleOpenLatestMovimentacao,
    handleCreateMovementFromPublication,
    handleUpdateDeadline,
  };
}

export default useMovementsAndTasks;
