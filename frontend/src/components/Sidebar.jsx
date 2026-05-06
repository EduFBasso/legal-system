// src/components/Sidebar.jsx
import './Sidebar.css';

export default function Sidebar({ children, isCollapsed = false, onToggle }) {
  return (
    <div className={`right-sidebar-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
      <button
        type="button"
        className="right-sidebar-toggle"
        onClick={onToggle}
        aria-label={isCollapsed ? 'Exibir painel de controles' : 'Ocultar painel de controles'}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? 'Exibir painel' : 'Ocultar painel'}
      >
        {isCollapsed ? '◀' : '▶'}
      </button>

      <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`} aria-hidden={isCollapsed}>
        {!isCollapsed ? children : null}
      </aside>
    </div>
  );
}
