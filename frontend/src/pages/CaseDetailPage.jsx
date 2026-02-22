import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Trash2, Search, Users, Calendar, FileText, Plus } from 'lucide-react';
import casesService from '../services/casesService';
import Toast from '../components/common/Toast';
import PublicationCard from '../components/PublicationCard';
import './CaseDetailPage.css';

/**
 * CaseDetailPage - Página dedicada para detalhes completos do processo
 * 
 * Abre em nova aba do navegador, aproveitando toda largura da tela
 * sem sidebar. Permite edição inline de informações do processo.
 */
function CaseDetailPage() {
  const { id } = useParams();

  // State
  const [caseData, setCaseData] = useState(null);
  const [formData, setFormData] = useState({});
  const [publications, setPublications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('info'); // info, publications, deadlines, parties
  const [toast, setToast] = useState(null);

  // Tribunal options
  const tribunalOptions = [
    { value: 'TJSP', label: 'TJSP - Tribunal de Justiça de São Paulo' },
    { value: 'TJRJ', label: 'TJRJ - Tribunal de Justiça do Rio de Janeiro' },
    { value: 'TJMG', label: 'TJMG - Tribunal de Justiça de Minas Gerais' },
    { value: 'TRF1', label: 'TRF1 - Tribunal Regional Federal da 1ª Região' },
    { value: 'TRF2', label: 'TRF2 - Tribunal Regional Federal da 2ª Região' },
    { value: 'TRF3', label: 'TRF3 - Tribunal Regional Federal da 3ª Região' },
    { value: 'TRT2', label: 'TRT2 - Tribunal Regional do Trabalho da 2ª Região' },
    { value: 'TRT15', label: 'TRT15 - Tribunal Regional do Trabalho da 15ª Região' },
    { value: 'STJ', label: 'STJ - Superior Tribunal de Justiça' },
    { value: 'STF', label: 'STF - Supremo Tribunal Federal' },
    { value: 'TST', label: 'TST - Tribunal Superior do Trabalho' },
  ];

  // Status options
  const statusOptions = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'ARQUIVADO', label: 'Arquivado' },
    { value: 'ENCERRADO', label: 'Encerrado' },
  ];

  // Tipo de ação options
  const tipoAcaoOptions = [
    { value: '', label: 'Selecione...' },
    { value: 'CIVEL', label: 'Cível' },
    { value: 'CRIMINAL', label: 'Criminal' },
    { value: 'TRABALHISTA', label: 'Trabalhista' },
    { value: 'TRIBUTARIA', label: 'Tributária' },
    { value: 'FAMILIA', label: 'Família' },
    { value: 'CONSUMIDOR', label: 'Consumidor' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  /**
   * Show toast message
   */
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /**
   * Load case details
   */
  const loadCaseData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await casesService.getById(id);
      setCaseData(data);
      setFormData(data);

      // Load related publications
      if (data.numero_processo) {
        // TODO: Load publications filtered by numero_processo
        setPublications([]);
      }
    } catch (error) {
      console.error('Error loading case:', error);
      showToast('Erro ao carregar processo', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  // Atualizar título da aba do navegador
  useEffect(() => {
    if (caseData?.numero_processo) {
      document.title = `Proc.: ${caseData.numero_processo_formatted || caseData.numero_processo}`;
    }
    
    // Restaurar título original ao desmontar
    return () => {
      document.title = 'Sistema Jurídico';
    };
  }, [caseData]);

  /**
   * Handle input change
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Save changes
   */
  const handleSave = async () => {
    try {
      setSaving(true);

      // Clean empty values
      const cleanedData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      const updated = await casesService.update(id, cleanedData);
      setCaseData(updated);
      setFormData(updated);
      setIsEditing(false);
      showToast('Processo atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Error updating case:', error);
      showToast('Erro ao atualizar processo', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setFormData(caseData);
    setIsEditing(false);
  };

  /**
   * Delete case
   */
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este processo?')) return;

    try {
      await casesService.delete(id);
      showToast('Processo deletado com sucesso!', 'success');
      setTimeout(() => {
        window.close(); // Fecha a aba
      }, 1500);
    } catch (error) {
      console.error('Error deleting case:', error);
      showToast('Erro ao deletar processo', 'error');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  /**
   * Format currency
   */
  const formatCurrency = (value) => {
    if (!value) return '-';
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="case-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando processo...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="case-detail-page">
        <div className="error-container">
          <p>Processo não encontrado</p>
          <button onClick={() => window.close()}>Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="case-detail-page">
      {/* Navigation Bar - Fixo no topo */}
      <nav className="case-navbar">
        <div className="case-navbar-content">
          {/* Tabs */}
          <div className="case-navbar-tabs">
            <button
              className={`nav-tab ${activeSection === 'info' ? 'active' : ''}`}
              onClick={() => setActiveSection('info')}
            >
              Informações
            </button>
            <button
              className={`nav-tab ${activeSection === 'publications' ? 'active' : ''}`}
              onClick={() => setActiveSection('publications')}
            >
              Publicações
              {publications.length > 0 && <span className="badge">{publications.length}</span>}
            </button>
            <button
              className={`nav-tab ${activeSection === 'deadlines' ? 'active' : ''}`}
              onClick={() => setActiveSection('deadlines')}
            >
              Prazos
              <span className="badge-soon">Em breve</span>
            </button>
            <button
              className={`nav-tab ${activeSection === 'parties' ? 'active' : ''}`}
              onClick={() => setActiveSection('parties')}
            >
              Partes
              <span className="badge-soon">Em breve</span>
            </button>
          </div>

          {/* Search */}
          <div className="case-navbar-search-row">
            <div className="case-navbar-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar mais processos (número, nomes, partes ou contrapartes)"
                className="search-input"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="case-navbar-actions">
              {!isEditing ? (
                <>
                  <button className="btn btn-new" onClick={() => window.open('/cases/new', '_blank')}>
                    <Plus size={18} />
                    Novo
                  </button>
                  <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
                    <Edit2 size={18} />
                    Editar
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete}>
                    <Trash2 size={18} />
                    Apagar
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-success" onClick={handleSave} disabled={saving}>
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleCancel}>
                    <X size={18} />
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="case-content">
        {/* Informações Section */}
        {activeSection === 'info' && (
          <div className="case-section">
            {/* Cartão de Resumo - Destaque Principal */}
            <div className="case-summary-card">
              <div className="summary-main">
                <div className="process-number-highlight">
                  <span className="process-label">Processo Nº</span>
                  <div className="process-number-row">
                    <h2 className="process-number">{formData.numero_processo_formatted || formData.numero_processo}</h2>
                    {formData.tipo_acao && (
                      <span className="process-tipo-badge">
                        {formData.tipo_acao_display || formData.tipo_acao}
                      </span>
                    )}
                  </div>
                </div>
                <div className="summary-actions">
                  <span className={`info-badge status status-${formData.status?.toLowerCase()}`}>
                    {formData.status_display || formData.status}
                  </span>
                  <span className="info-badge tribunal">
                    {formData.tribunal_display || formData.tribunal}
                  </span>
                </div>
              </div>

              <div className="summary-grid">
                {/* Partes Envolvidas */}
                <div className="summary-section">
                  <h4><Users size={16} /> Partes Envolvidas</h4>
                  {formData.parte_contraria ? (
                    <p className="summary-value">Parte Contrária: <strong>{formData.parte_contraria}</strong></p>
                  ) : (
                    <p className="summary-value empty">Nenhuma parte cadastrada</p>
                  )}
                  <p className="summary-value empty" style={{fontSize: '0.8rem', marginTop: '0.5rem', fontStyle: 'italic'}}>
                    ℹ️ Use a aba "Partes" para gerenciar detalhadamente
                  </p>
                </div>

                {/* Datas e Prazos */}
                <div className="summary-section">
                  <h4><Calendar size={16} /> Datas e Prazos</h4>
                  <div className="summary-dates">
                    {formData.data_distribuicao && (
                      <p className="summary-value">Distribuição: <strong>{formatDate(formData.data_distribuicao)}</strong></p>
                    )}
                    {formData.data_ultima_movimentacao && (
                      <p className="summary-value">Última Movimentação: <strong>{formatDate(formData.data_ultima_movimentacao)}</strong></p>
                    )}
                    {formData.dias_sem_movimentacao !== null && formData.dias_sem_movimentacao !== undefined && (
                      <p className="summary-value highlight-days">
                        <strong>{formData.dias_sem_movimentacao}</strong> dias sem movimentação
                      </p>
                    )}
                  </div>
                </div>

                {/* Localização */}
                <div className="summary-section">
                  <h4>🏛️ Localização</h4>
                  {(formData.comarca || formData.vara) ? (
                    <>
                      {formData.comarca && <p className="summary-value">Comarca: <strong>{formData.comarca}</strong></p>}
                      {formData.vara && <p className="summary-value">Vara: <strong>{formData.vara}</strong></p>}
                    </>
                  ) : (
                    <p className="summary-value empty">Não informado</p>
                  )}
                </div>

                {/* Valor da Causa */}
                {formData.valor_causa && (
                  <div className="summary-section">
                    <h4>💰 Valor da Causa</h4>
                    <p className="summary-value valor">{formatCurrency(formData.valor_causa)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes Completos - Modo Edição */}
            <div className="section-card">
              <h2 className="section-title">
                {isEditing ? '✏️ Editando Informações' : '📋 Detalhes Completos'}
              </h2>
              
              <div className="info-grid">
                {/* Título */}
                <div className="info-field full-width">
                  <label>Título do Processo</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.titulo || ''}
                      onChange={(e) => handleInputChange('titulo', e.target.value)}
                      placeholder="Ex: Ação de Cobrança"
                    />
                  ) : (
                    <p className="info-value">{formData.titulo}</p>
                  )}
                </div>

                {/* Número do Processo */}
                {isEditing && (
                  <div className="info-field">
                    <label>Número do Processo (CNJ)</label>
                    <input
                      type="text"
                      value={formData.numero_processo || ''}
                      onChange={(e) => handleInputChange('numero_processo', e.target.value)}
                      placeholder="0000000-00.0000.0.00.0000"
                    />
                  </div>
                )}

                {/* Tribunal */}
                <div className="info-field">
                  <label>Tribunal</label>
                  {isEditing ? (
                    <select
                      value={formData.tribunal || ''}
                      onChange={(e) => handleInputChange('tribunal', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {tribunalOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="info-value">{formData.tribunal_display || formData.tribunal}</p>
                  )}
                </div>

                {/* Status */}
                <div className="info-field">
                  <label>Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status || 'ATIVO'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="info-value">{formData.status_display || formData.status}</p>
                  )}
                </div>

                {/* Tipo de Ação */}
                <div className="info-field">
                  <label>Tipo de Ação</label>
                  {isEditing ? (
                    <select
                      value={formData.tipo_acao || ''}
                      onChange={(e) => handleInputChange('tipo_acao', e.target.value)}
                    >
                      {tipoAcaoOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="info-value">{formData.tipo_acao_display || formData.tipo_acao || '-'}</p>
                  )}
                </div>

                {/* Comarca */}
                <div className="info-field">
                  <label>Comarca</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.comarca || ''}
                      onChange={(e) => handleInputChange('comarca', e.target.value)}
                      placeholder="Ex: São Paulo"
                    />
                  ) : (
                    <p className="info-value">{formData.comarca || '-'}</p>
                  )}
                </div>

                {/* Vara */}
                <div className="info-field">
                  <label>Vara</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.vara || ''}
                      onChange={(e) => handleInputChange('vara', e.target.value)}
                      placeholder="Ex: 1ª Vara Cível"
                    />
                  ) : (
                    <p className="info-value">{formData.vara || '-'}</p>
                  )}
                </div>

                {/* Data Distribuição */}
                <div className="info-field">
                  <label>Data de Distribuição</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.data_distribuicao || ''}
                      onChange={(e) => handleInputChange('data_distribuicao', e.target.value)}
                    />
                  ) : (
                    <p className="info-value">{formatDate(formData.data_distribuicao)}</p>
                  )}
                </div>

                {/* Data Última Movimentação */}
                <div className="info-field">
                  <label>Última Movimentação</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.data_ultima_movimentacao || ''}
                      onChange={(e) => handleInputChange('data_ultima_movimentacao', e.target.value)}
                    />
                  ) : (
                    <p className="info-value">{formatDate(formData.data_ultima_movimentacao)}</p>
                  )}
                </div>

                {/* Parte Contrária */}
                <div className="info-field">
                  <label>Parte Contrária (campo legado)</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.parte_contraria || ''}
                      onChange={(e) => handleInputChange('parte_contraria', e.target.value)}
                      placeholder="Nome da parte contrária"
                    />
                  ) : (
                    <p className="info-value">{formData.parte_contraria || '-'}</p>
                  )}
                </div>

                {/* Valor da Causa */}
                <div className="info-field">
                  <label>Valor da Causa</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_causa || ''}
                      onChange={(e) => handleInputChange('valor_causa', e.target.value)}
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="info-value">{formatCurrency(formData.valor_causa)}</p>
                  )}
                </div>

                {/* Observações - Full Width */}
                <div className="info-field full-width">
                  <label>Observações</label>
                  {isEditing ? (
                    <textarea
                      value={formData.observacoes || ''}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      rows="4"
                      placeholder="Observações sobre o processo..."
                    />
                  ) : (
                    <p className="info-value">{formData.observacoes || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Publicações Section */}
        {activeSection === 'publications' && (
          <div className="case-section">
            <div className="section-card">
              <h2 className="section-title">Publicações Relacionadas</h2>
              {publications.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} />
                  <p>Nenhuma publicação encontrada para este processo</p>
                  <p className="empty-state-hint">
                    Publicações serão exibidas aqui quando forem vinculadas ao número do processo
                  </p>
                </div>
              ) : (
                <div className="publications-list">
                  {publications.map(pub => (
                    <PublicationCard key={pub.id} publication={pub} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prazos Section - Coming Soon */}
        {activeSection === 'deadlines' && (
          <div className="case-section">
            <div className="section-card">
              <h2 className="section-title">Prazos</h2>
              <div className="empty-state">
                <Calendar size={48} />
                <p>Seção de Prazos</p>
                <p className="empty-state-hint">Em desenvolvimento</p>
              </div>
            </div>
          </div>
        )}

        {/* Partes Section - Coming Soon */}
        {activeSection === 'parties' && (
          <div className="case-section">
            <div className="section-card">
              <h2 className="section-title">Partes do Processo</h2>
              <div className="empty-state">
                <Users size={48} />
                <p>Seção de Partes</p>
                <p className="empty-state-hint">Em desenvolvimento</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          isOpen={true}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default CaseDetailPage;
