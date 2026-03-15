import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import AllPublicationsPage from './pages/AllPublicationsPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import PublicationDetailsPage from './pages/PublicationDetailsPage';
import SearchHistoryPage from './pages/SearchHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import PendingPublicationsPage from './pages/PendingPublicationsPage';
import DeadlinesPage from './pages/DeadlinesPage';
import MasterPage from './pages/MasterPage';
import MasterDashboardPage from './pages/MasterDashboardPage';
import PublicationsSummary from './components/PublicationsSummary';
import NotificationsSummary from './components/NotificationsSummary';
import { useAuth } from './contexts/AuthContext';
import './App.css';
import './styles/highlight.css'; // Sistema de destaque reutilizável

function App() {
  const { isAuthenticated, showNotLoggedMessage, user } = useAuth();

  // Initialize task synchronization across tabs
  useEffect(() => {
    initTaskSync(taskSyncBroadcast);
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
              element={isAuthenticated ? <CaseDetailPage /> : <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>}
            />
            <Route
              path="/cases/:id"
              element={isAuthenticated ? <CaseDetailPage /> : <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>}
            />
            
            {/* Rota de detalhes de publicação em nova janela */}
            <Route
              path="/publications/:idApi/details"
              element={isAuthenticated ? <PublicationDetailsPage /> : <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>}
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
                    : <div className="not-logged-panel">Acesso restrito ao usuário Master.</div>)
                : <div className="not-logged-panel">Você não está logado. Faça login para usar o sistema.</div>}
            />

            {/* Rotas normais com layout padrão */}
            <Route path="/*" element={
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
                        <Route path="/publications/all" element={<AllPublicationsPage />} />
                        <Route path="/publications/pending" element={<PendingPublicationsPage />} />
                        <Route path="/cases" element={<CasesPage />} />
                        <Route path="/search-history" element={<SearchHistoryPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/deadlines" element={<DeadlinesPage />} />
                        <Route
                          path="/master"
                          element={user?.role === 'MASTER' ? <MasterPage /> : <div className="not-logged-panel">Acesso restrito ao usuário Master.</div>}
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
            } />
          </Routes>
        </PublicationsProvider>
      </NotificationsProvider>
    </BrowserRouter>
  );
}

export default App;
