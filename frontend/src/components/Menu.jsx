// src/components/Menu.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import publicationsService from '../services/publicationsService';
import { subscribePublicationSync } from '../services/publicationSync';
import caseTasksService from '../services/caseTasksService';
import { subscribeToTaskUpdates } from '../services/taskSyncService';
import SettingsModal from './SettingsModal';
import './Menu.css';

export default function Menu({ isAuthenticated, onBlockedAction }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const renderMenuLink = ({ to, end = true, icon, label, badge = null }) => {
    if (!isAuthenticated) {
      return (
        <button
          type="button"
          className="menu-disabled-link"
          onClick={onBlockedAction}
          title="Você não está logado"
        >
          <span className="menu-icon">{icon}</span>
          <span className="menu-label">{label}</span>
          {badge}
        </button>
      );
    }

    return (
      <NavLink to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="menu-icon">{icon}</span>
        <span className="menu-label">{label}</span>
        {badge}
      </NavLink>
    );
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

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

    const loadOpenTasksCount = async () => {
      try {
        const result = await caseTasksService.getTasksCount({
          status__in: 'PENDENTE,EM_ANDAMENTO',
        });
        setOpenTasksCount(Number(result?.count || 0));
      } catch {
        setOpenTasksCount(0);
      }
    };

    loadPendingCount();
    loadOpenTasksCount();

    const handlePublicationsSearchCompleted = () => {
      loadPendingCount();
    };

    const handleWindowFocus = () => {
      loadPendingCount();
      loadOpenTasksCount();
    };

    // Escutar eventos de integração para atualizar contador
    const unsubscribe = subscribePublicationSync((event) => {
      if (event.type === 'PUBLICATION_INTEGRATED') {
        loadPendingCount();
      }
    });

    const unsubscribeTasks = subscribeToTaskUpdates(() => {
      loadOpenTasksCount();
    });

    window.addEventListener('publicationsSearchCompleted', handlePublicationsSearchCompleted);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      unsubscribe();
      unsubscribeTasks();
      window.removeEventListener('publicationsSearchCompleted', handlePublicationsSearchCompleted);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated]);

  return (
    <>
      <nav className="app-menu">
        <ul className="menu-list">
        <li className="menu-item">
          {renderMenuLink({ to: '/', icon: '🏠', label: 'Dashboard' })}
        </li>
        <li className="menu-item">
          {renderMenuLink({ to: '/cases', icon: '⚖️', label: 'Processos' })}
        </li>

        <li className="menu-group-spacer" aria-hidden="true" />

        <li className="menu-item">
          {renderMenuLink({ to: '/publications', icon: '🔍', label: 'Buscar Publicações' })}
        </li>
        <li className="menu-item">
          {renderMenuLink({ to: '/search-history', icon: '📜', label: 'Histórico de Buscas' })}
        </li>
        <li className="menu-item">
          {renderMenuLink({ to: '/publications/all', icon: '📚', label: 'Todas Publicações' })}
        </li>
        <li className="menu-item">
          {renderMenuLink({
            to: '/publications/pending',
            icon: '⏳',
            label: 'Não Vinculadas',
            badge: isAuthenticated && pendingCount > 0 ? (
              <span className="menu-count-badge menu-count-badge--pending">{pendingCount}</span>
            ) : null,
          })}
        </li>

        <li className="menu-group-spacer menu-group-spacer-lg" aria-hidden="true" />

          <li className="menu-item">
            {renderMenuLink({
              to: '/deadlines',
              icon: '⏰',
              label: 'Tarefas Agendadas',
              badge: isAuthenticated && openTasksCount > 0 ? (
                <span className="menu-count-badge menu-count-badge--tasks">{openTasksCount}</span>
              ) : null,
            })}
          </li>

          <li className="menu-group-spacer menu-group-spacer-lg" aria-hidden="true" />

          <li className="menu-item">
            <button
              type="button"
              className="menu-action-button"
              onClick={() => {
                if (!isAuthenticated) {
                  onBlockedAction();
                  return;
                }
                setIsSettingsOpen(true);
              }}
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
