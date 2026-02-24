import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Trash2, Search, Users, Calendar, FileText, Plus, UserPlus, RefreshCw, ExternalLink } from 'lucide-react';
import casesService from '../services/casesService';
import contactsService from '../services/contactsService';
import casePartiesService from '../services/casePartiesService';
import caseMovementsService from '../services/caseMovementsService';
import Toast from '../components/common/Toast';
import PublicationCard from '../components/PublicationCard';
import ContactDetailModal from '../components/ContactDetailModal';
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
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isEditing, setIsEditing] = useState(!id); // New case = editing mode
  const [loading, setLoading] = useState(!!id); // Only load if has id
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('info'); // info, parties, movimentacoes, documentos, deadlines
  const [toast, setToast] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Parties state
  const [parties, setParties] = useState([]);
  const [loadingParties, setLoadingParties] = useState(false);
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [partyFormData, setPartyFormData] = useState({
    role: 'AUTOR',
    is_client: false,
    observacoes: '',
  });

  // Movimentações state
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [movimentacaoFormData, setMovimentacaoFormData] = useState({
    data: '',
    tipo: 'DESPACHO',
    titulo: '',
    descricao: '',
    prazo: '',
  });
  const [savingMovimentacao, setSavingMovimentacao] = useState(false);

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
    // Skip loading if creating new case
    if (!id) {
      setLoading(false);
      return;
    }

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
    } else if (!id) {
      document.title = 'Novo Processo - Sistema Jurídico';
    }
    
    // Restaurar título original ao desmontar
    return () => {
      document.title = 'Sistema Jurídico';
    };
  }, [caseData, id]);

  // Carregar contatos quando entrar em modo de edição
  const loadContacts = useCallback(async () => {
    try {
      const data = await contactsService.getAllContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      showToast('Erro ao carregar contatos', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (isEditing && contacts.length === 0) {
      loadContacts();
    }
  }, [isEditing, contacts.length, loadContacts]);

  /**
   * Handle contact created - reload contacts and select the new one
   */
  const handleContactCreated = async (savedContact, isCreating) => {
    await loadContacts();
    
    // Only close modal if NOT in parties context
    // In parties context, onLinkToProcess will handle the flow
    if (activeSection !== 'parties') {
      setShowContactModal(false);
      showToast('Cliente criado com sucesso!', 'success');
    }
  };

  /**
   * Handle linking newly created contact to this process
   */
  const handleLinkToProcess = (contact) => {
    setFormData(prev => ({
      ...prev,
      cliente_principal: contact.id
    }));
    setShowContactModal(false);
    showToast(`Cliente "${contact.name}" vinculado ao processo!`, 'success');
    // Reload contacts to ensure dropdown is up to date
    loadContacts();
  };

  /**
   * Load parties for this case
   */
  const loadParties = useCallback(async () => {
    if (!id) return;
    
    setLoadingParties(true);
    try {
      const data = await casePartiesService.getPartiesByCase(id);
      setParties(data);
    } catch (error) {
      console.error('Error loading parties:', error);
      showToast('Erro ao carregar partes do processo', 'error');
    } finally {
      setLoadingParties(false);
    }
  }, [id, showToast]);

  /**
   * Load movimentacoes for this case
   */
  const loadMovimentacoes = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await caseMovementsService.getMovementsByCase(id);
      setMovimentacoes(data);
    } catch (error) {
      console.error('Error loading movimentacoes:', error);
      showToast('Erro ao carregar movimentações', 'error');
    }
  }, [id, showToast]);

  useEffect(() => {
    if (id) {
      loadMovimentacoes();
    }
  }, [id, loadMovimentacoes]);

  /**
   * Load parties on mount for summary display
   */
  useEffect(() => {
    loadParties();
  }, [loadParties]);

  /**
   * Load parties when entering parties section (if not already loaded)
   */
  useEffect(() => {
    // Reload parties when switching to parties tab (in case data was updated elsewhere)
    if (activeSection === 'parties') {
      loadParties();
    }
  }, [activeSection, loadParties]);

  /**
   * Handle add party - select contact and show form
   */
  const handleSelectContactForParty = (contact) => {
    setSelectedContact(contact);
    setShowContactModal(false);
    setShowAddPartyModal(true);
  };

  /**
   * Handle save party (create CaseParty)
   */
  const handleSaveParty = async () => {
    if (!selectedContact) {
      showToast('Selecione um contato primeiro', 'error');
      return;
    }

    try {
      await casePartiesService.createParty({
        case: parseInt(id),
        contact: selectedContact.id,
        role: partyFormData.role,
        is_client: partyFormData.is_client,
        observacoes: partyFormData.observacoes,
      });

      showToast('Parte adicionada com sucesso!', 'success');
      setShowAddPartyModal(false);
      setSelectedContact(null);
      setPartyFormData({
        role: 'AUTOR',
        is_client: false,
        observacoes: '',
      });
      loadParties();
    } catch (error) {
      console.error('Error saving party:', error);
      showToast('Erro ao adicionar parte', 'error');
    }
  };

  /**
   * Handle remove party
   */
  const handleRemoveParty = async (partyId, partyName) => {
    if (!window.confirm(`Remover ${partyName} deste processo?`)) return;

    try {
      await casePartiesService.deleteParty(partyId);
      showToast('Parte removida do processo', 'success');
      loadParties();
    } catch (error) {
      console.error('Error removing party:', error);
      showToast('Erro ao remover parte', 'error');
    }
  };

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
   * Open modal to add new movimentacao
   */
  const handleOpenMovimentacaoModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setMovimentacaoFormData({
      data: today,
      tipo: 'DESPACHO',
      titulo: '',
      descricao: '',
      prazo: '',
    });
    setShowMovimentacaoModal(true);
  };

  /**
   * Save movimentacao
   */
  const handleSaveMovimentacao = async () => {
    if (!movimentacaoFormData.data || !movimentacaoFormData.titulo) {
      showToast('Preencha data e título da movimentação', 'error');
      return;
    }

    setSavingMovimentacao(true);
    try {
      const dataToSave = {
        case: parseInt(id),
        data: movimentacaoFormData.data,
        tipo: movimentacaoFormData.tipo,
        titulo: movimentacaoFormData.titulo,
        descricao: movimentacaoFormData.descricao || '',
        prazo: movimentacaoFormData.prazo ? parseInt(movimentacaoFormData.prazo) : null,
        origem: 'MANUAL',
      };

      await caseMovementsService.createMovement(dataToSave);
      
      showToast('Movimentação cadastrada com sucesso!', 'success');
      
      // Reload movimentacoes and case data (to update resumo)
      await loadMovimentacoes();
      await loadCaseData();
      
      setShowMovimentacaoModal(false);
    } catch (error) {
      console.error('Error saving movimentacao:', error);
      showToast('Erro ao salvar movimentação', 'error');
    } finally {
      setSavingMovimentacao(false);
    }
  };

  /**
   * Close movimentacao modal
   */
  const handleCloseMovimentacaoModal = () => {
    setShowMovimentacaoModal(false);
    setMovimentacaoFormData({
      data: '',
      tipo: 'DESPACHO',
      titulo: '',
      descricao: '',
      prazo: '',
    });
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
              📋 Informações
            </button>
            <button
              className={`nav-tab ${activeSection === 'parties' ? 'active' : ''}`}
              onClick={() => setActiveSection('parties')}
            >
              👥 Partes
              {parties.length > 0 && <span className="badge">{parties.length}</span>}
            </button>
            <button
              className={`nav-tab ${activeSection === 'movimentacoes' ? 'active' : ''}`}
              onClick={() => setActiveSection('movimentacoes')}
            >
              ⚖️ Movimentações
              {movimentacoes.length > 0 && <span className="badge">{movimentacoes.length}</span>}
            </button>
            <button
              className={`nav-tab ${activeSection === 'documentos' ? 'active' : ''}`}
              onClick={() => setActiveSection('documentos')}
            >
              📄 Documentos
              {documentos.length > 0 && <span className="badge">{documentos.length}</span>}
            </button>
            <button
              className={`nav-tab ${activeSection === 'deadlines' ? 'active' : ''}`}
              onClick={() => setActiveSection('deadlines')}
            >
              ⏰ Prazos
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
                  <button className="btn case-btn-edit" onClick={() => {
                    setActiveSection('info');
                    setIsEditing(true);
                  }}>
                    <Edit2 size={18} />
                    Editar
                  </button>
                  <button className="btn btn-danger" onClick={() => {
                    setActiveSection('info');
                    handleDelete();
                  }}>
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
                  <div className="process-number-row">
                    <div className="process-number-group">
                      <span className="process-label">Processo Nº</span>
                      <h2 className="process-number">{formData.numero_processo_formatted || formData.numero_processo}</h2>
                    </div>
                    {formData.tipo_acao && (
                      <div className="process-tipo-group">
                        <span className="process-tipo-label">Tipo de Processo</span>
                        <span className="process-tipo-badge">
                          {formData.tipo_acao_display || formData.tipo_acao}
                        </span>
                      </div>
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
                  {parties.length > 0 ? (
                    <>
                      {/* Nossos clientes */}
                      {parties.filter(p => p.is_client).length > 0 && (
                        <div style={{marginBottom: '0.75rem'}}>
                          <p className="summary-value" style={{fontSize: '0.95rem', color: '#059669', fontWeight: '600', marginBottom: '0.25rem'}}>
                            Nossos Clientes:
                          </p>
                          {parties.filter(p => p.is_client).map(party => (
                            <p key={party.id} className="summary-value" style={{marginLeft: '0.5rem', fontSize: '1rem', marginTop: '0.25rem'}}>
                              <Link 
                                to={`/contacts?open=${party.contact}`}
                                className="party-contact-link"
                                title="Ver detalhes do contato (abre em nova aba)"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <strong>{party.contact_name}</strong> ↗
                              </Link>
                              {' '}({party.role_display})
                            </p>
                          ))}
                        </div>
                      )}
                      {/* Parte contrária */}
                      {parties.filter(p => !p.is_client).length > 0 && (
                        <div>
                          <p className="summary-value" style={{fontSize: '0.95rem', color: '#9ca3af', fontWeight: '600', marginBottom: '0.25rem'}}>
                            Outras Partes:
                          </p>
                          {parties.filter(p => !p.is_client).map(party => (
                            <p key={party.id} className="summary-value" style={{marginLeft: '0.5rem', fontSize: '1rem', marginTop: '0.25rem'}}>
                              <strong>{party.contact_name}</strong> ({party.role_display})
                            </p>
                          ))}
                        </div>
                      )}
                    </>
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
                      <div className="summary-value">
                        <p style={{marginBottom: '0.25rem'}}>
                          Última Movimentação: <strong>{formatDate(formData.data_ultima_movimentacao)}</strong>
                        </p>
                        {formData.ultima_movimentacao_resumo && (
                          <p style={{fontSize: '0.85rem', color: '#6b7280', marginLeft: '0.5rem'}}>
                            {formData.ultima_movimentacao_resumo}
                          </p>
                        )}
                      </div>
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

                {/* Data Última Movimentação - Calculado Automaticamente */}
                <div className="info-field">
                  <label>Última Movimentação</label>
                  {formData.data_ultima_movimentacao ? (
                    <div>
                      <p className="info-value" style={{marginBottom: '0.25rem'}}>
                        <strong>{formatDate(formData.data_ultima_movimentacao)}</strong>
                      </p>
                      {formData.ultima_movimentacao_resumo && (
                        <p style={{fontSize: '0.9rem', color: '#6b7280'}}>
                          {formData.ultima_movimentacao_resumo}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="info-value">
                      <span style={{color: '#9ca3af', fontStyle: 'italic'}}>
                        Nenhuma movimentação cadastrada
                      </span>
                    </p>
                  )}
                  {isEditing && (
                    <small style={{display: 'block', color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem'}}>
                      ℹ️ Atualizado automaticamente pela aba Movimentações
                    </small>
                  )}
                </div>

                {/* Nosso Cliente */}
                <div className="info-field">
                  <label>Nosso Cliente Neste Processo</label>
                  {isEditing ? (
                    <>
                      <div className="field-with-actions">
                        <select
                          value={formData.cliente_principal || ''}
                          onChange={(e) => handleInputChange('cliente_principal', e.target.value)}
                        >
                          <option value="">Nenhum cliente vinculado</option>
                          {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name} {contact.document_number ? `(${contact.document_number})` : ''}
                            </option>
                          ))}
                        </select>
                        <button 
                          type="button"
                          className="btn-icon-action"
                          onClick={() => loadContacts()}
                          title="Atualizar lista de contatos"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          type="button"
                          className="btn-icon-action btn-icon-primary"
                          onClick={() => window.open('/contacts', '_blank')}
                          title="Buscar/Editar contatos em nova aba"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button 
                          type="button"
                          className="btn-text-action"
                          onClick={() => setShowContactModal(true)}
                          title="Cadastrar novo cliente"
                        >
                          <UserPlus size={16} />
                          Novo
                        </button>
                      </div>
                      <span className="field-hint">
                        💡 Após editar em Contatos, clique em 🔄 para atualizar a lista
                      </span>
                    </>
                  ) : (
                    <p className="info-value">{formData.cliente_nome || '-'}</p>
                  )}
                </div>

                {/* Posição do Cliente */}
                <div className="info-field">
                  <label>Posição do Cliente no Processo</label>
                  {isEditing ? (
                    <select
                      value={formData.cliente_posicao || ''}
                      onChange={(e) => handleInputChange('cliente_posicao', e.target.value)}
                      disabled={!formData.cliente_principal}
                    >
                      <option value="">Selecione...</option>
                      <option value="AUTOR">Autor/Requerente</option>
                      <option value="REU">Réu/Requerido</option>
                    </select>
                  ) : (
                    <p className="info-value">{formData.cliente_posicao_display || '-'}</p>
                  )}
                  {isEditing && !formData.cliente_principal && (
                    <span className="field-hint">⚠️ Selecione um cliente primeiro</span>
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

        {/* Movimentações Section */}
        {activeSection === 'movimentacoes' && (
          <div className="case-section">
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">⚖️ Movimentações Processuais</h2>
                  <p className="section-subtitle">Publicações do DJE, despachos, decisões e movimentações do tribunal</p>
                </div>
                {id && (
                  <button className="btn btn-primary" onClick={handleOpenMovimentacaoModal}>
                    <Plus size={18} /> Nova Movimentação
                  </button>
                )}
              </div>
              
              {movimentacoes.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} style={{ opacity: 0.3 }} />
                  <p>Nenhuma movimentação cadastrada</p>
                  <p className="empty-state-hint">
                    Clique em "Nova Movimentação" para adicionar despachos, decisões, audiências, etc.
                  </p>
                </div>
              ) : (
                <div className="movimentacoes-timeline">
                  {movimentacoes.map(mov => (
                    <div key={mov.id} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-date">{formatDate(mov.data)}</div>
                      <div className="timeline-content">
                        <div className="timeline-tipo">{mov.tipo_display || mov.tipo}</div>
                        <div className="timeline-titulo">{mov.titulo}</div>
                        {mov.descricao && (
                          <div className="timeline-descricao">{mov.descricao}</div>
                        )}
                        {mov.prazo && (
                          <div className="timeline-prazo">
                            ⏰ Prazo: {mov.prazo} dias (até {formatDate(mov.data_limite_prazo)})
                          </div>
                        )}
                        <div className="timeline-meta">
                          <span className="timeline-origem">{mov.origem_display}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documentos Section */}
        {activeSection === 'documentos' && (
          <div className="case-section">
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">📄 Documentos do Processo</h2>
                  <p className="section-subtitle">Petições, sentenças, contratos e outros documentos</p>
                </div>
                <button className="btn btn-primary">
                  <Plus size={18} />
                  Upload Documento
                </button>
              </div>
              
              {documentos.length === 0 ? (
                <div className="empty-state">
                  <FileText size={48} style={{ opacity: 0.3 }} />
                  <p>Nenhum documento anexado</p>
                  <p className="empty-state-hint">
                    Faça upload de petições, sentenças, contratos e outros documentos relacionados ao processo
                  </p>
                </div>
              ) : (
                <div className="documentos-grid">
                  {documentos.map(doc => (
                    <div key={doc.id} className="documento-card">
                      <div className="documento-icon">
                        {doc.tipo === 'pdf' ? '📕' : doc.tipo === 'doc' ? '📘' : '📄'}
                      </div>
                      <div className="documento-info">
                        <div className="documento-nome">{doc.nome}</div>
                        <div className="documento-meta">
                          {doc.tipo_documento && <span className="doc-tipo">{doc.tipo_documento}</span>}
                          <span className="doc-data">{doc.data_upload}</span>
                          {doc.tamanho && <span className="doc-tamanho">{(doc.tamanho / 1024).toFixed(0)} KB</span>}
                        </div>
                      </div>
                      <div className="documento-actions">
                        <button className="btn-icon-small" title="Baixar">⬇️</button>
                        <button className="btn-icon-small" title="Excluir">🗑️</button>
                      </div>
                    </div>
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

        {/* Partes Section */}
        {activeSection === 'parties' && (
          <div className="case-section">
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">Partes do Processo</h2>
                <button 
                  className="btn btn-success"
                  onClick={() => setShowContactModal(true)}
                >
                  <UserPlus size={18} />
                  Adicionar Parte
                </button>
              </div>

              {loadingParties ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Carregando partes...</p>
                </div>
              ) : parties.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} />
                  <p>Nenhuma parte cadastrada</p>
                  <p className="empty-state-hint">
                    Clique em "Adicionar Parte" para vincular pessoas a este processo
                  </p>
                </div>
              ) : (
                <div className="parties-list">
                  {parties.map(party => (
                    <div key={party.id} className="party-card">
                      <div className="party-info">
                        <div className="party-header">
                          <span className="party-icon">
                            {party.contact_person_type === 'PF' ? '👤' : '🏢'}
                          </span>
                          <div className="party-details">
                            <h3 className="party-name">{party.contact_name}</h3>
                            <span className={`party-role-badge role-${party.role.toLowerCase()}`}>
                              {party.role_display}
                            </span>
                            {party.is_client && (
                              <span className="client-badge">✅ Cliente</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="party-contact-info">
                          {party.contact_document && (
                            <span className="party-detail">
                              📄 {party.contact_document}
                            </span>
                          )}
                          {party.contact_phone && (
                            <span className="party-detail">
                              📱 {party.contact_phone}
                            </span>
                          )}
                          {party.contact_email && (
                            <span className="party-detail">
                              ✉️ {party.contact_email}
                            </span>
                          )}
                        </div>

                        {party.observacoes && (
                          <div className="party-notes">
                            <strong>Observações:</strong> {party.observacoes}
                          </div>
                        )}
                      </div>

                      <button 
                        className="btn-remove-party"
                        onClick={() => handleRemoveParty(party.id, party.contact_name)}
                        title="Remover do processo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Modal de Novo Cliente/Parte */}
      {showContactModal && (
        <ContactDetailModal
          contactId={null}
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onContactUpdated={handleContactCreated}
          showLinkToProcessButton={activeSection !== 'parties'}
          onLinkToProcess={activeSection === 'parties' ? handleSelectContactForParty : handleLinkToProcess}
        />
      )}

      {/* Modal de Definir Papel da Parte */}
      {showAddPartyModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowAddPartyModal(false)}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar ao Processo</h2>
              <button className="modal-close" onClick={() => setShowAddPartyModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="selected-contact-info">
                <span className="contact-icon">
                  {selectedContact.person_type === 'PF' ? '👤' : '🏢'}
                </span>
                <div>
                  <strong>{selectedContact.name}</strong>
                  {selectedContact.document_number && (
                    <span className="contact-doc"> • {selectedContact.document_number}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Papel no Processo *</label>
                <select
                  value={partyFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setPartyFormData(prev => ({
                      ...prev,
                      role: newRole,
                      // Auto-set is_client based on role
                      is_client: newRole === 'CLIENTE' ? true : 
                                 (newRole === 'TESTEMUNHA' || newRole === 'PERITO') ? false : 
                                 prev.is_client
                    }));
                  }}
                >
                  <option value="AUTOR">Autor/Requerente</option>
                  <option value="REU">Réu/Requerido</option>
                  <option value="TESTEMUNHA">Testemunha</option>
                  <option value="PERITO">Perito</option>
                  <option value="TERCEIRO">Terceiro Interessado</option>
                  <option value="CLIENTE">Cliente/Representado</option>
                </select>
              </div>

              {/* Only show checkbox for AUTOR/REU/TERCEIRO */}
              {!['TESTEMUNHA', 'PERITO', 'CLIENTE'].includes(partyFormData.role) && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={partyFormData.is_client}
                      onChange={(e) => setPartyFormData(prev => ({ ...prev, is_client: e.target.checked }))}
                    />
                    <span>É cliente do escritório neste processo</span>
                  </label>
                </div>
              )}

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={partyFormData.observacoes}
                  onChange={(e) => setPartyFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows="3"
                  placeholder="Observações sobre a participação desta parte..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddPartyModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-success"
                onClick={handleSaveParty}
              >
                <UserPlus size={18} />
                Adicionar ao Processo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Movimentação */}
      {showMovimentacaoModal && (
        <div className="modal-overlay" onClick={handleCloseMovimentacaoModal}>
          <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nova Movimentação Processual</h3>
              <button className="modal-close" onClick={handleCloseMovimentacaoModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Data *</label>
                  <input
                    type="date"
                    value={movimentacaoFormData.data}
                    onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, data: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    value={movimentacaoFormData.tipo}
                    onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <option value="DESPACHO">Despacho</option>
                    <option value="DECISAO">Decisão Interlocutória</option>
                    <option value="SENTENCA">Sentença</option>
                    <option value="ACORDAO">Acórdão</option>
                    <option value="AUDIENCIA">Audiência</option>
                    <option value="JUNTADA">Juntada de Documento</option>
                    <option value="INTIMACAO">Intimação</option>
                    <option value="CITACAO">Citação</option>
                    <option value="CONCLUSAO">Conclusos</option>
                    <option value="RECURSO">Recurso</option>
                    <option value="PETICAO">Petição Protocolada</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Título/Resumo *</label>
                <input
                  type="text"
                  value={movimentacaoFormData.titulo}
                  onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ex: Audiência de conciliação designada"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descrição Completa</label>
                <textarea
                  value={movimentacaoFormData.descricao}
                  onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows="5"
                  placeholder="Descreva os detalhes da movimentação..."
                />
              </div>

              <div className="form-group">
                <label>Prazo (em dias)</label>
                <input
                  type="number"
                  value={movimentacaoFormData.prazo}
                  onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, prazo: e.target.value }))}
                  placeholder="Ex: 15"
                  min="0"
                />
                <small style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                  Se houver prazo, informe em dias. A data limite será calculada automaticamente.
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={handleCloseMovimentacaoModal}
                disabled={savingMovimentacao}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-success"
                onClick={handleSaveMovimentacao}
                disabled={savingMovimentacao}
              >
                {savingMovimentacao ? (
                  <>
                    <RefreshCw size={18} className="spinning" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Movimentação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseDetailPage;
