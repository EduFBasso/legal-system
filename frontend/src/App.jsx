import Header from './components/Header'
import Breadcrumb from './components/Breadcrumb'
import Menu from './components/Menu'
import MainContent from './components/MainContent'
import Sidebar from './components/Sidebar'
import ContactsPage from './pages/ContactsPage'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Header />
      <Breadcrumb />
      
      <div className="app-layout">
        <Menu />
        
        <MainContent>
          <ContactsPage />
        </MainContent>
        
        <Sidebar>
          <h2>Controles</h2>
          
          <div className="sidebar-section">
            <h3>📰 Publicações</h3>
            <div className="sidebar-empty">
              <p>Ferramenta disponível em tools/pub_fetcher</p>
            </div>
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
  )
}

export default App
