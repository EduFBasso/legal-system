// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export default function Header() {
  const { unreadCount } = useNotifications();
  const {
    user,
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
    showNotLoggedMessage,
  } = useAuth();

  const getFirstName = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    return normalized.split(/\s+/)[0] || '';
  };

  const isMasterUser = user?.role === 'MASTER';
  const firstName = getFirstName(user?.first_name)
    || getFirstName(user?.full_name_oab)
    || getFirstName(user?.username)
    || 'Advogada';
  const oabLabel = user?.oab_number ? ` OAB ${user.oab_number}` : '';
  const displayName = `Olá, Dr(a) ${firstName}${oabLabel}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login();
  };

  return (
    <header className="app-header">
      <div className="header-logo">
        <h1>⚖️ Sistema Jurídico</h1>
        {isAuthenticated && !isMasterUser ? (
          <Link
            to="/notifications"
            className="btn-notifications"
            title="Notificações"
            aria-label="Notificações"
          >
            🔔
            {unreadCount > 0 && (
              <span className="header-badge">{unreadCount}</span>
            )}
          </Link>
        ) : !isAuthenticated ? (
          <button
            type="button"
            className="btn-notifications"
            title="Notificações"
            onClick={showNotLoggedMessage}
            aria-label="Notificações"
          >
            🔔
          </button>
        ) : null}
      </div>
      <div className="header-user">
        {isAuthenticated ? (
          <>
            {isMasterUser && (
              <span
                className="btn-notifications btn-master-panel btn-master-panel--static"
                title="Painel Administrativo"
                aria-label="Painel Administrativo Master"
              >
                🔑
              </span>
            )}
            <span className="user-name">{displayName}</span>

            <button type="button" className="btn-auth-action" onClick={logout}>
              Sair
            </button>
          </>
        ) : (
          <form className="header-login-form" onSubmit={handleSubmit}>
            <select
              className="header-login-select"
              value={selectedEmail}
              onChange={(event) => setSelectedEmail(event.target.value)}
              aria-label="Selecionar advogada"
            >
              {lawyers.length === 0 ? (
                <option value="">Sem advogadas cadastradas</option>
              ) : (
                lawyers.map((lawyer) => (
                  <option key={lawyer.email} value={lawyer.email}>
                    {lawyer.name}
                  </option>
                ))
              )}
            </select>

            <input
              className="header-login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Senha"
              aria-label="Senha"
            />

            <button type="submit" className="btn-auth-action" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>

            {error ? <span className="header-login-error">{error}</span> : null}
          </form>
        )}
      </div>
    </header>
  );
}
