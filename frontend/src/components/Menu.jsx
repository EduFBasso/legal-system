// src/components/Menu.jsx
import './Menu.css';

export default function Menu() {
  return (
    <nav className="app-menu">
      <ul className="menu-list">
        <li className="menu-item active">
          <a href="#contacts">
            <span className="menu-icon">👥</span>
            <span className="menu-label">Contatos</span>
          </a>
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
        <li className="menu-item">
          <a href="#publications">
            <span className="menu-icon">📰</span>
            <span className="menu-label">Publicações</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
