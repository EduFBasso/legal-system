// src/contexts/SettingsContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  // Carrega configurações do localStorage ou usa padrões
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('legalSystemSettings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }
    // Padrão: só mostra campos preenchidos (visual limpo)
    return {
      showEmptyFields: false,
      deletePassword: '',
    };
  });

  // Salva no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('legalSystemSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
