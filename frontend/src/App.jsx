import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { PublicationsProvider } from './contexts/PublicationsContext';
import { initTaskSync, cleanupTaskSync } from './services/taskSyncService';
import taskSyncBroadcast from './services/taskSyncBroadcast';
import Header from './components/Header';
import Breadcrumb from './components/Breadcrumb';
import Menu from './components/Menu';
import MainContent from './components/MainContent';
import Sidebar from './components/Sidebar';
import ContactsPage from './pages/ContactsPage';
import PublicationsPage from './pages/PublicationsPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import PublicationDetailsPage from './pages/PublicationDetailsPage';
import SearchHistoryPage from './pages/SearchHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import DeadlinesPage from './pages/DeadlinesPage';
import ContactTasksPage from './pages/ContactTasksPage';
import MasterDashboardPage from './pages/MasterDashboardPage';
import PublicationsSummary from './components/PublicationsSummary';
import NotificationsSummary from './components/NotificationsSummary';
import { useAuth } from './contexts/AuthContext';
import './App.css';
import './styles/highlight.css'; // Sistema de destaque reutilizável

// Initialize at module level so all component subscriptions work on first mount
initTaskSync(taskSyncBroadcast);

function CaseDetailRouteElement() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>;
  }

  const isMasterUser = user?.role === 'MASTER';
  if (!isMasterUser) {
    return <CaseDetailPage />;
  }

  const sp = new URLSearchParams(location.search || '');
  const readonlyFlag = (sp.get('readonly') || '').trim().toLowerCase();
  const isReadOnly = readonlyFlag === '1' || readonlyFlag === 'true' || readonlyFlag === 'yes';
  const teamMemberId = (sp.get('team_member_id') || '').trim();

  if (isReadOnly && teamMemberId) {
    return <CaseDetailPage />;
  }

  return <Navigate to="/painel-master" replace />;
}

function App() {
  const { isAuthenticated, showNotLoggedMessage, user } = useAuth();
  const isMasterUser = user?.role === 'MASTER';

  useEffect(() => {
    return () => cleanupTaskSync();
  }, []);

  return (
    <BrowserRouter>
      <NotificationsProvider>
        <PublicationsProvider>
          <Routes>
            {/* Rotas dedicadas para processos (full width, sem sidebar) */}
            <Route
              path="/cases/new"
              element={isAuthenticated
                ? (isMasterUser ? <Navigate to="/painel-master" replace /> : <CaseDetailPage />)
                : <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>}
            />
            <Route
              path="/cases/:id"
              element={<CaseDetailRouteElement />}
            />

            {/* Rotas dedicadas para tarefas (full width, sem header/menu/sidebar) */}
            <Route
              path="/deadlines/standalone"
              element={isAuthenticated
                ? (isMasterUser ? <Navigate to="/painel-master" replace /> : <DeadlinesPage />)
                : <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>}
            />
            
            {/* Rota de detalhes de publicação em nova janela */}
            <Route
              path="/publications/:idApi/details"
              element={isAuthenticated
                ? (isMasterUser ? <Navigate to="/painel-master" replace /> : <PublicationDetailsPage />)
                : <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>}
            />

            {/* Painel administrativo Master (full width, sem sidebars) */}
            <Route
              path="/painel-master"
              element={isAuthenticated
                ? (user?.role === 'MASTER'
                    ? (
                      <div className="app-container">
                        <Header />
                        <MasterDashboardPage />
                      </div>
                    )
                    : <Navigate to="/" replace />)
                : <Navigate to="/" replace />}
            />

            {/* Rotas normais com layout padrão */}
            <Route path="/*" element={
              isAuthenticated && isMasterUser ? (
                <Navigate to="/painel-master" replace />
              ) : (
              <div className="app-container">
                <Header />
                {/* <Breadcrumb /> */}
                
                <div className="app-layout">
                  <Menu isAuthenticated={isAuthenticated} onBlockedAction={showNotLoggedMessage} />
                  
                  <MainContent>
                    {isAuthenticated ? (
                      <Routes>
                        <Route path="/" element={<ContactsPage />} />
                        <Route path="/contacts" element={<ContactsPage />} />
                        <Route path="/publications" element={<PublicationsPage />} />
                        <Route path="/publications/all" element={<Navigate to="/search-history" replace />} />
                        <Route path="/publications/pending" element={<Navigate to="/publications" replace />} />
                        <Route path="/cases" element={<CasesPage />} />
                        <Route path="/search-history" element={<SearchHistoryPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/deadlines" element={<DeadlinesPage />} />
                        <Route path="/contact-tasks" element={<ContactTasksPage />} />
                        <Route
                          path="/master"
                          element={user?.role === 'MASTER' ? <Navigate to="/painel-master" replace /> : <div className="not-logged-panel">Acesso restrito ao usuário Master.</div>}
                        />
                      </Routes>
                    ) : (
                      <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>
                    )}
                  </MainContent>
              
              <Sidebar>
                {isAuthenticated ? (
                  <>
                    <h2>Controles</h2>

                    <div className="sidebar-section">
                      <h3>📰 Publicações</h3>
                      <PublicationsSummary />
                    </div>

                    <div className="sidebar-section">
                      <h3 className="sidebar-section-title">
                        <BellRing size={18} className="sidebar-section-title-icon" />
                        <span>Notificações</span>
                      </h3>
                      <NotificationsSummary />
                    </div>
                  </>
                ) : (
                  <div className="not-logged-sidebar">Você não está logado. Os controles ficam disponíveis após o login.</div>
                )}
              </Sidebar>
            </div>
          </div>
            )} />
          </Routes>
        </PublicationsProvider>
      </NotificationsProvider>
    </BrowserRouter>
  );
}

export default App;
