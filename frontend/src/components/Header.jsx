// src/components/Header.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import SettingsModal from './SettingsModal';
import './Header.css';

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const greeting = getGreeting();

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
          <span className="user-name">{greeting}, Dra Vitoria</span>
          <button className="btn-logout" title="Sair">
            🚪
          </button>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
