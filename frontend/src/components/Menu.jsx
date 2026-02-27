// src/components/Menu.jsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import publicationsService from '../services/publicationsService';
import './Menu.css';

export default function Menu() {
  const [pendingCount, setPendingCount] = useState(0);

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
  }, []);
  
  return (
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
            <span className="menu-icon">📰</span>
            <span className="menu-label">Publicações</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink
            to="/search-history"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">📋</span>
            <span className="menu-label">Histórico</span>
          </NavLink>
        </li>
        <li className="menu-item">
          <NavLink
            to="/publications/pending"
            end
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <span className="menu-icon">⚠️</span>
            <span className="menu-label">Pendentes</span>
            {pendingCount > 0 && (
              <span className="notification-badge">{pendingCount}</span>
            )}
          </NavLink>
        </li>

        <li className="menu-group-spacer" aria-hidden="true" />

        <li className="menu-item">
          <a href="#deadlines">
            <span className="menu-icon">⏰</span>
            <span className="menu-label">Prazos</span>
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
