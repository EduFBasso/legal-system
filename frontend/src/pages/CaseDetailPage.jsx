import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Trash2, Users, Calendar, FileText, Plus, UserPlus, RefreshCw, ExternalLink } from 'lucide-react';
import casesService from '../services/casesService';
import contactsService from '../services/contactsService';
import casePartiesService from '../services/casePartiesService';
import caseMovementsService from '../services/caseMovementsService';
import financialService from '../services/financialService';
import * as deadlinesService from '../services/deadlinesService';
import Toast from '../components/common/Toast';
import PublicationCard from '../components/PublicationCard';
import ContactDetailModal from '../components/ContactDetailModal';
import { 
  InformacaoTab, 
  PartiesTab, 
  MovimentacoesTab, 
  DocumentosTab, 
  DeadlinesTab, 
  FinanceiroTab 
} from '../components/CaseTabs';
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

  // Financeiro state
  const [recebimentos, setRecebimentos] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [participacaoTipo, setParticipacaoTipo] = useState('percentage');
  const [participacaoPercentual, setParticipacaoPercentual] = useState('');
  const [participacaoValorFixo, setParticipacaoValorFixo] = useState('');
  const [pagaMedianteGanho, setPagaMedianteGanho] = useState(false);
  const [valorCausaInput, setValorCausaInput] = useState('');
  const [recebimentoForm, setRecebimentoForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: ''
  });
  const [despesaForm, setDespesaForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: ''
  });

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

      // Add financial fields from local state to formData
      const dataToSave = {
        ...formData,
        participation_type: participacaoTipo,
        participation_percentage: participacaoTipo === 'percentage' ? parseFloat(participacaoPercentual) || null : null,
        participation_fixed_value: participacaoTipo === 'fixed' ? parseCurrencyValue(participacaoValorFixo) : null,
        payment_conditional: pagaMedianteGanho,
      };

      // Clean empty values
      const cleanedData = {};
      Object.entries(dataToSave).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      if (cleanedData.valor_causa !== undefined) {
        cleanedData.valor_causa = parseCurrencyValue(cleanedData.valor_causa);
      }

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
    return `R$ ${parseCurrencyValue(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const parseCurrencyValue = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    const str = value.toString();
    
    // Se contém vírgula, assume formato pt-BR (220.000,00)
    if (str.includes(',')) {
      const normalized = str.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    }
    
    // Se contém apenas ponto ou nenhum separador, assume formato en-US/decimal (220000.00)
    // Não remove o ponto, pois é o separador decimal
    return parseFloat(str) || 0;
  };

  const formatCurrencyInput = (value) => {
    const numeric = parseCurrencyValue(value);
    return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    if (formData.valor_causa === null || formData.valor_causa === undefined || formData.valor_causa === '') {
      setValorCausaInput('');
      return;
    }

    setValorCausaInput(formatCurrencyInput(formData.valor_causa));
  }, [formData.valor_causa]);

  // Sync financial fields from backend to local state
  useEffect(() => {
    if (!formData || !id) return;

    // Sync participation fields
    if (formData.participation_type) {
      setParticipacaoTipo(formData.participation_type);
    }
    if (formData.participation_percentage !== null && formData.participation_percentage !== undefined) {
      setParticipacaoPercentual(formData.participation_percentage.toString());
    }
    if (formData.participation_fixed_value !== null && formData.participation_fixed_value !== undefined) {
      setParticipacaoValorFixo(formatCurrencyInput(formData.participation_fixed_value));
    }
    if (formData.payment_conditional !== undefined) {
      setPagaMedianteGanho(formData.payment_conditional);
    }
  }, [formData, id]);

  // ========== FINANCEIRO FUNCTIONS ==========

  /**
   * Calculate participacao value based on type
   */
  const calcularParticipacao = () => {
    const valorCausa = parseCurrencyValue(formData.valor_causa);
    if (valorCausa === 0) return 0;

    if (participacaoTipo === 'percentage') {
      const percentual = parseFloat(participacaoPercentual) || 0;
      return (valorCausa * percentual) / 100;
    } else {
      return parseCurrencyValue(participacaoValorFixo);
    }
  };

  /**
   * Calculate total recebimentos
   */
  const calcularTotalRecebimentos = () => {
    return recebimentos.reduce((sum, r) => sum + parseFloat(r.value || 0), 0);
  };

  /**
   * Calculate total despesas
   */
  const calcularTotalDespesas = () => {
    return despesas.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
  };

  /**
   * Load payments (recebimentos) from backend
   */
  const loadPayments = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await financialService.getPaymentsByCase(id);
      setRecebimentos(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      showToast('Erro ao carregar recebimentos', 'error');
    }
  }, [id, showToast]);

  /**
   * Load expenses (despesas) from backend
   */
  const loadExpenses = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await financialService.getExpensesByCase(id);
      setDespesas(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      showToast('Erro ao carregar despesas', 'error');
    }
  }, [id, showToast]);

  // Load payments and expenses when entering financeiro section
  useEffect(() => {
    if (activeSection === 'financeiro' && id) {
      loadPayments();
      loadExpenses();
    }
  }, [activeSection, id, loadPayments, loadExpenses]);

  // Save financial fields to formData when any changes
  useEffect(() => {
    if (!id) return;

    setFormData(prev => ({
      ...prev,
      participation_type: participacaoTipo,
      participation_percentage: participacaoTipo === 'percentage' ? parseFloat(participacaoPercentual) || null : null,
      participation_fixed_value: participacaoTipo === 'fixed' ? parseCurrencyValue(participacaoValorFixo) : null,
      payment_conditional: pagaMedianteGanho,
    }));
  }, [id, participacaoTipo, participacaoPercentual, participacaoValorFixo, pagaMedianteGanho]);

  /**
   * Handle save financial data
   */
  const handleSaveFinancialData = async () => {
    try {
      setSaving(true);

      const financialData = {
        valor_causa: parseCurrencyValue(formData.valor_causa),
        participation_type: participacaoTipo,
        participation_percentage: participacaoTipo === 'percentage' ? parseFloat(participacaoPercentual) || null : null,
        participation_fixed_value: participacaoTipo === 'fixed' ? parseCurrencyValue(participacaoValorFixo) : null,
        payment_conditional: pagaMedianteGanho,
        observations_financial_block_a: formData.observations_financial_block_a || '',
        observations_financial_block_b: formData.observations_financial_block_b || '',
      };

      const updated = await casesService.update(id, financialData);
      setCaseData(updated);
      setFormData(updated);
      showToast('Dados financeiros salvos com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving financial data:', error);
      showToast('Erro ao salvar dados financeiros', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handle adicionar recebimento
   */
  const handleAdicionarRecebimento = async () => {
    if (!recebimentoForm.data || !recebimentoForm.descricao || !recebimentoForm.valor) {
      showToast('Preencha todos os campos do recebimento', 'error');
      return;
    }

    const valor = parseFloat(recebimentoForm.valor);
    if (isNaN(valor) || valor <= 0) {
      showToast('Valor deve ser um número positivo', 'error');
      return;
    }

    try {
      const paymentData = {
        case: id,
        date: recebimentoForm.data,
        description: recebimentoForm.descricao,
        value: valor
      };

      await financialService.createPayment(paymentData);
      await loadPayments(); // Reload from backend
      
      setRecebimentoForm({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        valor: ''
      });
      showToast('Recebimento adicionado', 'success');
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast('Erro ao adicionar recebimento', 'error');
    }
  };

  /**
   * Handle remover recebimento
   */
  const handleRemoverRecebimento = async (paymentId) => {
    try {
      await financialService.deletePayment(paymentId);
      await loadPayments(); // Reload from backend
      showToast('Recebimento removido', 'success');
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('Erro ao remover recebimento', 'error');
    }
  };

  /**
   * Handle adicionar despesa
   */
  const handleAdicionarDespesa = async () => {
    if (!despesaForm.data || !despesaForm.descricao || !despesaForm.valor) {
      showToast('Preencha todos os campos da despesa', 'error');
      return;
    }

    const valor = parseFloat(despesaForm.valor);
    if (isNaN(valor) || valor <= 0) {
      showToast('Valor deve ser um número positivo', 'error');
      return;
    }

    try {
      const expenseData = {
        case: id,
        date: despesaForm.data,
        description: despesaForm.descricao,
        value: valor
      };

      await financialService.createExpense(expenseData);
      await loadExpenses(); // Reload from backend
      
      setDespesaForm({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        valor: ''
      });
      showToast('Despesa adicionada', 'success');
    } catch (error) {
      console.error('Error creating expense:', error);
      showToast('Erro ao adicionar despesa', 'error');
    }
  };

  /**
   * Handle remover despesa
   */
  const handleRemoverDespesa = async (expenseId) => {
    try {
      await financialService.deleteExpense(expenseId);
      await loadExpenses(); // Reload from backend
      showToast('Despesa removida', 'success');
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('Erro ao remover despesa', 'error');
    }
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
            <button
              className={`nav-tab ${activeSection === 'financeiro' ? 'active' : ''}`}
              onClick={() => setActiveSection('financeiro')}
            >
              💰 Financeiro
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="case-content">
        {activeSection === 'info' && (
          <InformacaoTab
            id={id}
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            saving={saving}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={handleDelete}
            setActiveSection={setActiveSection}
            parties={parties}
            deadlines={deadlines}
            caseData={caseData}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            tribunalOptions={tribunalOptions}
            statusOptions={statusOptions}
            tipoAcaoOptions={tipoAcaoOptions}
            onInputChange={handleInputChange}
          />
        )}

        {/* Movimentações Section */}
        {activeSection === 'movimentacoes' && (
          <MovimentacoesTab 
            id={id}
            movimentacoes={movimentacoes}
            formatDate={formatDate}
            onOpenModal={handleOpenMovimentacaoModal}
            onEdit={handleEditMovimentacao}
            onDelete={handleDeleteMovimentacao}
          />
        )}

        {/* Documentos Section */}
        {activeSection === 'documentos' && (
          <DocumentosTab 
            documentos={documentos}
            setDocumentos={setDocumentos}
          />
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

        {/* Financeiro Section */}
        {activeSection === 'financeiro' && (
          <div className="case-section">
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">💰 Gestão Financeira</h2>
                  <p className="section-subtitle">Controle de valores e custos do processo</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleSaveFinancialData}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? 'Salvando...' : 'Salvar Dados Financeiros'}
                </button>
              </div>

              {/* BLOCO A: Valor do Processo */}
              <div className="financeiro-bloco financeiro-bloco-azul">
                <h3 className="financeiro-bloco-title">📋 Valor do Processo</h3>
                
                <div className="financeiro-bloco-content">
                  
                  {/* Card: Informações do Processo */}
                  <div className="financeiro-card">
                    <h4 className="financeiro-card-title">Informações do Processo</h4>
                    
                    <div className="financeiro-grid">
                      <div className="financeiro-field">
                        <label className="financeiro-label financeiro-label-destaque">Valor da Causa</label>
                        <div className="financeiro-input-icon-group">
                          <span className="financeiro-currency-label">💰 R$</span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            className="financeiro-input-clean"
                            placeholder="1.000,00" 
                            value={valorCausaInput}
                            onChange={(e) => setValorCausaInput(e.target.value)}
                            onBlur={(e) => {
                              const numericValue = parseCurrencyValue(e.target.value);
                              handleInputChange('valor_causa', numericValue);
                              setValorCausaInput(formatCurrencyInput(numericValue));
                            }}
                          />
                        </div>
                      </div>

                      <div className="financeiro-field">
                        <label className="financeiro-label">Condição de Pagamento</label>
                        <div className="financeiro-checkbox-inline">
                          <label>
                            <input 
                              type="checkbox" 
                              checked={pagaMedianteGanho}
                              onChange={(e) => setPagaMedianteGanho(e.target.checked)}
                            />
                            <span>Cliente paga mediante ganho de causa</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Participação do Escritório */}
                  <div className="financeiro-card">
                    <h4 className="financeiro-card-title">Participação do Escritório</h4>
                    
                    <div className="financeiro-participacao-group">
                      <div className="financeiro-participacao-options">
                        <label className="financeiro-radio-inline">
                          <input 
                            type="radio" 
                            name="participation_type" 
                            value="percentage" 
                            checked={participacaoTipo === 'percentage'}
                            onChange={(e) => setParticipacaoTipo(e.target.value)}
                          />
                          <span>Percentual (%)</span>
                        </label>
                        <input 
                          type="number" 
                          className="financeiro-input-compact" 
                          placeholder="10" 
                          min="0" 
                          max="100"
                          value={participacaoPercentual}
                          onChange={(e) => setParticipacaoPercentual(e.target.value)}
                          disabled={participacaoTipo !== 'percentage'}
                        />
                        
                        <label className="financeiro-radio-inline">
                          <input 
                            type="radio" 
                            name="participation_type" 
                            value="fixed"
                            checked={participacaoTipo === 'fixed'}
                            onChange={(e) => setParticipacaoTipo(e.target.value)}
                          />
                          <span>Valor Fixo (R$)</span>
                        </label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          className="financeiro-input-compact" 
                          placeholder="0,00" 
                          step="0.01"
                          value={participacaoValorFixo}
                          onChange={(e) => setParticipacaoValorFixo(e.target.value)}
                          onBlur={(e) => setParticipacaoValorFixo(formatCurrencyInput(e.target.value))}
                          disabled={participacaoTipo !== 'fixed'}
                        />
                      </div>

                      <div className="financeiro-resumo-participacao">
                        <span>Valor Estimado da Participação:</span>
                        <strong>R$ {calcularParticipacao().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recebimentos */}
                  <div className="financeiro-subsection">
                    <div className="financeiro-subsection-header">
                      <h4>💵 Recebimentos do Cliente</h4>
                    </div>
                    
                    {/* Formulário para Novo Recebimento */}
                    <div className="financeiro-recebimento-form">
                      <div className="financeiro-field">
                        <label className="financeiro-label">Data</label>
                        <input 
                          type="date" 
                          className="financeiro-input"
                          value={recebimentoForm.data}
                          onChange={(e) => setRecebimentoForm({...recebimentoForm, data: e.target.value})}
                        />
                      </div>

                      <div className="financeiro-field">
                        <label className="financeiro-label">Descrição</label>
                        <input 
                          type="text" 
                          className="financeiro-input"
                          placeholder="Ex: Honorários - Parcela 1/3"
                          value={recebimentoForm.descricao}
                          onChange={(e) => setRecebimentoForm({...recebimentoForm, descricao: e.target.value})}
                        />
                      </div>

                      <div className="financeiro-field">
                        <label className="financeiro-label">Valor (R$)</label>
                        <input 
                          type="number" 
                          className="financeiro-input"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          value={recebimentoForm.valor}
                          onChange={(e) => setRecebimentoForm({...recebimentoForm, valor: e.target.value})}
                        />
                      </div>

                      <button 
                        className="btn btn-success"
                        onClick={handleAdicionarRecebimento}
                      >
                        <Plus size={16} />
                        Adicionar Recebimento
                      </button>
                    </div>

                    {/* Lista de Recebimentos */}
                    {recebimentos.length === 0 ? (
                      <div className="empty-state">
                        <p>Nenhum recebimento registrado</p>
                        <p className="empty-state-hint">
                          Preencha os campos acima e clique em "Adicionar Recebimento"
                        </p>
                      </div>
                    ) : (
                      <div className="financeiro-lista">
                        {recebimentos.map(recebimento => (
                          <div key={recebimento.id} className="financeiro-item">
                            <div className="financeiro-item-info">
                              <span className="financeiro-item-data">{formatDate(recebimento.date)}</span>
                              <span className="financeiro-item-descricao">{recebimento.description}</span>
                            </div>
                            <div className="financeiro-item-actions">
                              <span className="financeiro-item-valor">
                                R$ {recebimento.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <button 
                                className="btn-icon-danger"
                                onClick={() => handleRemoverRecebimento(recebimento.id)}
                                title="Remover"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Total de Recebimentos */}
                    <div className="financeiro-total-recebimentos">
                      <span>Total Recebido:</span>
                      <strong>R$ {calcularTotalRecebimentos().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>

                  {/* Observações Bloco A */}
                  <div className="financeiro-textarea-group">
                    <label className="financeiro-label">Observações</label>
                    <textarea
                      placeholder="Anotações sobre ajustes de valores, acordos, parcelamentos, etc..."
                      rows="3"
                      value={formData.observations_financial_block_a || ''}
                      onChange={(e) => handleInputChange('observations_financial_block_a', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO B: Custos do Escritório */}
              <div className="financeiro-bloco financeiro-bloco-azul">
                <h3 className="financeiro-bloco-title">💸 Custos e Despesas do Escritório</h3>
                
                <div className="financeiro-bloco-content">
                  {/* Despesas */}
                  <div className="financeiro-subsection">
                    <div className="financeiro-subsection-header">
                      <h4>Registros de Gastos</h4>
                    </div>
                    
                    {/* Formulário para Nova Despesa */}
                    <div className="financeiro-recebimento-form">
                      <div className="financeiro-field">
                        <label className="financeiro-label">Data</label>
                        <input 
                          type="date" 
                          className="financeiro-input"
                          value={despesaForm.data}
                          onChange={(e) => setDespesaForm({...despesaForm, data: e.target.value})}
                        />
                      </div>

                      <div className="financeiro-field">
                        <label className="financeiro-label">Descrição</label>
                        <input 
                          type="text" 
                          className="financeiro-input"
                          placeholder="Ex: Custas processuais, Honorários perito"
                          value={despesaForm.descricao}
                          onChange={(e) => setDespesaForm({...despesaForm, descricao: e.target.value})}
                        />
                      </div>

                      <div className="financeiro-field">
                        <label className="financeiro-label">Valor (R$)</label>
                        <input 
                          type="number" 
                          className="financeiro-input"
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          value={despesaForm.valor}
                          onChange={(e) => setDespesaForm({...despesaForm, valor: e.target.value})}
                        />
                      </div>

                      <button 
                        className="btn btn-success"
                        onClick={handleAdicionarDespesa}
                      >
                        <Plus size={16} />
                        Adicionar Despesa
                      </button>
                    </div>

                    {/* Lista de Despesas */}
                    {despesas.length === 0 ? (
                      <div className="empty-state">
                        <p>Nenhuma despesa registrada</p>
                        <p className="empty-state-hint">
                          Registre custas do tribunal, perícias, honorários e outros custos
                        </p>
                      </div>
                    ) : (
                      <div className="financeiro-lista">
                        {despesas.map(despesa => (
                          <div key={despesa.id} className="financeiro-item">
                            <div className="financeiro-item-info">
                              <span className="financeiro-item-data">{formatDate(despesa.date)}</span>
                              <span className="financeiro-item-descricao">{despesa.description}</span>
                            </div>
                            <div className="financeiro-item-actions">
                              <span className="financeiro-item-valor">
                                R$ {despesa.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <button 
                                className="btn-icon-danger"
                                onClick={() => handleRemoverDespesa(despesa.id)}
                                title="Remover"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Despesas */}
                  <div className="financeiro-total">
                    <span>Total de Custos:</span>
                    <strong>R$ {calcularTotalDespesas().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>

                  {/* Observações Bloco B */}
                  <div className="financeiro-textarea-group">
                    <label className="financeiro-label">Observações</label>
                    <textarea
                      placeholder="Descrições detalhadas dos custos, justificativas ou pendências..."
                      rows="3"
                      value={formData.observations_financial_block_b || ''}
                      onChange={(e) => handleInputChange('observations_financial_block_b', e.target.value)}
                    />
                  </div>
                </div>
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
