import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

const AUTH_STORAGE_KEY = 'legal_system_auth';
const LAWYERS_STORAGE_KEY = 'legal_system_known_lawyers';

const AuthContext = createContext(null);

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function loadStoredAuth() {
  return safeJsonParse(localStorage.getItem(AUTH_STORAGE_KEY), null);
}

function persistAuth(authData) {
  if (!authData) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

function mergeLawyers(existing, incoming) {
  const map = new Map();
  [...existing, ...incoming].forEach((lawyer) => {
    if (!lawyer?.email) return;
    map.set(lawyer.email.toLowerCase(), {
      email: lawyer.email,
      name: lawyer.name || lawyer.email,
      role: lawyer.role || 'ADVOGADO',
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeLawyers(incoming) {
  return mergeLawyers([], incoming);
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadStoredAuth());
  const [lawyers, setLawyers] = useState(() => {
    return safeJsonParse(localStorage.getItem(LAWYERS_STORAGE_KEY), []);
  });
  const [selectedEmail, setSelectedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticated = Boolean(auth?.access && auth?.user);

  useEffect(() => {
    persistAuth(auth);
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(LAWYERS_STORAGE_KEY, JSON.stringify(lawyers));
  }, [lawyers]);

  useEffect(() => {
    if (!selectedEmail && lawyers.length > 0) {
      setSelectedEmail(lawyers[0].email);
    }
  }, [lawyers, selectedEmail]);

  const fetchLawyers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/lawyers/`);
      if (!response.ok) return;
      const data = await response.json();
      const serverLawyers = Array.isArray(data?.results) ? data.results : [];
      setLawyers(normalizeLawyers(serverLawyers));
    } catch {
      // silêncio proposital: fallback para dados locais
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setAuth(null);
      setPassword('');
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = async () => {
    if (!selectedEmail || !password) {
      setError('Selecione a advogada e informe a senha.');
      return false;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = data?.detail || data?.non_field_errors?.[0] || 'Falha no login.';
        setError(detail);
        return false;
      }

      const nextAuth = {
        access: data.access,
        refresh: data.refresh,
        user: data.user,
      };

      const firstName = data.user?.first_name?.trim() || data.user?.username || selectedEmail;
      const labelName = `${firstName}${data.user?.oab_number ? ` ${data.user.oab_number}` : ''}`.trim();

      setAuth(nextAuth);
      setPassword('');
      setLawyers((prev) => mergeLawyers(prev, [{
        email: data.user?.email || selectedEmail,
        name: labelName,
        role: data.user?.role || 'ADVOGADO',
      }]));
      return true;
    } catch {
      setError('Não foi possível conectar ao servidor.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    setPassword('');
    setError('');
  };

  const showNotLoggedMessage = () => {
    window.alert('Você não está logado. Faça login para usar o sistema.');
  };

  const value = useMemo(() => ({
    auth,
    user: auth?.user || null,
    accessToken: auth?.access || null,
    refreshToken: auth?.refresh || null,
    isAuthenticated,
    lawyers,
    selectedEmail,
    setSelectedEmail,
    password,
    setPassword,
    isLoading,
    error,
    login,
    logout,
    fetchLawyers,
    showNotLoggedMessage,
  }), [
    auth,
    error,
    isAuthenticated,
    isLoading,
    lawyers,
    password,
    selectedEmail,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
