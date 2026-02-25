import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Trash2, Users, Calendar, FileText, Plus, UserPlus, RefreshCw, ExternalLink } from 'lucide-react';
import casesService from '../services/casesService';
import contactsService from '../services/contactsService';
import casePartiesService from '../services/casePartiesService';
import caseMovementsService from '../services/caseMovementsService';
import * as deadlinesService from '../services/deadlinesService';
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
  const [editingMovimentacaoId, setEditingMovimentacaoId] = useState(null);
  const [movimentacaoFormData, setMovimentacaoFormData] = useState({
    data: '',
    tipo: 'DESPACHO',
    titulo: '',
    descricao: '',
    prazo: '',
  });
  const [savingMovimentacao, setSavingMovimentacao] = useState(false);

  // Prazos state
  const [deadlines, setDeadlines] = useState([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);
  const [deadlineFilter, setDeadlineFilter] = useState('all'); // all, overdue, upcoming, future

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
   * Load deadlines for this case
   */
  const loadDeadlines = useCallback(async () => {
    if (!id) return;
    
    setLoadingDeadlines(true);
    try {
      const data = await deadlinesService.getDeadlinesByCase(id);
      setDeadlines(data);
    } catch (error) {
      console.error('Error loading deadlines:', error);
      showToast('Erro ao carregar prazos', 'error');
    } finally {
      setLoadingDeadlines(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    if (id) {
      loadDeadlines();
    }
  }, [id, loadDeadlines]);

  /**
   * Check deadlines and create notifications on page load
   */
  useEffect(() => {
    const checkDeadlines = async () => {
      try {
        await deadlinesService.checkDeadlinesAndNotify();
      } catch (error) {
        console.error('Error checking deadlines:', error);
        // Silent fail - não mostrar erro para o usuário
      }
    };
    
    if (id) {
      checkDeadlines();
    }
  }, [id]);

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
   * Save movimentacao (create or update)
   */
  const handleSaveMovimentacao = async () => {
    if (!movimentacaoFormData.data || !movimentacaoFormData.titulo) {
      showToast('Preencha data e título da movimentação', 'error');
      return;
    }

    // Validar que data não é futura
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(movimentacaoFormData.data + 'T00:00:00');
    
    if (selectedDate > today) {
      showToast('A data da movimentação não pode ser futura', 'error');
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

      if (editingMovimentacaoId) {
        // UPDATE existing movimentacao
        await caseMovementsService.updateMovement(editingMovimentacaoId, dataToSave);
        showToast('Movimentação atualizada com sucesso!', 'success');
      } else {
        // CREATE new movimentacao
        await caseMovementsService.createMovement(dataToSave);
        showToast('Movimentação cadastrada com sucesso!', 'success');
      }
      
      // Reload movimentacoes, deadlines and case data (to update resumo)
      await loadMovimentacoes();
      await loadDeadlines();
      await loadCaseData();
      
      setShowMovimentacaoModal(false);
      setEditingMovimentacaoId(null);
    } catch (error) {
      console.error('Error saving movimentacao:', error);
      const action = editingMovimentacaoId ? 'atualizar' : 'salvar';
      showToast(`Erro ao ${action} movimentação`, 'error');
    } finally {
      setSavingMovimentacao(false);
    }
  };

  /**
   * Edit movimentacao
   */
  const handleEditMovimentacao = (mov) => {
    setEditingMovimentacaoId(mov.id);
    setMovimentacaoFormData({
      data: mov.data,
      tipo: mov.tipo,
      titulo: mov.titulo,
      descricao: mov.descricao || '',
      prazo: mov.prazo || '',
    });
    setShowMovimentacaoModal(true);
  };

  /**
   * Delete movimentacao
   */
  const handleDeleteMovimentacao = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) {
      return;
    }
    
    try {
      await caseMovementsService.deleteMovement(id);
      showToast('Movimentação excluída com sucesso!', 'success');
      
      // Reload movimentacoes, deadlines and case data (to update resumo)
      await loadMovimentacoes();
      await loadDeadlines();
      await loadCaseData();
    } catch (error) {
      console.error('Error deleting movimentacao:', error);
      showToast('Erro ao excluir movimentação', 'error');
    }
  };

  /**
   * Close movimentacao modal
   */
  const handleCloseMovimentacaoModal = () => {
    setShowMovimentacaoModal(false);
    setEditingMovimentacaoId(null);
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
              {deadlines.length > 0 && <span className="badge">{deadlines.length}</span>}
            </button>
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
                      <span className="process-label">PROCESSO Nº</span>
                      <h2 className="process-number">{formData.numero_processo_formatted || formData.numero_processo}</h2>
                    </div>
                    <div className="process-title-group">
                      <span className="process-label">TÍTULO</span>
                      <h3 className="process-title-value">
                        {formData.titulo || formData.tipo_acao_display || formData.tipo_acao || '—'}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="summary-grid">
                {/* Partes Envolvidas */}
                <div className="summary-section">
                  <h4><Users size={16} /> Partes</h4>

                  {parties.length > 0 ? (
                    <>
                      {/* Ordenar: Clientes primeiro, depois outros */}
                      {[...parties].sort((a, b) => {
                        if (a.is_client && !b.is_client) return -1;
                        if (!a.is_client && b.is_client) return 1;
                        return 0;
                      }).map((party, index, array) => {
                        // Adicionar espaço extra após o último cliente
                        const isLastClient = party.is_client && index < array.length - 1 && !array[index + 1].is_client;
                        
                        return (
                          <p key={party.id} className="summary-value" style={{marginTop: '0.5rem', marginBottom: isLastClient ? '1.5rem' : '0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
                            {party.is_client ? (
                              <Link 
                                to={`/contacts?open=${party.contact}`}
                                className="party-contact-link"
                                title="Ver detalhes do contato (abre em nova aba)"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <strong className="party-name-client">{party.contact_name}</strong> ↗
                              </Link>
                            ) : (
                              <strong style={{fontSize: '1.1rem'}}>{party.contact_name}</strong>
                            )}
                            {party.is_client && (
                              <span className="client-badge" style={{fontSize: '0.95rem'}}>✅ Cliente</span>
                            )}
                            <span style={{color: '#64748b', fontSize: party.is_client ? '1.1rem' : '1rem'}}>({party.role_display})</span>
                          </p>
                        );
                      })}
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
                          <p style={{fontSize: '0.95rem', color: '#6b7280', marginLeft: '0.5rem'}}>
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

                {/* Próximos Prazos */}
                {deadlines.length > 0 && (
                  <div className="summary-section">
                    <h4>⚠️ Próximos Prazos</h4>
                    {(() => {
                      const urgentDeadlines = deadlines
                        .filter(d => {
                          const status = deadlinesService.getDeadlineStatus(d.data_limite_prazo);
                          return status === 'overdue' || status === 'urgent' || status === 'upcoming';
                        })
                        .slice(0, 3);
                      
                      if (urgentDeadlines.length === 0) {
                        return (
                          <p className="summary-value" style={{color: '#10b981'}}>
                            ✅ Nenhum prazo urgente
                          </p>
                        );
                      }
                      
                      return (
                        <>
                          {urgentDeadlines.map(deadline => {
                            const status = deadlinesService.getDeadlineStatus(deadline.data_limite_prazo);
                            const statusInfo = deadlinesService.getDeadlineStatusInfo(status);
                            
                            return (
                              <div key={deadline.id} className="summary-deadline" style={{borderLeftColor: statusInfo.color}}>
                                <span className="deadline-status-label" style={{color: statusInfo.color}}>
                                  {statusInfo.label}
                                </span>
                                <p className="summary-value" style={{margin: '0.25rem 0 0 0'}}>
                                  <strong>{deadline.titulo}</strong>
                                </p>
                                <p className="summary-value" style={{fontSize: '0.95rem', color: '#6b7280', margin: '0.25rem 0 0 0'}}>
                                  Vencimento: {formatDate(deadline.data_limite_prazo)}
                                </p>
                              </div>
                            );
                          })}
                          <button 
                            className="btn-link" 
                            onClick={() => setActiveSection('deadlines')}
                            style={{marginTop: '0.5rem', fontSize: '0.9rem'}}
                          >
                            Ver todos os prazos →
                          </button>
                        </>
                      );
                    })()}
                  </div>
                )}

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

            {/* Detalhes do Processo */}
            <div className="section-card">
              <div className="section-header">
                <h2 className="section-title">
                  {isEditing ? '✏️ Editando Informações' : '📋 Detalhes do Processo'}
                </h2>
                <div className="section-header-actions">
                  {!isEditing ? (
                    <>
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
              
              {!isEditing ? (
                /* MODO READONLY - Agrupamento Temático */
                <div className="details-readonly">
                  {/* Identificação do Processo */}
                  <div className="details-group">
                    <h3 className="details-group-title">🔖 Identificação</h3>
                    <div className="details-content">
                      <div className="detail-item-row">
                        <div className="detail-item-col">
                          <span className="detail-label">PROCESSO Nº</span>
                          <span className="detail-value-large">{formData.numero_processo_formatted || formData.numero_processo}</span>
                        </div>
                        <div className="detail-item-col right">
                          <span className="detail-label">TÍTULO</span>
                          <span className="detail-value-medium">{formData.titulo || '—'}</span>
                        </div>
                      </div>
                      <div className="detail-badges-row">
                        {formData.tipo_acao && (
                          <div className="detail-badge-item">
                            <span className="detail-label-small">Tipo</span>
                            <span className={`process-tipo-badge tipo-${formData.tipo_acao.toLowerCase()}`}>
                              {formData.tipo_acao_display || formData.tipo_acao}
                            </span>
                          </div>
                        )}
                        <div className="detail-badge-item">
                          <span className="detail-label-small">Status</span>
                          <span className={`info-badge status status-${formData.status?.toLowerCase()}`}>
                            {formData.status_display || formData.status}
                          </span>
                        </div>
                        <div className="detail-badge-item">
                          <span className="detail-label-small">Tribunal</span>
                          <span className="info-badge tribunal">
                            {formData.tribunal_display || formData.tribunal}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Partes e Financeiro */}
                  <div className="details-group">
                    <h3 className="details-group-title">👥 Partes e Financeiro</h3>
                    <div className="details-content">
                      <div className="detail-partes-row">
                        <div className="detail-partes-col">
                          {(() => {
                            const clientParty = parties.find(p => p.is_client);
                            const dynamicLabel = clientParty?.role_display 
                              ? `${clientParty.role_display.toUpperCase()} DA AÇÃO` 
                              : 'CLIENTE';
                            
                            return (
                              <>
                                <span className="detail-label">{dynamicLabel}</span>
                                {clientParty ? (
                                  <div className="detail-client-block">
                                    <div className="detail-client-row">
                                      <Link
                                        to={`/contacts?open=${clientParty.contact}`}
                                        className="party-contact-link detail-client-link"
                                        title="Ver detalhes do contato (abre em nova aba)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <span className="detail-client-name">{clientParty.contact_name}</span> ↗
                                      </Link>
                                      <span className="client-badge">✅ CLIENTE</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="detail-client-block">
                                    <span className="detail-value empty">Nenhum cliente vinculado</span>
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => setActiveSection('parties')}
                                      style={{marginTop: '0.5rem'}}
                                    >
                                      <UserPlus size={16} />
                                      Adicionar Cliente na aba Partes
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          <button
                            className="btn-link detail-partes-hint"
                            onClick={() => setActiveSection('parties')}
                          >
                            ℹ️ Use a aba "Partes" para gerenciar detalhadamente
                          </button>
                        </div>
                        <div className="detail-partes-col">
                          <span className="detail-label">Partes</span>
                          {(() => {
                            const otherParties = parties.filter(p => !p.is_client);
                            if (otherParties.length > 0) {
                              return (
                                <div className="detail-partes-list">
                                  {otherParties.map(party => (
                                    <div key={party.id} className="detail-partes-item">
                                      <strong>{party.contact_name}</strong>
                                      <span className="detail-value-sub">({party.role_display})</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <span className="detail-value empty">Nenhuma outra parte cadastrada</span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Valor da Causa</span>
                        <span className="detail-value-large">{formatCurrency(formData.valor_causa)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cronologia */}
                  <div className="details-group">
                    <h3 className="details-group-title">📅 Cronologia</h3>
                    <div className="details-content">
                      <div className="detail-item">
                        <span className="detail-label">Data de Distribuição</span>
                        <span className="detail-value">{formatDate(formData.data_distribuicao)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Última Movimentação</span>
                        {formData.data_ultima_movimentacao ? (
                          <div className="detail-value-stacked">
                            <strong>{formatDate(formData.data_ultima_movimentacao)}</strong>
                            {formData.ultima_movimentacao_resumo && (
                              <span className="detail-value-sub">{formData.ultima_movimentacao_resumo}</span>
                            )}
                          </div>
                        ) : (
                          <span className="detail-value empty">Nenhuma movimentação cadastrada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Localização */}
                  <div className="details-group">
                    <h3 className="details-group-title">📍 Localização</h3>
                    <div className="details-content">
                      <div className="detail-item">
                        <span className="detail-label">Comarca</span>
                        <span className="detail-value">{formData.comarca || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Vara</span>
                        <span className="detail-value">{formData.vara || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {formData.observacoes && (
                    <div className="details-group">
                      <h3 className="details-group-title">📝 Observações</h3>
                      <div className="details-content">
                        <div className="detail-item full">
                          <p className="detail-value">{formData.observacoes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* MODO EDIÇÃO - Formulário Vertical */
                <div className="info-form-vertical">
                  {/* Título */}
                  <div className="info-field full-width">
                    <label>Título do Processo</label>
                    <input
                      type="text"
                      value={formData.titulo || ''}
                      onChange={(e) => handleInputChange('titulo', e.target.value)}
                      placeholder="Ex: Ação de Cobrança"
                    />
                  </div>

                  {/* Número do Processo */}
                  <div className="info-field">
                    <label>Número do Processo (CNJ)</label>
                    <input
                      type="text"
                      value={formData.numero_processo || ''}
                      onChange={(e) => handleInputChange('numero_processo', e.target.value)}
                      placeholder="0000000-00.0000.0.00.0000"
                    />
                  </div>

                  {/* Tribunal */}
                  <div className="info-field">
                    <label>Tribunal</label>
                    <select
                      value={formData.tribunal || ''}
                      onChange={(e) => handleInputChange('tribunal', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {tribunalOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="info-field">
                    <label>Status</label>
                    <select
                      value={formData.status || 'ATIVO'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Ação */}
                  <div className="info-field">
                    <label>Tipo de Ação</label>
                    <select
                      value={formData.tipo_acao || ''}
                      onChange={(e) => handleInputChange('tipo_acao', e.target.value)}
                    >
                      {tipoAcaoOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Comarca */}
                  <div className="info-field">
                    <label>Comarca</label>
                    <input
                      type="text"
                      value={formData.comarca || ''}
                      onChange={(e) => handleInputChange('comarca', e.target.value)}
                      placeholder="Ex: São Paulo"
                    />
                  </div>

                  {/* Vara */}
                  <div className="info-field">
                    <label>Vara</label>
                    <input
                      type="text"
                      value={formData.vara || ''}
                      onChange={(e) => handleInputChange('vara', e.target.value)}
                      placeholder="Ex: 1ª Vara Cível"
                    />
                  </div>

                  {/* Data Distribuição */}
                  <div className="info-field">
                    <label>Data de Distribuição</label>
                    <input
                      type="date"
                      value={formData.data_distribuicao || ''}
                      onChange={(e) => handleInputChange('data_distribuicao', e.target.value)}
                    />
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
                    <small style={{display: 'block', color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem'}}>
                      ℹ️ Atualizado automaticamente pela aba Movimentações
                    </small>
                  </div>

                  {/* Nosso Cliente - Display only, gerenciado via aba Partes */}
                  <div className="info-field full-width">
                    <label>Nosso Cliente Neste Processo</label>
                    {(() => {
                      const clientParty = parties.find(p => p.is_client);
                      if (clientParty) {
                        return (
                          <div className="client-display">
                            <p className="info-value">
                              <strong>{clientParty.contact_name}</strong> ({clientParty.role_display})
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="empty-state-inline">
                          <p className="info-value empty">Nenhum cliente vinculado</p>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => setActiveSection('parties')}
                            style={{marginTop: '0.5rem'}}
                          >
                            <UserPlus size={16} />
                            Adicionar Cliente na aba Partes
                          </button>
                        </div>
                      );
                    })()}
                    <span className="field-hint">
                      💡 Clientes são gerenciados na aba "Partes". Marque "É nosso cliente?" ao adicionar.
                    </span>
                  </div>

                  {/* Valor da Causa */}
                  <div className="info-field">
                    <label>Valor da Causa</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_causa || ''}
                      onChange={(e) => handleInputChange('valor_causa', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Observações - Full Width */}
                  <div className="info-field full-width">
                    <label>Observações</label>
                    <textarea
                      value={formData.observacoes || ''}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      rows="4"
                      placeholder="Observações sobre o processo..."
                    />
                  </div>
                </div>
              )}
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
                          {mov.origem === 'MANUAL' && (
                            <div className="timeline-actions">
                              <button 
                                className="btn-icon-small" 
                                onClick={() => handleEditMovimentacao(mov)}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className="btn-icon-small btn-danger" 
                                onClick={() => handleDeleteMovimentacao(mov.id)}
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
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

        {/* Prazos Section */}
        {activeSection === 'deadlines' && (
          <div className="case-section">
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">⏰ Prazos Processuais</h2>
                  <p className="section-subtitle">Gestão de prazos e vencimentos</p>
                </div>
                <div className="deadlines-filters">
                  <button
                    className={`filter-btn ${deadlineFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDeadlineFilter('all')}
                  >
                    Todos ({deadlines.length})
                  </button>
                  <button
                    className={`filter-btn ${deadlineFilter === 'overdue' ? 'active' : ''}`}
                    onClick={() => setDeadlineFilter('overdue')}
                  >
                    Vencidos ({deadlines.filter(d => deadlinesService.getDeadlineStatus(d.data_limite_prazo) === 'overdue').length})
                  </button>
                  <button
                    className={`filter-btn ${deadlineFilter === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setDeadlineFilter('upcoming')}
                  >
                    Próximos ({deadlines.filter(d => {
                      const status = deadlinesService.getDeadlineStatus(d.data_limite_prazo);
                      return status === 'urgent' || status === 'upcoming';
                    }).length})
                  </button>
                  <button
                    className={`filter-btn ${deadlineFilter === 'future' ? 'active' : ''}`}
                    onClick={() => setDeadlineFilter('future')}
                  >
                    Futuros ({deadlines.filter(d => deadlinesService.getDeadlineStatus(d.data_limite_prazo) === 'future').length})
                  </button>
                </div>
              </div>

              {loadingDeadlines ? (
                <div className="loading-container">
                  <RefreshCw className="spinning" size={32} />
                  <p>Carregando prazos...</p>
                </div>
              ) : deadlines.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} />
                  <h3>Nenhum prazo cadastrado</h3>
                  <p>
                    Adicione prazos nas movimentações para acompanhar vencimentos.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveSection('movimentacoes')}
                  >
                    Ir para Movimentações
                  </button>
                </div>
              ) : (
                <div className="deadlines-list">
                  {deadlines
                    .filter(deadline => {
                      if (deadlineFilter === 'all') return true;
                      const status = deadlinesService.getDeadlineStatus(deadline.data_limite_prazo);
                      if (deadlineFilter === 'overdue') return status === 'overdue';
                      if (deadlineFilter === 'upcoming') return status === 'urgent' || status === 'upcoming';
                      if (deadlineFilter === 'future') return status === 'future';
                      return true;
                    })
                    .map(deadline => {
                      const status = deadlinesService.getDeadlineStatus(deadline.data_limite_prazo);
                      const statusInfo = deadlinesService.getDeadlineStatusInfo(status);
                      
                      return (
                        <div key={deadline.id} className="deadline-card" style={{ borderLeftColor: statusInfo.color }}>
                          <div className="deadline-header">
                            <span className="deadline-status" style={{ color: statusInfo.color }}>
                              {statusInfo.label}
                            </span>
                            <span className="deadline-date">
                              {formatDate(deadline.data_limite_prazo)}
                            </span>
                          </div>
                          <div className="deadline-content">
                            <div className="deadline-type">{deadline.tipo_display || deadline.tipo}</div>
                            <h4 className="deadline-title">{deadline.titulo}</h4>
                            {deadline.descricao && (
                              <p className="deadline-description">{deadline.descricao}</p>
                            )}
                            <div className="deadline-meta">
                              <span>📅 Movimentação: {formatDate(deadline.data)}</span>
                              <span>⏱️ Prazo: {deadline.prazo} dias</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
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
              <h3>{editingMovimentacaoId ? 'Editar Movimentação' : 'Nova Movimentação Processual'}</h3>
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
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <small style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                    Apenas datas passadas ou de hoje são permitidas
                  </small>
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
                    {editingMovimentacaoId ? 'Atualizar Movimentação' : 'Salvar Movimentação'}
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
