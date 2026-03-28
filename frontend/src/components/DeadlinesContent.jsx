import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import { openCaseDetailWindow } from '../utils/publicationNavigation';
import UrgencySection from './UrgencySection';
import ContactDetailModal from './ContactDetailModal';
import MasterContactDetailsModal from './MasterContactDetailsModal';
import './DeadlinesContent.css';

export default function DeadlinesContent({
  tasksQueryParams,
  service = caseTasksService,
  title = '⏰ Tarefas por Urgência',
  kind = 'case',
  displayLabel = '',
  readOnly = false,
  headerActions = null,
  onEditTask = null,
  onDeleteTask = null,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedOnceRef = useRef(false);
  const [selectedUrgency, setSelectedUrgency] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const fetchAllTasks = useCallback(async ({ showSpinner } = {}) => {
    const shouldShowSpinner = showSpinner ?? !hasLoadedOnceRef.current;

    try {
      if (shouldShowSpinner) {
        setLoading(true);
      }
      const data = await service.getAllTasks(tasksQueryParams);
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
      hasLoadedOnceRef.current = true;
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
      // Se já carregou pelo menos 1x, não derruba a UI (evita flicker do KPI/estatísticas).
      if (!hasLoadedOnceRef.current) {
        setError('Erro ao carregar tarefas do sistema.');
        setTasks([]);
      }
    } finally {
      if (shouldShowSpinner) {
        setLoading(false);
      }
    }
  }, [service, tasksQueryParams]);

  useEffect(() => {
    fetchAllTasks({ showSpinner: true });
    const interval = setInterval(() => fetchAllTasks({ showSpinner: false }), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllTasks]);

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
        fetchAllTasks({ showSpinner: false });
      }
    });
    return unsubscribe;
  }, [fetchAllTasks]);

  const handleOpenCase = (caseId) => {
    if (readOnly) return;
    if (kind !== 'case') return;
    openCaseDetailWindow(caseId);
  };

  const handleOpenMovement = (caseId, movementId, taskId) => {
    if (readOnly) return;
    if (kind !== 'case') return;
    setSelectedTaskId(taskId);
    openCaseDetailWindow(caseId, {
      tab: 'movements',
      focusMovement: movementId,
      focusTask: taskId,
    });
  };

  const handleOpenContact = (contactId) => {
    setSelectedContactId(contactId);
    setIsContactModalOpen(true);
  };

  const grouped = useMemo(() => {
    const tasksWithUrgency = tasks.map((task) => ({
      ...task,
      calculated_urgency: getTaskUrgency(task.data_vencimento),
    }));

    const groupedTasks = {
      URGENTISSIMO: [],
      URGENTE: [],
      NORMAL: [],
    };

    tasksWithUrgency.forEach((task) => {
      groupedTasks[task.calculated_urgency].push(task);
    });

    Object.keys(groupedTasks).forEach((urgency) => {
      groupedTasks[urgency].sort((a, b) => {
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return parseLocalDate(a.data_vencimento) - parseLocalDate(b.data_vencimento);
      });
    });

    return groupedTasks;
  }, [tasks]);

  const totalTasks = useMemo(() => tasks.length, [tasks]);

  const { URGENCIES, urgencyConfig, shouldShowUrgency } = useUrgencyVisibility(selectedUrgency);

  const showUrgencyContainerBorder = useMemo(() => selectedUrgency === null, [selectedUrgency]);

  const handleToggleTaskStatus = async (task) => {
    if (readOnly) return;

    try {
      const nextStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
      await service.patchTask(task.id, { status: nextStatus });

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );

      notifyTaskUpdate({
        type: 'task-updated',
        action: 'status-changed',
        taskId: task.id,
        caseId: task.case,
        newStatus: nextStatus,
        timestamp: new Date().toISOString(),
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

  return (
    <div className="deadlines-content">
      <div className="page-header">
        <div className="header-content">
          <h1>{title}</h1>
          {displayLabel ? <div className="header-subtitle">{displayLabel}</div> : null}
        </div>
        {headerActions ? <div className="header-actions">{headerActions}</div> : null}
      </div>

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

      <div className="tasks-container">
        {loading && !hasLoadedOnceRef.current ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Carregando tarefas...</p>
          </div>
        ) : error && !hasLoadedOnceRef.current ? (
          <div className="error-state">
            <p>❌ {error}</p>
          </div>
        ) : totalTasks === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h2>Nenhuma tarefa</h2>
            <p>Você está em dia com todas as tarefas!</p>
          </div>
        ) : (
          <>
            {URGENCIES.map((urgency) =>
              shouldShowUrgency(urgency) && grouped[urgency].length > 0 ? (
                <UrgencySection
                  key={urgency}
                  urgency={urgency}
                  tasks={grouped[urgency]}
                  sectionClassName={urgencyConfig[urgency].className}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                  onToggleStatus={handleToggleTaskStatus}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onOpenCase={handleOpenCase}
                  onOpenMovement={handleOpenMovement}
                  onOpenContact={handleOpenContact}
                  isOverdue={isOverdue}
                  isToday={isToday}
                  formatDate={formatDate}
                  formatDaysRemaining={formatDaysRemaining}
                  showBorder={showUrgencyContainerBorder}
                  readOnly={readOnly}
                />
              ) : null
            )}
          </>
        )}
      </div>

      {readOnly ? (
        <MasterContactDetailsModal
          contactId={selectedContactId}
          teamMemberId={tasksQueryParams?.team_member_id || null}
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      ) : (
        <ContactDetailModal
          contactId={selectedContactId}
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          onContactUpdated={() => {
            // No-op: keep modal behavior consistent with contact card view.
          }}
          allowModification={true}
          showLinkToProcessButton={false}
          onLinkToCase={null}
          onLinkToProcess={null}
        />
      )}
    </div>
  );
}
