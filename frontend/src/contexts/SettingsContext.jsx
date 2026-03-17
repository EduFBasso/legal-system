// src/contexts/SettingsContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import userPreferencesService from '../services/userPreferencesService';

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
  return {
    showEmptyFields: false,
    deletePassword: '',
    retroactiveDays: 7,
    autoIntegration: false,
    showNotificationTestButtons: false,
  };
}

function loadSettingsForCurrentUser() {
  const savedSettings = localStorage.getItem(getCurrentSettingsStorageKey());
  if (savedSettings) {
    return safeJsonParse(savedSettings, getDefaultSettings());
  }
  return getDefaultSettings();
}

function isAuthenticatedUser() {
  const auth = safeJsonParse(localStorage.getItem(AUTH_STORAGE_KEY), null);
  return Boolean(auth?.access && auth?.user);
}

export function SettingsProvider({ children }) {
  // Carrega configurações do localStorage ou usa padrões
  const [settings, setSettings] = useState(() => loadSettingsForCurrentUser());

  // Salva no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem(getCurrentSettingsStorageKey(), JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let cancelled = false;

    const syncPreferencesFromServer = async () => {
      if (!isAuthenticatedUser()) return;
      try {
        const preferences = await userPreferencesService.getUserPreferences();
        if (cancelled) return;
        setSettings((prev) => ({
          ...prev,
          autoIntegration: Boolean(preferences?.publication_auto_integration),
        }));
      } catch {
        // fallback silencioso para localStorage
      }
    };

    const handleAuthChanged = () => {
      setSettings(loadSettingsForCurrentUser());
      syncPreferencesFromServer();
    };

    window.addEventListener('auth:changed', handleAuthChanged);

    syncPreferencesFromServer();

    return () => {
      cancelled = true;
      window.removeEventListener('auth:changed', handleAuthChanged);
    };
  }, []);

  const updateSettings = async (newSettings) => {
    const nextSettings = {
      ...settings,
      ...newSettings,
    };

    setSettings(nextSettings);

    if (!isAuthenticatedUser() || !Object.prototype.hasOwnProperty.call(newSettings, 'autoIntegration')) {
      return;
    }

    try {
      await userPreferencesService.updateUserPreferences({
        publication_auto_integration: Boolean(nextSettings.autoIntegration),
      });
    } catch {
      // fallback silencioso: mantém localStorage mesmo se a persistência remota falhar
    }
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
