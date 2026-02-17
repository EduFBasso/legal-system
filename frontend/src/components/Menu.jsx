// src/components/Menu.jsx
import { NavLink } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import './Menu.css';

export default function Menu() {
  const { unreadCount } = useNotifications();
  
  return (
    <nav className="app-menu">
      <ul className="menu-list">
        <li className="menu-item">
          <NavLink to="/contacts" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="menu-icon">👥</span>
            <span className="menu-label">Contatos</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink to="/publications" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="menu-icon">📰</span>
            <span className="menu-label">Publicações</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink to="/notifications" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="menu-icon">🔔</span>
            <span className="menu-label">Notificações</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </NavLink>
        </li>
        <li className="menu-item">
          <a href="#cases">
            <span className="menu-icon">⚖️</span>
            <span className="menu-label">Processos</span>
          </a>
        </li>
        <li className="menu-item">
          <a href="#calendar">
            <span className="menu-icon">📅</span>
            <span className="menu-label">Agenda</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
