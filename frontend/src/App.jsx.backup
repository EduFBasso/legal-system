import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { NotificationsProvider } from './contexts/NotificationsContext'
import Header from './components/Header'
import Breadcrumb from './components/Breadcrumb'
import Menu from './components/Menu'
import MainContent from './components/MainContent'
import Sidebar from './components/Sidebar'
import ContactsPage from './pages/ContactsPage'
import PublicationsPage from './pages/PublicationsPage'
import NotificationsPage from './pages/NotificationsPage'
import PublicationsSummary from './components/PublicationsSummary'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <NotificationsProvider>
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
                <h3>💬 Mensagens</h3>
                <div className="sidebar-empty">
                  <p>Em desenvolvimento</p>
                </div>
              </div>
            </Sidebar>
          </div>
        </div>
      </NotificationsProvider>
    </BrowserRouter>
  )
}

export default App
