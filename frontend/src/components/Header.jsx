// src/components/Header.jsx
import { useState } from 'react';
import SettingsModal from './SettingsModal';
import './Header.css';

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="header-logo">
          <h1>⚖️ Sistema Jurídico</h1>
        </div>
        <div className="header-user">
          <button 
            className="btn-settings" 
            onClick={() => setIsSettingsOpen(true)}
            title="Configurações"
          >
            ⚙️
          </button>
          <span className="user-name">Advogada</span>
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
