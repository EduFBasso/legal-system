import { useEffect } from 'react';
import { subscribeToTaskUpdates } from '../services/taskSyncService';

/**
 * Hook para sincronizar atualizações de tarefas entre abas/componentes
 * 
 * Escuta eventos de taskSyncService e executa callbacks apropriados
 * quando tarefas são criadas, atualizadas ou deletadas.
 * 
 * @param {Object} options - Configurações do hook
 * @param {string|number} options.caseId - ID do case (opcional, filtra eventos por case)
 * @param {Function} options.onTaskUpdate - Callback quando tarefa é atualizada
 * @param {Function} options.onTaskCreate - Callback quando tarefa é criada
 * @param {Function} options.onTaskDelete - Callback quando tarefa é deletada
 * @param {Function} options.onAnyUpdate - Callback para qualquer atualização (fallback)
 * @param {boolean} options.enabled - Se o hook está ativo (padrão: true)
 * 
 * @example
 * // Uso simples (recarregar dados em qualquer update)
 * useSyncTaskUpdates({
 *   caseId: id,
 *   onAnyUpdate: () => loadTasks()
 * });
 * 
 * @example
 * // Uso avançado (otimistic update)
 * useSyncTaskUpdates({
 *   caseId: id,
 *   onTaskUpdate: (event) => {
 *     setTasks(prev => prev.map(t => 
 *       t.id === event.taskId ? { ...t, status: event.newStatus } : t
 *     ));
 *   },
 *   onAnyUpdate: () => loadTasks()
 * });
 */
export function useSyncTaskUpdates(options = {}) {
  const {
    caseId = null,
    onTaskUpdate = null,
    onTaskCreate = null,
    onTaskDelete = null,
    onAnyUpdate = null,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToTaskUpdates((event) => {
      if (!event) return;

      // Filtrar por caseId se fornecido
      if (caseId && event.caseId && parseInt(event.caseId) !== parseInt(caseId)) {
        return;
      }

      // Determinar ação do evento
      const eventAction = event.action;

      // Callbacks específicos por ação
      if (eventAction === 'status-changed' && onTaskUpdate) {
        onTaskUpdate(event);
      } else if (eventAction === 'created' && onTaskCreate) {
        onTaskCreate(event);
      } else if (eventAction === 'deleted' && onTaskDelete) {
        onTaskDelete(event);
      }

      // Callback genérico (sempre chama se existir)
      if (onAnyUpdate) {
        onAnyUpdate(event);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [caseId, onTaskUpdate, onTaskCreate, onTaskDelete, onAnyUpdate, enabled]);
}

export default useSyncTaskUpdates;
