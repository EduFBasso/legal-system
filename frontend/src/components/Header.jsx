// src/components/Header.jsx
import './Header.css';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-logo">
        <h1>⚖️ Sistema Jurídico</h1>
      </div>
      <div className="header-user">
        <span className="user-name">Advogada</span>
        <button className="btn-logout" title="Sair">
          🚪
        </button>
      </div>
    </header>
  );
}
