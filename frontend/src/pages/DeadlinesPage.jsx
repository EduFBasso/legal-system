import { useEffect, useState, useMemo, useCallback } from 'react';
import caseTasksService from '../services/caseTasksService';
import { notifyTaskUpdate, subscribeToTaskUpdates } from '../services/taskSyncService';
import { useUrgencyVisibility } from '../hooks/useUrgencyVisibility';
import {
  getTaskUrgency,
  formatDaysRemaining,
  isOverdue,
  isToday,
  parseLocalDate,
} from '../utils/taskUrgency';
import TaskCard from '../components/TaskCard';
import UrgencySection from '../components/UrgencySection';
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
   * Gera URL para navegar até a movimentação e destacar tarefa específica
   * Destaque azul auxiliar em MovimentacoesTab para facilitar localização
   */
  const getMovementLinkUrl = (caseId, movementId, taskId) => {
    return `/cases/${caseId}?tab=movements&focusMovement=${movementId}&focusTask=${taskId}`;
  };

  /**
   * Handler para clique no link de movimentação
   * Seleciona o cartão com cor de urgência padrão (não bloqueia interação)
   */
  const handleMovementLinkClick = (taskId) => {
    setSelectedTaskId(taskId);
  };

  /**
   * Abre processo/case em nova janela
   * Permite visualizar DeadlinesPage + CaseDetailPage lado a lado
   */
  const handleOpenCase = (caseId) => {
    window.open(`/cases/${caseId}`, '_blank', 'width=1400,height=900,left=100,top=100');
  };

  /**
   * Abre movimentação em nova janela com destaque auxiliar
   * Seleciona a tarefa antes de abrir (feedback visual em A)
   * Destaca em MovimentacoesTab ao abrir (feedback visual em B)
   */
  const handleOpenMovement = (caseId, movementId, taskId) => {
    setSelectedTaskId(taskId); // Seleciona em DeadlinesPage
    const url = getMovementLinkUrl(caseId, movementId, taskId);
    window.open(url, '_blank', 'width=1400,height=900,left=100,top=100');
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
      calculated_urgency: getTaskUrgency(task.data_vencimento),
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

  /**
   * Hook para centralizar lógica de visibilidade e configuração de urgências
   * Retorna: URGENCIES, urgencyConfig, shouldShowUrgency
   */
  const { URGENCIES, urgencyConfig, shouldShowUrgency } = useUrgencyVisibility(selectedUrgency);

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
            {/* Renderiza cada urgência em loop */}
            {URGENCIES.map(urgency => (
              (shouldShowUrgency(urgency) && grouped[urgency].length > 0) && (
                <UrgencySection
                  key={urgency}
                  urgency={urgency}
                  tasks={grouped[urgency]}
                  sectionClassName={urgencyConfig[urgency].className}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                  onToggleStatus={handleToggleTaskStatus}
                  onOpenCase={handleOpenCase}
                  onOpenMovement={handleOpenMovement}
                  isOverdue={isOverdue}
                  isToday={isToday}
                  formatDate={formatDate}
                  formatDaysRemaining={formatDaysRemaining}
                  showBorder={showUrgencyContainerBorder}
                />
              )
            ))}
          </>
        )}
      </div>
    </div>
  );
}
