/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getApiBaseUrl } from '../utils/apiFetch';

const API_BASE_URL = getApiBaseUrl();

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

function emitAuthChanged(authData) {
  window.dispatchEvent(new CustomEvent('auth:changed', {
    detail: {
      userId: authData?.user?.id ?? null,
      userEmail: authData?.user?.email ?? null,
      isAuthenticated: Boolean(authData?.access && authData?.user),
    },
  }));
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
    emitAuthChanged(auth);
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(LAWYERS_STORAGE_KEY, JSON.stringify(lawyers));
  }, [lawyers]);

  useEffect(() => {
    if (!selectedEmail && lawyers.length > 0) {
      setSelectedEmail(lawyers[0].email);
    }
  }, [lawyers, selectedEmail]);

  const fetchLawyers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/lawyers/`);
      if (!response.ok) return;
      const data = await response.json();
      const serverLawyers = Array.isArray(data?.results) ? data.results : [];
      setLawyers(normalizeLawyers(serverLawyers));
    } catch {
      // silêncio proposital: fallback para dados locais
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      fetchLawyers();
    }
  }, [fetchLawyers, isAuthenticated]);

  useEffect(() => {
    const onUnauthorized = () => {
      setAuth(null);
      setPassword('');
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async () => {
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

      const displayName = data.user?.first_name?.trim() || data.user?.username || selectedEmail;

      setAuth(nextAuth);
      setPassword('');
      setLawyers((prev) => mergeLawyers(prev, [{
        email: data.user?.email || selectedEmail,
        name: displayName,
        role: data.user?.role || 'ADVOGADO',
      }]));
      return true;
    } catch {
      setError('Não foi possível conectar ao servidor.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [password, selectedEmail]);

  const logout = useCallback(() => {
    setAuth(null);
    setPassword('');
    setError('');
  }, []);

  const updateAuthUser = useCallback((nextUser) => {
    if (!nextUser) return;

    setAuth((current) => {
      if (!current?.user) return current;
      return {
        ...current,
        user: {
          ...current.user,
          ...nextUser,
        },
      };
    });

    const userEmail = nextUser.email || auth?.user?.email;
    if (userEmail) {
      const displayName = nextUser.first_name?.trim() || nextUser.username || userEmail;
      setLawyers((prev) => mergeLawyers(prev, [{
        email: userEmail,
        name: displayName,
        role: nextUser.role || auth?.user?.role || 'ADVOGADO',
      }]));
    }
  }, [auth?.user?.email, auth?.user?.role]);

  const showNotLoggedMessage = useCallback(() => {
    window.alert('Você não está logado. Faça login para usar o sistema.');
  }, []);

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
    updateAuthUser,
    showNotLoggedMessage,
  }), [
    auth,
    error,
    fetchLawyers,
    isAuthenticated,
    isLoading,
    login,
    lawyers,
    logout,
    password,
    selectedEmail,
    showNotLoggedMessage,
    updateAuthUser,
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
