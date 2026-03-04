import { useEffect, useState, useMemo, useCallback } from 'react';
import caseTasksService from '../services/caseTasksService';
import { notifyTaskUpdate, subscribeToTaskUpdates } from '../services/taskSyncService';
import './DeadlinesPage.css';

/**
 * Dashboard de Tarefas por Urgência
 * 
 * Exibe todas as tarefas do sistema agrupadas por urgência (URGENTISSIMO, URGENTE, NORMAL)
 * Ordenadas por data de vencimento (menores prazos primeiro)
 */
export default function DeadlinesPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUrgency, setSelectedUrgency] = useState(null); // Para rastrear qual filtro está ativo
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Para rastrear qual tarefa está selecionada

  const parseLocalDate = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return new Date(`${dateValue}T00:00:00`);
    }
    return new Date(dateValue);
  };

  // Buscar todas as tarefas do sistema
  const fetchAllTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await caseTasksService.getAllTasks();
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
      setError('Erro ao carregar tarefas do sistema.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTasks();
    // Atualizar a cada 2 minutos
    const interval = setInterval(fetchAllTasks, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Sincroniza atualizações de tarefas entre abas do navegador
   * Quando uma tarefa é atualizada em outra aba (MovimentacoesTab), recarrega os dados
   */
  useEffect(() => {
    const unsubscribe = subscribeToTaskUpdates((event) => {
      if (event?.type === 'task-updated') {
        if (event?.taskId && event?.newStatus) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === event.taskId ? { ...task, status: event.newStatus } : task
            )
          );
        }
        fetchAllTasks();
      }
    });
    return unsubscribe;
  }, [fetchAllTasks]);

  /**
   * Calcula urgência baseado em data de vencimento
   * Retorna: URGENTISSIMO (0-3d), URGENTE (4-7d), NORMAL (8+d)
   */
  const calculateUrgency = (dataVencimento) => {
    if (!dataVencimento) return 'NORMAL';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = parseLocalDate(dataVencimento);
    dueDate.setHours(0, 0, 0, 0);
    
    const daysRemaining = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 3) return 'URGENTISSIMO';
    if (daysRemaining <= 7) return 'URGENTE';
    return 'NORMAL';
  };

  /**
   * Formata dias restantes para exibição
   */
  const formatDaysRemaining = (dataVencimento) => {
    if (!dataVencimento) return 'Sem prazo';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = parseLocalDate(dataVencimento);
    dueDate.setHours(0, 0, 0, 0);
    
    const days = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)}d atrasada`;
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    return `${days}d`;
  };

  const isOverdue = (dataVencimento) => {
    if (!dataVencimento) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = parseLocalDate(dataVencimento);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  };

  const isToday = (dataVencimento) => {
    if (!dataVencimento) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = parseLocalDate(dataVencimento);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate.getTime() === today.getTime();
  };

  /**
   * Gera URL para navegar até a movimentação e destacar tarefa específica
   * Instante A (0-5s): ambos (movimento + tarefa) com destaque azul
   * Instante B (5s+): apenas tarefa mantém destaque
   */
  const getMovementLinkUrl = (caseId, movementId, taskId) => {
    return `/cases/${caseId}?tab=movements&focusMovement=${movementId}&focusTask=${taskId}`;
  };

  /**
   * Agrupa e ordena tarefas por urgência
   */
  /**
   * Agrupa tarefas por urgência e ordena (memoizado para evitar re-renderizações desnecessárias)
   */
  const grouped = useMemo(() => {
    // Adiciona urgência calculada a cada tarefa
    const tasksWithUrgency = tasks.map(task => ({
      ...task,
      calculated_urgency: calculateUrgency(task.data_vencimento),
    }));

    // Agrupa por urgência
    const groupedTasks = {
      URGENTISSIMO: [],
      URGENTE: [],
      NORMAL: [],
    };

    tasksWithUrgency.forEach(task => {
      groupedTasks[task.calculated_urgency].push(task);
    });

    // Ordena cada grupo por data_vencimento (menores prazos primeiro)
    Object.keys(groupedTasks).forEach(urgency => {
      groupedTasks[urgency].sort((a, b) => {
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return parseLocalDate(a.data_vencimento) - parseLocalDate(b.data_vencimento);
      });
    });

    return groupedTasks;
  }, [tasks]);

  /**
   * Calcula total de tarefas
   */
  const totalTasks = useMemo(() => tasks.length, [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'CONCLUIDA').length, [tasks]);
  const showUrgentissimo = useMemo(() => selectedUrgency === null || selectedUrgency === 'URGENTISSIMO', [selectedUrgency]);
  const showUrgente = useMemo(() => selectedUrgency === null || selectedUrgency === 'URGENTE', [selectedUrgency]);
  const showNormal = useMemo(() => selectedUrgency === null || selectedUrgency === 'NORMAL', [selectedUrgency]);
  const showUrgencyContainerBorder = useMemo(() => selectedUrgency === null, [selectedUrgency]);

  /**
   * Marca tarefa como concluída
   */
  const handleToggleTaskStatus = async (task) => {
    try {
      const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
      await caseTasksService.patchTask(task.id, { status: nextStatus });
      
      // Atualizar estado local
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id ? { ...t, status: nextStatus } : t
        )
      );

      // Notificar outros abas da mudança de tarefa
      notifyTaskUpdate({
        type: 'task-updated',
        action: 'status-changed',
        taskId: task.id,
        caseId: task.case,
        newStatus: nextStatus,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      alert('Erro ao atualizar tarefa. Tente novamente.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <div className="deadlines-page">
        <div className="page-header">
          <h1>⏰ Tarefas por Urgência</h1>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deadlines-page">
        <div className="page-header">
          <h1>⏰ Tarefas por Urgência</h1>
        </div>
        <div className="error-state">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="deadlines-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>⏰ Tarefas por Urgência</h1>
          <p className="header-subtitle">
            {totalTasks} {totalTasks === 1 ? 'tarefa' : 'tarefas'} 
            {completedTasks > 0 && ` • ${completedTasks} concluída(s)`}
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="deadlines-stats">
        <div
          className={`stat-card stat-total stat-clickable ${selectedUrgency === null ? 'stat-selected' : ''}`}
          onClick={() => setSelectedUrgency(null)}
          title="Mostrar todas as tarefas"
        >
          <div className="stat-number">{totalTasks}</div>
          <div className="stat-label">Todas</div>
        </div>
        <div 
          className={`stat-card stat-urgentissimo stat-clickable ${selectedUrgency === 'URGENTISSIMO' ? 'stat-selected' : ''}`}
          onClick={() => setSelectedUrgency(selectedUrgency === 'URGENTISSIMO' ? null : 'URGENTISSIMO')}
          title="Filtrar apenas críticas"
        >
          <div className="stat-number">{grouped.URGENTISSIMO.length}</div>
          <div className="stat-label">CRITICO</div>
        </div>
        <div 
          className={`stat-card stat-urgente stat-clickable ${selectedUrgency === 'URGENTE' ? 'stat-selected' : ''}`}
          onClick={() => setSelectedUrgency(selectedUrgency === 'URGENTE' ? null : 'URGENTE')}
          title="Filtrar apenas urgentes"
        >
          <div className="stat-number">{grouped.URGENTE.length}</div>
          <div className="stat-label">Urgentes</div>
        </div>
        <div 
          className={`stat-card stat-normal stat-clickable ${selectedUrgency === 'NORMAL' ? 'stat-selected' : ''}`}
          onClick={() => setSelectedUrgency(selectedUrgency === 'NORMAL' ? null : 'NORMAL')}
          title="Filtrar apenas normais"
        >
          <div className="stat-number">{grouped.NORMAL.length}</div>
          <div className="stat-label">Normais</div>
        </div>
      </div>

      {/* Tarefas por Urgência */}
      <div className="tasks-container">
        {totalTasks === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h2>Nenhuma tarefa</h2>
            <p>Você está em dia com todas as tarefas!</p>
          </div>
        ) : (
          <>
            {/* URGENTÍSSIMAS */}
            {showUrgentissimo && grouped.URGENTISSIMO.length > 0 && (
              <div className={`urgency-section ${showUrgencyContainerBorder ? 'urgentissimo-section' : ''}`}>
                <div className="tasks-list">
                  {grouped.URGENTISSIMO.map(task => (
                    <div key={task.id} className={`task-item urgentissimo ${task.status === 'CONCLUIDA' ? 'completed' : ''} ${selectedTaskId === task.id ? 'selected' : ''}`}>
                      <div className="task-checkbox">
                        <input
                          type="checkbox"
                          checked={task.status === 'CONCLUIDA'}
                          onChange={() => handleToggleTaskStatus(task)}
                          className="checkbox-input"
                        />
                      </div>
                      
                      <div className="task-main" onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}>
                        <div className="task-title">{task.titulo}</div>
                        {task.descricao && <div className="task-description">{task.descricao}</div>}
                        <div className="task-process-meta">
                          <a href={`/cases/${task.case}`} className="task-process-link" onClick={(e) => e.stopPropagation()}>
                            {task.case_numero}
                          </a>
                          {task.movimentacao && (
                            <>
                              <span className="task-meta-dot">•</span>
                              <a href={getMovementLinkUrl(task.case, task.movimentacao, task.id)} className="task-movement-link-anchor" onClick={(e) => e.stopPropagation()}>
                                📋 {task.movimentacao_titulo}
                              </a>
                            </>
                          )}
                        </div>
                        <div className="task-meta">
                          <span className={`task-date ${isOverdue(task.data_vencimento) ? 'overdue-date' : ''} ${isToday(task.data_vencimento) ? 'today-date' : ''}`}>{formatDate(task.data_vencimento)}</span>
                          <span className="task-meta-dot">•</span>
                          <span className={`task-remaining ${isOverdue(task.data_vencimento) ? 'overdue-remaining' : ''} ${isToday(task.data_vencimento) ? 'today-remaining' : ''}`}>{formatDaysRemaining(task.data_vencimento)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* URGENTES */}
            {showUrgente && grouped.URGENTE.length > 0 && (
              <div className={`urgency-section ${showUrgencyContainerBorder ? 'urgente-section' : ''}`}>
                <div className="tasks-list">
                  {grouped.URGENTE.map(task => (
                    <div key={task.id} className={`task-item urgente ${task.status === 'CONCLUIDA' ? 'completed' : ''} ${selectedTaskId === task.id ? 'selected' : ''}`}>
                      <div className="task-checkbox">
                        <input
                          type="checkbox"
                          checked={task.status === 'CONCLUIDA'}
                          onChange={() => handleToggleTaskStatus(task)}
                          className="checkbox-input"
                        />
                      </div>
                      
                      <div className="task-main" onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}>
                        <div className="task-title">{task.titulo}</div>
                        {task.descricao && <div className="task-description">{task.descricao}</div>}
                        <div className="task-process-meta">
                          <a href={`/cases/${task.case}`} className="task-process-link" onClick={(e) => e.stopPropagation()}>
                            {task.case_numero}
                          </a>
                          {task.movimentacao && (
                            <>
                              <span className="task-meta-dot">•</span>
                              <a href={getMovementLinkUrl(task.case, task.movimentacao, task.id)} className="task-movement-link-anchor" onClick={(e) => e.stopPropagation()}>
                                📋 {task.movimentacao_titulo}
                              </a>
                            </>
                          )}
                        </div>
                        <div className="task-meta">
                          <span className={`task-date ${isOverdue(task.data_vencimento) ? 'overdue-date' : ''} ${isToday(task.data_vencimento) ? 'today-date' : ''}`}>{formatDate(task.data_vencimento)}</span>
                          <span className="task-meta-dot">•</span>
                          <span className={`task-remaining ${isOverdue(task.data_vencimento) ? 'overdue-remaining' : ''} ${isToday(task.data_vencimento) ? 'today-remaining' : ''}`}>{formatDaysRemaining(task.data_vencimento)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NORMAIS */}
            {showNormal && grouped.NORMAL.length > 0 && (
              <div className={`urgency-section ${showUrgencyContainerBorder ? 'normal-section' : ''}`}>
                <div className="tasks-list">
                  {grouped.NORMAL.map(task => (
                    <div key={task.id} className={`task-item normal ${task.status === 'CONCLUIDA' ? 'completed' : ''} ${selectedTaskId === task.id ? 'selected' : ''}`}>
                      <div className="task-checkbox">
                        <input
                          type="checkbox"
                          checked={task.status === 'CONCLUIDA'}
                          onChange={() => handleToggleTaskStatus(task)}
                          className="checkbox-input"
                        />
                      </div>
                      
                      <div className="task-main" onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}>
                        <div className="task-title">{task.titulo}</div>
                        {task.descricao && <div className="task-description">{task.descricao}</div>}
                        <div className="task-process-meta">
                          <a href={`/cases/${task.case}`} className="task-process-link" onClick={(e) => e.stopPropagation()}>
                            {task.case_numero}
                          </a>
                          {task.movimentacao && (
                            <>
                              <span className="task-meta-dot">•</span>
                              <a href={getMovementLinkUrl(task.case, task.movimentacao, task.id)} className="task-movement-link-anchor" onClick={(e) => e.stopPropagation()}>
                                📋 {task.movimentacao_titulo}
                              </a>
                            </>
                          )}
                        </div>
                        <div className="task-meta">
                          <span className={`task-date ${isOverdue(task.data_vencimento) ? 'overdue-date' : ''} ${isToday(task.data_vencimento) ? 'today-date' : ''}`}>{formatDate(task.data_vencimento)}</span>
                          <span className="task-meta-dot">•</span>
                          <span className={`task-remaining ${isOverdue(task.data_vencimento) ? 'overdue-remaining' : ''} ${isToday(task.data_vencimento) ? 'today-remaining' : ''}`}>{formatDaysRemaining(task.data_vencimento)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
