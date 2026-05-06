import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import caseTasksService from '@/services/caseTasksService';
import contactTasksService from '@/services/contactTasksService';
import casesService from '@/services/casesService';
import { getTaskUrgency } from '@/utils/taskUrgency';
import './MonthlyAgendaPage.css';

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

const FILTERS = [
  { key: 'all', label: 'Todos', tone: 'all' },
  { key: 'active', label: 'Ativos', tone: 'active' },
  { key: 'critical', label: 'Crítico', tone: 'critical' },
  { key: 'urgent', label: 'Urgente', tone: 'urgent' },
  { key: 'normal', label: 'Normal', tone: 'normal' },
  { key: 'completed', label: 'Concluídos', tone: 'completed' },
];

const STORAGE_FILTER_KEY = 'ui:agendaMensal:selectedFilter';

const URGENCY_RANK = {
  URGENTISSIMO: 0,
  URGENTE: 1,
  NORMAL: 2,
};

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function monthLabel(date) {
  const label = date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildCalendarWeeks(anchorMonth) {
  const firstDay = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth(), 1);
  const lastDay = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() + 1, 0);

  const startDow = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startDow; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(anchorMonth.getFullYear(), anchorMonth.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

function normalizeTime(rawTime) {
  if (!rawTime) return null;
  const value = String(rawTime).trim();
  if (!value) return null;

  const parts = value.split(':');
  if (parts.length < 2) return null;

  const hh = pad2(parts[0]);
  const mm = pad2(parts[1]);
  return `${hh}:${mm}`;
}

function getUrgencyKey(task) {
  if (task.status === 'CONCLUIDA') return 'COMPLETED';
  return getTaskUrgency(task.data_vencimento);
}

function formatCasePrefix(caseNumero) {
  const digits = String(caseNumero || '').replace(/\D/g, '');
  return digits ? digits.slice(0, 6) : '------';
}

function extractCaseIds(caseTasks) {
  const ids = new Set();
  caseTasks.forEach((task) => {
    const caseId = Number(task.case);
    if (Number.isFinite(caseId)) ids.add(caseId);
  });
  return Array.from(ids);
}

function toMonthlyItem(task, type, caseClientNames) {
  const dueDate = task.data_vencimento;
  if (!dueDate) return null;

  const timeLabel = normalizeTime(task.hora_vencimento);

  if (type === 'case') {
    const caseId = Number(task.case);
    const caseClientName = Number.isFinite(caseId) ? caseClientNames.get(caseId) : '';
    const processPrefix = formatCasePrefix(task.case_numero);
    const displayName = (caseClientName || '').trim() || 'Sem cliente';

    return {
      id: `case-${task.id}`,
      sourceType: 'case',
      taskId: task.id,
      caseId,
      status: task.status,
      urgency: getUrgencyKey(task),
      dueDate,
      timeLabel,
      processPrefix,
      title: displayName,
    };
  }

  return {
    id: `contact-${task.id}`,
    sourceType: 'contact',
    taskId: task.id,
    status: task.status,
    urgency: getUrgencyKey(task),
    dueDate,
    timeLabel,
    title: (task.contact_name || task.titulo || 'Sem nome').trim(),
  };
}

function matchesFilter(item, filter) {
  if (item.status === 'CANCELADA') return false;

  if (filter === 'all') return true;
  if (filter === 'active') return item.status !== 'CONCLUIDA';
  if (filter === 'completed') return item.status === 'CONCLUIDA';

  if (item.status === 'CONCLUIDA') return false;

  if (filter === 'critical') return item.urgency === 'URGENTISSIMO';
  if (filter === 'urgent') return item.urgency === 'URGENTE';
  if (filter === 'normal') return item.urgency === 'NORMAL';

  return true;
}

function sortItems(a, b) {
  const aRank = a.status === 'CONCLUIDA' ? 99 : (URGENCY_RANK[a.urgency] ?? 99);
  const bRank = b.status === 'CONCLUIDA' ? 99 : (URGENCY_RANK[b.urgency] ?? 99);
  if (aRank !== bRank) return aRank - bRank;

  const aHasTime = Boolean(a.timeLabel);
  const bHasTime = Boolean(b.timeLabel);
  if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;

  if (aHasTime && bHasTime && a.timeLabel !== b.timeLabel) {
    return a.timeLabel.localeCompare(b.timeLabel);
  }

  return a.title.localeCompare(b.title);
}

function getBadgeClass(item) {
  if (item.status === 'CONCLUIDA') return 'monthly-agenda__badge monthly-agenda__badge--completed';
  if (item.urgency === 'URGENTISSIMO') return 'monthly-agenda__badge monthly-agenda__badge--critical';
  if (item.urgency === 'URGENTE') return 'monthly-agenda__badge monthly-agenda__badge--urgent';
  return 'monthly-agenda__badge monthly-agenda__badge--normal';
}

function getBadgeText(item) {
  if (item.sourceType === 'case') {
    const base = `${item.processPrefix} • ${item.title}`;
    return item.timeLabel ? `${item.timeLabel} ${base}` : base;
  }

  return item.timeLabel ? `${item.timeLabel} ${item.title}` : item.title;
}

export default function MonthlyAgendaPage() {
  const navigate = useNavigate();

  const [anchorMonth, setAnchorMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedFilter, setSelectedFilter] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_FILTER_KEY);
      if (stored && FILTERS.some((filter) => filter.key === stored)) {
        return stored;
      }
    } catch {
      // Ignore storage errors and fallback to default filter
    }
    return 'all';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [overflowDays, setOverflowDays] = useState({});

  const listRefs = useRef({});

  const weeks = useMemo(() => buildCalendarWeeks(anchorMonth), [anchorMonth]);
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const headerLabel = useMemo(() => monthLabel(anchorMonth), [anchorMonth]);
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return anchorMonth.getFullYear() === now.getFullYear() && anchorMonth.getMonth() === now.getMonth();
  }, [anchorMonth]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_FILTER_KEY, selectedFilter);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [selectedFilter]);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [caseTasksRaw, contactTasksRaw] = await Promise.all([
          caseTasksService.getAllTasks(),
          contactTasksService.getAllTasks(),
        ]);

        const caseTasks = Array.isArray(caseTasksRaw) ? caseTasksRaw : [];
        const contactTasks = Array.isArray(contactTasksRaw) ? contactTasksRaw : [];

        const caseIds = extractCaseIds(caseTasks);

        const caseDetailsResults = await Promise.allSettled(
          caseIds.map((id) => casesService.getById(id))
        );

        const caseClientNames = new Map();
        caseDetailsResults.forEach((result, index) => {
          if (result.status !== 'fulfilled') return;

          const caseId = caseIds[index];
          const detail = result.value || {};
          const clientName = (detail.cliente_nome || detail.cliente_principal_nome || '').trim();
          if (clientName) {
            caseClientNames.set(caseId, clientName);
          }
        });

        const caseItems = caseTasks
          .map((task) => toMonthlyItem(task, 'case', caseClientNames))
          .filter(Boolean);

        const contactItems = contactTasks
          .map((task) => toMonthlyItem(task, 'contact', caseClientNames))
          .filter(Boolean);

        const merged = [...caseItems, ...contactItems].sort(sortItems);

        if (!isActive) return;
        setItems(merged);
      } catch (errLoad) {
        if (!isActive) return;
        setError('Erro ao carregar tarefas da agenda mensal.');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    load();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item, selectedFilter)),
    [items, selectedFilter]
  );

  const isActiveScopeSelected = selectedFilter === 'critical' || selectedFilter === 'urgent' || selectedFilter === 'normal';

  const isFilterVisuallySelected = (filterKey) => {
    if (filterKey === selectedFilter) return true;
    if (filterKey === 'active' && isActiveScopeSelected) return true;
    return false;
  };

  const groupedByDay = useMemo(() => {
    const map = {};
    filteredItems.forEach((item) => {
      if (!map[item.dueDate]) map[item.dueDate] = [];
      map[item.dueDate].push(item);
    });

    Object.values(map).forEach((dayItems) => dayItems.sort(sortItems));
    return map;
  }, [filteredItems]);

  useEffect(() => {
    const nextOverflow = {};

    Object.entries(listRefs.current).forEach(([isoDay, node]) => {
      if (!node) return;
      nextOverflow[isoDay] = node.scrollHeight > node.clientHeight + 2;
    });

    setOverflowDays(nextOverflow);
  }, [groupedByDay, weeks, selectedFilter]);

  function goPrevMonth() {
    setAnchorMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setAnchorMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToday() {
    const now = new Date();
    setAnchorMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function handleBadgeClick(item) {
    const params = new URLSearchParams();
    params.set('task_id', String(item.taskId));
    params.set('focus_task', '1');

    if (item.status === 'CONCLUIDA') {
      params.set('show_completed', '1');
    }

    if (item.sourceType === 'contact') {
      navigate(`/contact-tasks?${params.toString()}`);
      return;
    }

    navigate(`/deadlines?${params.toString()}`);
  }

  function registerListRef(isoDay, node) {
    listRefs.current[isoDay] = node;
  }

  return (
    <div className="monthly-agenda">
      <div className="monthly-agenda__header">
        <button
          type="button"
          className={`monthly-agenda__today-btn${isCurrentMonth ? ' is-current-month' : ''}`}
          onClick={goToday}
        >
          Mês Atual
        </button>

        <div className="monthly-agenda__month-nav">
          <button type="button" className="monthly-agenda__arrow-btn" onClick={goPrevMonth} aria-label="Mes anterior">
            ←
          </button>

          <div className="monthly-agenda__month-label">{headerLabel}</div>

          <button type="button" className="monthly-agenda__arrow-btn" onClick={goNextMonth} aria-label="Proximo mes">
            →
          </button>
        </div>

        <div className="monthly-agenda__filters" role="tablist" aria-label="Filtros da agenda mensal">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={selectedFilter === filter.key}
              className={`monthly-agenda__filter-pill monthly-agenda__filter-pill--${filter.tone} ${isFilterVisuallySelected(filter.key) ? 'is-active' : ''} ${filter.key === 'active' && isActiveScopeSelected ? 'is-active-related' : ''} ${filter.key === 'active' && isCurrentMonth ? 'is-current-month' : ''}`}
              data-filter={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="monthly-agenda__weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className={`monthly-agenda__weekday ${day === 'DOM' ? 'is-sunday' : ''}`}>
            {day}
          </div>
        ))}
      </div>

      {loading ? <div className="monthly-agenda__feedback">Carregando agenda mensal...</div> : null}
      {!loading && error ? <div className="monthly-agenda__feedback is-error">{error}</div> : null}

      <div className="monthly-agenda__grid">
        {weeks.flat().map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="monthly-agenda__day monthly-agenda__day--empty" />;
          }

          const isoDay = toISODate(day);
          const dayItems = groupedByDay[isoDay] || [];
          const isToday = isoDay === todayISO;

          return (
            <div key={isoDay} className="monthly-agenda__day">
              <div className="monthly-agenda__day-header">
                <span className={`monthly-agenda__day-number ${isToday ? 'is-today' : ''}`}>{day.getDate()}</span>
                {isToday ? <span className="monthly-agenda__today-label">HOJE</span> : null}
              </div>

              <div
                className="monthly-agenda__day-list"
                ref={(node) => registerListRef(isoDay, node)}
              >
                {dayItems.length === 0 ? <div className="monthly-agenda__empty-mark">--</div> : null}

                {dayItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={getBadgeClass(item)}
                    title={getBadgeText(item)}
                    onClick={() => handleBadgeClick(item)}
                  >
                    <span className="monthly-agenda__badge-text">{getBadgeText(item)}</span>
                  </button>
                ))}
              </div>

              {overflowDays[isoDay] ? <div className="monthly-agenda__overflow-indicator">...</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
