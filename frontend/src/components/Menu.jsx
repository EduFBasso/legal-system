// src/components/Menu.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import publicationsService from '../services/publicationsService';
import { subscribePublicationSync } from '../services/publicationSync';
import caseTasksService from '../services/caseTasksService';
import { subscribeToTaskUpdates } from '../services/taskSyncService';
import SettingsModal from './SettingsModal';
import './Menu.css';

export default function Menu() {
  const [pendingCount, setPendingCount] = useState(0);
  const [scheduledTasksCount, setScheduledTasksCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const result = await publicationsService.getPendingCount();
        if (result.success) {
          setPendingCount(result.count || 0);
        }
      } catch {
        setPendingCount(0);
      }
    };

    loadPendingCount();

    const handlePublicationsSearchCompleted = () => {
      loadPendingCount();
    };

    const handleWindowFocus = () => {
      loadPendingCount();
    };

    // Escutar eventos de integração para atualizar contador
    const unsubscribe = subscribePublicationSync((event) => {
      if (event.type === 'PUBLICATION_INTEGRATED') {
        loadPendingCount();
      }
    });

    window.addEventListener('publicationsSearchCompleted', handlePublicationsSearchCompleted);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('publicationsSearchCompleted', handlePublicationsSearchCompleted);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  useEffect(() => {
    const loadScheduledTasksCount = async () => {
      try {
        const tasks = await caseTasksService.getAllTasks();
        if (Array.isArray(tasks)) {
          const activeCount = tasks.filter((task) => task.status !== 'CONCLUIDA').length;
          setScheduledTasksCount(activeCount);
          return;
        }
        setScheduledTasksCount(0);
      } catch {
        setScheduledTasksCount(0);
      }
    };

    loadScheduledTasksCount();

    const unsubscribeTasks = subscribeToTaskUpdates((event) => {
      if (event?.type === 'task-updated') {
        loadScheduledTasksCount();
      }
    });

    const handleFocus = () => {
      loadScheduledTasksCount();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  return (
    <>
      <nav className="app-menu">
        <ul className="menu-list">
        <li className="menu-item">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">🏠</span>
            <span className="menu-label">Dashboard</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink
            to="/cases"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">⚖️</span>
            <span className="menu-label">Processos</span>
          </NavLink>
        </li>

        <li className="menu-group-spacer" aria-hidden="true" />

        <li className="menu-item">
          <NavLink
            to="/publications"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">🔍</span>
            <span className="menu-label">Buscar Publicações</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink
            to="/search-history"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">📜</span>
            <span className="menu-label">Histórico de Buscas</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink
            to="/publications/all"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">📚</span>
            <span className="menu-label">Todas Publicações</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink
            to="/publications/pending"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">⏳</span>
            <span className="menu-label">Não Vinculadas</span>
            {pendingCount > 0 && (
              <span className="menu-count-badge menu-count-badge--pending">{pendingCount}</span>
            )}
          </NavLink>
        </li>

        <li className="menu-group-spacer menu-group-spacer-lg" aria-hidden="true" />

          <li className="menu-item">
            <NavLink
              to="/deadlines"
              end
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="menu-icon">⏰</span>
              <span className="menu-label">Tarefas Agendadas</span>
              {scheduledTasksCount > 0 && (
                <span className="menu-count-badge menu-count-badge--tasks">{scheduledTasksCount}</span>
              )}
            </NavLink>
          </li>

          <li className="menu-group-spacer menu-group-spacer-lg" aria-hidden="true" />

          <li className="menu-item">
            <button
              type="button"
              className="menu-action-button"
              onClick={() => setIsSettingsOpen(true)}
              title="Configurações"
            >
              <span className="menu-icon">⚙️</span>
              <span className="menu-label">Configurações</span>
            </button>
          </li>
        </ul>
      </nav>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
