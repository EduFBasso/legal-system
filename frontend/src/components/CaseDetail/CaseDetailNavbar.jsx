/**
 * CaseDetailNavbar
 * Navbar de navegação de abas do CaseDetail.
 *
 * Componente puramente de UI: delega navegação para o callback onTabChange.
 */

import './CaseDetailNavbar.css';

export default function CaseDetailNavbar({
  activeSection,
  onTabChange,
  isInfoEditing = false,
  partiesCount = 0,
  activeLinkedTasksCount = 0,
  showPublicacoesTab = true,
  publicacoesCount = 0,
  activeStandaloneTasksCount = 0,
  linkedCasesCount = 0,
}) {
  return (
    <nav className="case-navbar">
      <div className="case-navbar-content">
        <div className="case-navbar-tabs">
          <button
            className={`nav-tab ${activeSection === 'info' ? 'active' : ''}`}
            onClick={() => onTabChange('info')}
          >
            📋 Informações{isInfoEditing && activeSection === 'info' && ' *'}
          </button>

          <button
            className={`nav-tab ${activeSection === 'parties' ? 'active' : ''}`}
            onClick={() => onTabChange('parties')}
          >
            👥 Partes
            {partiesCount > 0 && <span className="badge">{partiesCount}</span>}
          </button>

          <button
            className={`nav-tab ${activeSection === 'movimentacoes' ? 'active' : ''}`}
            onClick={() => onTabChange('movimentacoes')}
          >
            ⚖️ Movimentações
            {activeLinkedTasksCount > 0 && <span className="badge">{activeLinkedTasksCount}</span>}
          </button>

          <button
            className={`nav-tab ${activeSection === 'documentos' ? 'active' : ''}`}
            onClick={() => onTabChange('documentos')}
          >
            📄 Documentos
          </button>

          {showPublicacoesTab && (
            <button
              className={`nav-tab ${activeSection === 'publicacoes' ? 'active' : ''}`}
              onClick={() => onTabChange('publicacoes')}
            >
              📰 Publicações
              {publicacoesCount > 0 && <span className="badge">{publicacoesCount}</span>}
            </button>
          )}

          <button
            className={`nav-tab ${activeSection === 'tasks' ? 'active' : ''}`}
            onClick={() => onTabChange('tasks')}
          >
            ✅ Tarefas
            {activeStandaloneTasksCount > 0 && <span className="badge">{activeStandaloneTasksCount}</span>}
          </button>

          <button
            className={`nav-tab ${activeSection === 'financeiro' ? 'active' : ''}`}
            onClick={() => onTabChange('financeiro')}
          >
            💰 Financeiro
          </button>

          <button
            className={`nav-tab ${activeSection === 'vinculos' ? 'active' : ''}`}
            onClick={() => onTabChange('vinculos')}
            title="Vínculos por contato e por processo"
          >
            🔗 Vínculos
            {linkedCasesCount > 0 && <span className="badge">{linkedCasesCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}
