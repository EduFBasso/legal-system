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
        </PublicationsProvider>
      </NotificationsProvider>
    </BrowserRouter>
  );
}

export default App;
