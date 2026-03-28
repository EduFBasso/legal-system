// src/components/Menu.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import caseTasksService from '../services/caseTasksService';
import contactTasksService from '../services/contactTasksService';
import { subscribeToTaskUpdates } from '../services/taskSyncService';
import SettingsModal from './SettingsModal';
import './Menu.css';

export default function Menu({ isAuthenticated, onBlockedAction }) {
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [openContactTasksCount, setOpenContactTasksCount] = useState(0);
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
    if (!isAuthenticated) return;

    const loadCounts = async () => {
      try {
        const [caseResult, contactResult] = await Promise.all([
          caseTasksService.getTasksCount({
            status__in: 'PENDENTE,EM_ANDAMENTO',
          }),
          contactTasksService.getTasksCount({
            status__in: 'PENDENTE,EM_ANDAMENTO',
          }),
        ]);

        setOpenTasksCount(Number(caseResult?.count || 0));
        setOpenContactTasksCount(Number(contactResult?.count || 0));
      } catch {
        setOpenTasksCount(0);
        setOpenContactTasksCount(0);
      }
    };

    loadCounts();

    const handleWindowFocus = () => {
      loadCounts();
    };

    const unsubscribeTasks = subscribeToTaskUpdates(() => {
      loadCounts();
    });

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      unsubscribeTasks();
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

        <li className="menu-group-spacer menu-group-spacer-lg" aria-hidden="true" />

        <li className="menu-item">
          {renderMenuLink({
            to: '/contact-tasks',
            icon: '👤',
            label: 'Tarefas de Pessoas',
            badge: isAuthenticated && openContactTasksCount > 0 ? (
              <span className="menu-count-badge menu-count-badge--tasks">{openContactTasksCount}</span>
            ) : null,
          })}
        </li>

          <li className="menu-item">
            {renderMenuLink({
              to: '/deadlines',
              icon: '⏰',
              label: 'Tarefas Processuais',
              badge: isAuthenticated && openTasksCount > 0 ? (
                <span className="menu-count-badge menu-count-badge--tasks">{openTasksCount}</span>
              ) : null,
            })}
          </li>

          <li className="menu-group-spacer menu-group-spacer-lg" aria-hidden="true" />

        <li className="menu-item">
          {renderMenuLink({ to: '/publications', icon: '🔍', label: 'Buscar Publicações' })}
        </li>
        <li className="menu-item">
          {renderMenuLink({ to: '/search-history', icon: '📜', label: 'Histórico de Buscas' })}
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
