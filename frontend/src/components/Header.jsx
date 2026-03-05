// src/components/Header.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import SettingsModal from './SettingsModal';
import './Header.css';

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <>
      <header className="app-header">
        <div className="header-logo">
          <h1>⚖️ Sistema Jurídico</h1>
        </div>
        <div className="header-user">
          <Link
            to="/notifications"
            className="btn-notifications"
            title="Notificações"
          >
            🔔
            {unreadCount > 0 && (
              <span className="header-badge">{unreadCount}</span>
            )}
          </Link>
          <button 
            className="btn-settings" 
            onClick={() => setIsSettingsOpen(true)}
            title="Configurações"
          >
            ⚙️
          </button>
          <span className="user-name">Olá, Dra Vitoria</span>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}
