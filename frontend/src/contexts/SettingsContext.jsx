// src/contexts/SettingsContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const AUTH_STORAGE_KEY = 'legal_system_auth';

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getCurrentSettingsStorageKey() {
  const auth = safeJsonParse(localStorage.getItem(AUTH_STORAGE_KEY), null);
  const userKey = auth?.user?.id || auth?.user?.email || 'anonymous';
  return `legalSystemSettings:${userKey}`;
}

function getDefaultSettings() {
  return {};
}

function loadSettingsForCurrentUser() {
  // Legacy settings removed: always start from defaults and overwrite old storage.
  return getDefaultSettings();
}

export function SettingsProvider({ children }) {
  // Carrega configurações do localStorage ou usa padrões
  const [settings, setSettings] = useState(() => loadSettingsForCurrentUser());

  // Salva no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(getCurrentSettingsStorageKey(), JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleAuthChanged = () => {
      setSettings(loadSettingsForCurrentUser());
    };

    window.addEventListener('auth:changed', handleAuthChanged);

    return () => {
      window.removeEventListener('auth:changed', handleAuthChanged);
    };
  }, []);

  const updateSettings = async (newSettings) => {
    const nextSettings = {
      ...settings,
      ...newSettings,
    };

    setSettings(nextSettings);
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
