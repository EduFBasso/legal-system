import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { PublicationsProvider } from './contexts/PublicationsContext';
import Header from './components/Header';
import Breadcrumb from './components/Breadcrumb';
import Menu from './components/Menu';
import MainContent from './components/MainContent';
import Sidebar from './components/Sidebar';
import ContactsPage from './pages/ContactsPage';
import PublicationsPage from './pages/PublicationsPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import SearchHistoryPage from './pages/SearchHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import PublicationsSummary from './components/PublicationsSummary';
import NotificationsSummary from './components/NotificationsSummary';
import './App.css';
import './styles/highlight.css'; // Sistema de destaque reutilizável

function App() {
  return (
    <BrowserRouter>
      <NotificationsProvider>
        <PublicationsProvider>
          <Routes>
            {/* Rota dedicada para detalhes de processo (full width, sem sidebar) */}
            <Route path="/cases/:id" element={<CaseDetailPage />} />

            {/* Rotas normais com layout padrão */}
            <Route path="/*" element={
              <div className="app-container">
                <Header />
                {/* <Breadcrumb /> */}
                
                <div className="app-layout">
                  <Menu />
                  
                  <MainContent>
                    <Routes>
                      <Route path="/" element={<ContactsPage />} />
                      <Route path="/contacts" element={<ContactsPage />} />
                      <Route path="/publications" element={<PublicationsPage />} />
                      <Route path="/cases" element={<CasesPage />} />
                      <Route path="/search-history" element={<SearchHistoryPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                    </Routes>
                  </MainContent>
              
              <Sidebar>
                <h2>Controles</h2>
                
                <div className="sidebar-section">
                  <h3>📰 Publicações</h3>
                  <PublicationsSummary />
                </div>
                
                <div className="sidebar-section">
                  <h3><BellRing size={18} style={{ display: 'inline', marginRight: '6px' }} /> Notificações</h3>
                  <NotificationsSummary />
                </div>
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
