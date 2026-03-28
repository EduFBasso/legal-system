import { useState, useEffect, useMemo } from 'react';
import { useUrgencyVisibility } from '../../hooks/useUrgencyVisibility';
import caseTasksService from '../../services/caseTasksService';
import { notifyTaskUpdate } from '../../services/taskSyncService';
import useSyncTaskUpdates from '../../hooks/useSyncTaskUpdates';
import { openCaseDetailWindow } from '../../utils/publicationNavigation';
import { validateDueDateAtLeastTomorrow } from '../../utils/taskDueDateValidation';
import {
  getTaskUrgency,
  formatDaysRemaining,
  isOverdue,
  isToday,
  parseLocalDate,
} from '../../utils/taskUrgency';
import TaskCard from '../TaskCard';
import UrgencySection from '../UrgencySection';
import CreateTaskModal from '../CreateTaskModal';
import { Button } from '../common/Button';
import './TasksTab.css';

const EMPTY_TASKS = [];

/**
 * TasksTab - Tarefas do Processo (Tipo 2)
 * 
 * Exibe todas as tarefas vinculadas ao caso mas NÃO vinculadas a uma movimentação específica
 * Tarefas "soltas" do processo - deadlines independentes de movimentações
 * 
 * Arquitetura de tarefas:
 * - Tipo 1: Tarefas vinculadas a movimentação (movimentacao=ID) → MovimentacoesTab
 * - Tipo 2: Tarefas do processo (movimentacao=NULL) → TasksTab (ESTE COMPONENTE)
 * - Tipo 3: Tarefas de agenda (modelo separado CaseAgendaTask) → Future
 */
export default function TasksTab({
  caseId = null,
  tasks: allTasks = EMPTY_TASKS,
  loadingTasks = false,
  formatDate = (date) => date ? new Date(date).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—',
  onRefreshTasks = () => {},
  readOnly = false,
}) {
  const [error, setError] = useState(null);
  const [selectedUrgency, setSelectedUrgency] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  // Estado local: apenas tarefas tipo 2 (sem movimentação)
  // NÃO usa o tasks/setTasks do pai para não sobrescrever as tarefas vinculadas a movimentações
  const [tasks, setTasks] = useState([]);

  // Hook para visibilidade de urgências
  const { URGENCIES, urgencyConfig, shouldShowUrgency } = useUrgencyVisibility(selectedUrgency);

  // Sincroniza o estado local (tipo 2) com as tarefas já carregadas pelo pai.
  useEffect(() => {
    const nextType2 = Array.isArray(allTasks) ? allTasks.filter((task) => !task.movimentacao) : [];
    setTasks(nextType2);
    setError(null);
  }, [allTasks]);

  // Sincronizar atualizações entre abas
  useSyncTaskUpdates({
    caseId,
    onTaskUpdate: (event) => {
      if (event?.taskId && event?.newStatus) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === event.taskId ? { ...task, status: event.newStatus } : task
          )
        );
      }
      onRefreshTasks(); // sincroniza o pai com todas as tarefas
    },
  });

  // Abre case em nova aba
  const handleOpenCase = (caseIdParam) => {
    openCaseDetailWindow(caseIdParam);
  };

  // Agrupa e ordena tarefas por urgência
  const grouped = useMemo(() => {
    const tasksWithUrgency = tasks.map(task => ({
      ...task,
      calculated_urgency: getTaskUrgency(task.data_vencimento),
    }));

    const groupedTasks = {
      URGENTISSIMO: [],
      URGENTE: [],
      NORMAL: [],
    };

    tasksWithUrgency.forEach(task => {
      groupedTasks[task.calculated_urgency].push(task);
    });

    // Ordena cada grupo por data_vencimento
    Object.keys(groupedTasks).forEach(urgency => {
      groupedTasks[urgency].sort((a, b) => {
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return parseLocalDate(a.data_vencimento) - parseLocalDate(b.data_vencimento);
      });
    });

    return groupedTasks;
  }, [tasks]);

  const totalTasks = useMemo(() => tasks.length, [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'CONCLUIDA').length, [tasks]);
  const showUrgencyContainerBorder = useMemo(() => selectedUrgency === null, [selectedUrgency]);

  // Marca tarefa como concluída
  const handleToggleTaskStatus = async (task) => {
    if (readOnly) {
      return;
    }

    try {
      const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
      await caseTasksService.patchTask(task.id, { status: nextStatus });
      
      // Atualiza estado local
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id ? { ...t, status: nextStatus } : t
        )
      );
      onRefreshTasks(); // sincroniza o pai

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

  // Criar nova tarefa do processo
  const handleCreateTask = async (taskData) => {
    if (readOnly) {
      return;
    }

    const dueDateValidation = validateDueDateAtLeastTomorrow(taskData?.data_vencimento);
    if (!dueDateValidation.ok) {
      alert(dueDateValidation.message);
      return;
    }

    setCreatingTask(true);
    try {
      const newTask = await caseTasksService.createTask(taskData);
      
      // Adiciona ao estado local e sincroniza o pai
      setTasks(prevTasks => [...prevTasks, newTask]);
      onRefreshTasks();
      
      // Notificar outros abas
      notifyTaskUpdate({
        type: 'task-updated',
        action: 'created',
        taskId: newTask.id,
        caseId: caseId,
        titulo: newTask.titulo,
        data_vencimento: newTask.data_vencimento,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      alert('Erro ao criar tarefa. Tente novamente.');
      throw err;
    } finally {
      setCreatingTask(false);
    }
  };

  if (loadingTasks) {
    return (
      <div className="tasks-tab">
        <div className="tab-header">
          <h2>✅ Tarefas do Processo</h2>
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
      <div className="tasks-tab">
        <div className="tab-header">
          <h2>✅ Tarefas do Processo</h2>
        </div>
        <div className="error-state">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tasks-tab">
      {/* Header */}
      <div className="tab-header">
        <div className="header-content">
          <h2>✅ Tarefas do Processo</h2>
          <p className="header-subtitle">
            {totalTasks} {totalTasks === 1 ? 'tarefa' : 'tarefas'}
            {completedTasks > 0 && ` • ${completedTasks} concluída(s)`}
          </p>
        </div>
        {!readOnly && (
          <Button
            variant="success"
            size="sm"
            onClick={() => setIsCreateTaskModalOpen(true)}
            disabled={creatingTask}
            title="Criar nova tarefa do processo"
          >
            + Adicionar Tarefa
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="tasks-stats">
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
            <h3>Nenhuma tarefa</h3>
            <p>Você está em dia com todas as tarefas do processo!</p>
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
                  onOpenMovement={() => {}} // Tipo 2 não tem movimento
                  isOverdue={isOverdue}
                  isToday={isToday}
                  formatDate={formatDate}
                  formatDaysRemaining={formatDaysRemaining}
                  showBorder={showUrgencyContainerBorder}
                  readOnly={readOnly}
                />
              )
            ))}
          </>
        )}
      </div>

      {/* Modal de Criação de Tarefa */}
      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen}
        caseId={caseId}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
      />
    </div>
  );
}
