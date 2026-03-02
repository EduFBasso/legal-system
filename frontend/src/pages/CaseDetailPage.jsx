import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Save, X, UserPlus, RefreshCw } from 'lucide-react';
import { formatDate, parseCurrencyValue, formatCurrency } from '../utils/formatters';
import casesService from '../services/casesService';
import contactsService from '../services/contactsService';
import casePartiesService from '../services/casePartiesService';
import publicationsService from '../services/publicationsService';
import caseMovementsService from '../services/caseMovementsService';
import caseTasksService from '../services/caseTasksService';
import financialService from '../services/financialService';
import * as deadlinesService from '../services/deadlinesService';
import systemSettingsService from '../services/systemSettingsService';
import Toast from '../components/common/Toast';
import ContactDetailModal from '../components/ContactDetailModal';
import SelectContactModal from '../components/SelectContactModal';
import { 
  InformacaoTab, 
  PartiesTab, 
  MovimentacoesTab, 
  DocumentosTab, 
  DeadlinesTab, 
  FinanceiroTab,
  PublicacoesTab,
  TasksTab,
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
  const location = useLocation();
  const publicationId = new URLSearchParams(location.search).get('pub_id');

  const getRoleDisplay = (role) => {
    const labels = {
      AUTOR: 'Autor/Requerente',
      REU: 'Réu/Requerido',
      TESTEMUNHA: 'Testemunha',
      PERITO: 'Perito',
      TERCEIRO: 'Terceiro Interessado',
      CLIENTE: 'Cliente/Representado',
    };
    return labels[role] || role;
  };

  // State
  const [caseData, setCaseData] = useState(null);
  const [formData, setFormData] = useState({});
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [publicacoes, setPublicacoes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isEditing, setIsEditing] = useState(!id); // New case = editing mode
  const [loading, setLoading] = useState(!!id); // Only load if has id
  const [saving, setSaving] = useState(false);
  const [loadingPublicacoes, setLoadingPublicacoes] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingMovimentacoes, setLoadingMovimentacoes] = useState(false);
  const [activeSection, setActiveSection] = useState('info'); // info, parties, movimentacoes, documentos, deadlines
  const [highlightedMovimentacaoId, setHighlightedMovimentacaoId] = useState(null);
  const [toast, setToast] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSelectContactModal, setShowSelectContactModal] = useState(false);
  const [sourcePublication, setSourcePublication] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletePublicationToo, setDeletePublicationToo] = useState(false);
  
  // Parties state
  const [parties, setParties] = useState([]);
  const [loadingParties, setLoadingParties] = useState(false);
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingParty, setEditingParty] = useState(null);
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingPartyFormData, setEditingPartyFormData] = useState({
    role: 'AUTOR',
    is_client: false,
    observacoes: '',
  });
  const [partyFormData, setPartyFormData] = useState({
    role: 'AUTOR',
    is_client: false,
    observacoes: '',
  });

  // Movimentações state
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [editingMovimentacaoId, setEditingMovimentacaoId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [movimentacaoFormData, setMovimentacaoFormData] = useState({
    data: '',
    tipo: 'DESPACHO',
    tipo_customizado: '',
    titulo: '',
    descricao: '',
    prazo: '',
    create_task: false,
    task_urgencia: 'NORMAL',
    task_titulo: '',
    task_descricao: '',
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

    } catch (error) {
      console.error('Error loading case:', error);
      showToast('Erro ao carregar processo', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  /**
   * Load system settings on mount
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await systemSettingsService.getAllSettings();
        setSystemSettings(settings);
        console.log('⚙️ System settings carregadas:', settings);
      } catch (error) {
        console.error('Erro ao carregar system settings:', error);
        // Continuar com padrões mesmo se erro (settings é opcional)
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  useEffect(() => {
    const loadPublicationPrefill = async () => {
      if (id || !publicationId) return;

      try {
        const result = await publicationsService.getPublicationById(publicationId);
        const publication = result?.publication;

        if (!publication) return;

        setSourcePublication(publication);

        setFormData((prev) => {
          return {
            ...prev,
            numero_processo: prev.numero_processo || publication.numero_processo || '',
            tribunal: prev.tribunal || publication.tribunal || '',
            vara: prev.vara || publication.orgao || '',
            // Dados da origem da publicação (read-only no form - não vão para observacoes)
            publicacao_origem: publication.id,
            publicacao_origem_data: publication.data_disponibilizacao,
            publicacao_origem_tipo: publication.tipo_comunicacao,
          };
        });
      } catch (error) {
        console.error('Error loading publication prefill:', error);
        showToast('Não foi possível carregar os dados da publicação para pré-preenchimento', 'warning');
      }
    };

    loadPublicationPrefill();
  }, [id, publicationId, showToast]);

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
  const handleContactCreated = async () => {
    await loadContacts();
    
    // Only close modal if NOT in parties context
    // In parties context, onLinkToProcess will handle the flow
    if (activeSection !== 'parties') {
      setShowContactModal(false);
      showToast('Cliente criado com sucesso!', 'success');
    }
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
    
    setLoadingMovimentacoes(true);
    try {
      const data = await caseMovementsService.getMovementsByCase(id);
      setMovimentacoes(data);
    } catch (error) {
      console.error('Error loading movimentacoes:', error);
      showToast('Erro ao carregar movimentações', 'error');
    } finally {
      setLoadingMovimentacoes(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    // Verificar setting antes de carregar
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_MOVEMENTS_ON_CASE !== false;
    
    if (id && shouldAutoLoad) {
      loadMovimentacoes();
    }
  }, [id, loadMovimentacoes, systemSettings]);

  useEffect(() => {
    if (activeSection !== 'info' && isEditing) {
      setIsEditing(false);
    }
  }, [activeSection, isEditing]);

  /**
   * Update deadline (prazo) status - mark as completed or not
   */
  const handleUpdateDeadline = async (deadline) => {
    try {
      await caseMovementsService.updateMovement(deadline.id, {
        completed: deadline.completed,
      });
      // Refresh prazos to reflect change
      await loadDeadlines();
      showToast(
        deadline.completed ? 'Prazo marcado como resolvido' : 'Prazo marcado como não resolvido',
        'success'
      );
    } catch (error) {
      console.error('Error updating deadline:', error);
      showToast('Erro ao atualizar prazo', 'error');
    }
  };

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
    // Verificar setting antes de carregar
    const shouldAutoLoad = systemSettings?.AUTO_CHECK_DEADLINES !== false;
    
    if (id && shouldAutoLoad) {
      loadDeadlines();
    }
  }, [id, loadDeadlines, systemSettings]);

  /**
   * Load publications linked to this case
   */
  const loadPublicacoes = useCallback(async () => {
    if (!id) return;
    
    setLoadingPublicacoes(true);
    try {
      const data = await publicationsService.getPublicationsByCase(id);
      setPublicacoes(data);
    } catch (error) {
      console.error('Error loading publications:', error);
      showToast('Erro ao carregar publicações', 'error');
    } finally {
      setLoadingPublicacoes(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    // Verificar setting antes de carregar
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_PUBLICATIONS_ON_CASE !== false;
    
    if (id && shouldAutoLoad) {
      loadPublicacoes();
    }
  }, [id, loadPublicacoes, systemSettings]);

  /**
   * Load tasks linked to this case
   */
  const loadTasks = useCallback(async () => {
    if (!id) return;

    setLoadingTasks(true);
    try {
      const data = await caseTasksService.getTasksByCase(id);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('Erro ao carregar tarefas', 'error');
    } finally {
      setLoadingTasks(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_TASKS_ON_CASE !== false;

    if (id && shouldAutoLoad) {
      loadTasks();
    }
  }, [id, loadTasks, systemSettings]);

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
    // Verificar setting antes de carregar
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_PARTIES_ON_CASE !== false;
    
    if (shouldAutoLoad) {
      loadParties();
    }
  }, [loadParties, systemSettings]);

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
   * Handle opening contact selection modal
   */
  const handleOpenContactSelection = () => {
    setShowSelectContactModal(true);
  };

  const handleCreateTask = async (taskPayload) => {
    try {
      await caseTasksService.createTask(taskPayload);
      await loadTasks();
      showToast('Tarefa criada com sucesso', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Erro ao criar tarefa', 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId, nextStatus) => {
    try {
      await caseTasksService.patchTask(taskId, { status: nextStatus });
      await loadTasks();
      showToast('Status da tarefa atualizado', 'success');
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Erro ao atualizar tarefa', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Deseja excluir esta tarefa?')) return;

    try {
      await caseTasksService.deleteTask(taskId);
      await loadTasks();
      showToast('Tarefa excluída', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Erro ao excluir tarefa', 'error');
    }
  };

  const handleOpenLinkedMovimentacao = (movimentacaoId) => {
    if (!movimentacaoId) return;

    setActiveSection('movimentacoes');
    setHighlightedMovimentacaoId(Number(movimentacaoId));

    setTimeout(() => {
      setHighlightedMovimentacaoId(null);
    }, 3000);
  };

  const handleOpenLatestMovimentacao = () => {
    setActiveSection('movimentacoes');

    if (!movimentacoes || movimentacoes.length === 0) {
      return;
    }

    const latestMov = [...movimentacoes].sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);

      if (dateB.getTime() !== dateA.getTime()) {
        return dateB - dateA;
      }

      return (b.id || 0) - (a.id || 0);
    })[0];

    if (!latestMov?.id) {
      return;
    }

    setHighlightedMovimentacaoId(Number(latestMov.id));

    setTimeout(() => {
      setHighlightedMovimentacaoId(null);
    }, 3000);
  };

  /**
   * Handle contact selection from SelectContactModal
   */
  const handleSelectContactForParty = (contact) => {
    setSelectedContact(contact);
    setShowSelectContactModal(false);
    setShowContactModal(false);
    setShowAddPartyModal(true);
  };

  /**
   * Handle create new contact from SelectContactModal
   */
  const handleCreateNewContactForParty = () => {
    setShowSelectContactModal(false);
    setShowContactModal(true);
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
      if (!id) {
        const draftId = `draft-${Date.now()}-${selectedContact.id}`;
        const draftParty = {
          id: draftId,
          contact: selectedContact.id,
          contact_name: selectedContact.name,
          contact_person_type: selectedContact.person_type,
          contact_document: selectedContact.document_number,
          contact_phone: selectedContact.phone,
          contact_email: selectedContact.email,
          role: partyFormData.role,
          role_display: getRoleDisplay(partyFormData.role),
          is_client: partyFormData.is_client,
          observacoes: partyFormData.observacoes,
          is_draft: true,
        };

        setParties((prev) => {
          const withoutSameContact = prev.filter((p) => p.contact !== selectedContact.id);
          if (draftParty.is_client) {
            return [...withoutSameContact.map((p) => ({ ...p, is_client: false })), draftParty];
          }
          return [...withoutSameContact, draftParty];
        });

        showToast('Parte adicionada ao rascunho do processo', 'success');
        handleCloseAddPartyModal();
        return;
      }

      await casePartiesService.createParty({
        case: parseInt(id),
        contact: selectedContact.id,
        role: partyFormData.role,
        is_client: partyFormData.is_client,
        observacoes: partyFormData.observacoes,
      });

      showToast('Parte adicionada com sucesso!', 'success');
      handleCloseAddPartyModal();
      loadParties();
    } catch (error) {
      console.error('Error saving party:', error);
      showToast('Erro ao adicionar parte', 'error');
    }
  };

  /**
   * Handle close add party modal
   */
  const handleCloseAddPartyModal = () => {
    setShowAddPartyModal(false);
    setSelectedContact(null);
    setPartyFormData({
      role: 'AUTOR',
      is_client: false,
      observacoes: '',
    });
  };

  /**
   * Handle remove party
   */
  const handleRemoveParty = async (partyId, partyName) => {
    if (!window.confirm(`Remover ${partyName} deste processo?`)) return;

    try {
      if (!id) {
        setParties((prev) => prev.filter((party) => party.id !== partyId));
        showToast('Parte removida do rascunho', 'success');
        return;
      }

      await casePartiesService.deleteParty(partyId);
      showToast('Parte removida do processo', 'success');
      loadParties();
    } catch (error) {
      console.error('Error removing party:', error);
      showToast('Erro ao remover parte', 'error');
    }
  };

  /**
   * Handle edit party (papel/role)
   */
  const handleEditParty = (party) => {
    setEditingParty(party);
    setEditingPartyFormData({
      role: party.role,
      is_client: party.is_client,
      observacoes: party.observacoes || '',
    });
  };

  /**
   * Handle edit contact
   */
  const handleEditContact = (contactId) => {
    setEditingContactId(contactId);
  };

  /**
   * Handle contact updated (reloads parties)
   */
  const handleContactUpdated = () => {
    setEditingContactId(null);
    loadParties();
    showToast('Dados pessoais atualizados!', 'success');
  };

  /**
   * Handle save party changes
   */
  const handleSavePartyChanges = async () => {
    if (!editingParty) return;

    try {
      if (!id) {
        setParties((prev) => prev.map((party) => {
          if (party.id !== editingParty.id) return party;
          return {
            ...party,
            role: editingPartyFormData.role,
            role_display: getRoleDisplay(editingPartyFormData.role),
            is_client: editingPartyFormData.is_client,
            observacoes: editingPartyFormData.observacoes,
          };
        }).map((party) => {
          if (editingPartyFormData.is_client && party.id !== editingParty.id) {
            return { ...party, is_client: false };
          }
          return party;
        }));

        showToast('Papel da parte atualizado no rascunho!', 'success');
        setEditingParty(null);
        return;
      }

      await casePartiesService.updateParty(editingParty.id, editingPartyFormData);
      showToast('Papel da parte atualizado com sucesso!', 'success');
      setEditingParty(null);
      loadParties();
    } catch (error) {
      console.error('Error updating party:', error);
      showToast('Erro ao atualizar papel da parte', 'error');
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

      if (!id) {
        const created = await casesService.create(cleanedData);

        let failedParties = 0;
        for (const party of parties) {
          try {
            await casePartiesService.createParty({
              case: created.id,
              contact: party.contact,
              role: party.role,
              is_client: !!party.is_client,
              observacoes: party.observacoes || '',
            });
          } catch (partyError) {
            failedParties += 1;
            console.error('Error creating party after case creation:', partyError);
          }
        }

        const pubId = sourcePublication?.id_api || publicationId;
        if (pubId) {
          try {
            await publicationsService.integratePublication(pubId, {
              caseId: created.id,
              createMovement: systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION || false,
            });
          } catch (integrationError) {
            console.error('Error integrating source publication:', integrationError);
            showToast('Processo criado, mas houve falha ao vincular a publicação automaticamente', 'warning');
          }
        }

        setCaseData(created);
        setFormData(created);
        setIsEditing(false);

        if (failedParties > 0) {
          showToast(`Processo criado! ${failedParties} parte(s) não foram vinculadas`, 'warning');
        } else {
          showToast('Processo criado com sucesso!', 'success');
        }

        setTimeout(() => {
          window.open(`/cases/${created.id}`, '_blank', 'noopener,noreferrer');
        }, 700);
        return;
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
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirmModal(false);
    
    try {
      await casesService.delete(id, 'Deleted via UI', deletePublicationToo);
      showToast('Processo deletado com sucesso!', 'success');
      setTimeout(() => {
        window.close(); // Fecha a aba
      }, 1500);
    } catch (error) {
      console.error('Error deleting case:', error);
      showToast('Erro ao deletar processo', 'error');
    } finally {
      setDeletePublicationToo(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setDeletePublicationToo(false);
  };

  /**
   * Open modal to add new movimentacao
   */
  const handleOpenMovimentacaoModal = () => {
    // Validar que o caso já foi salvo (tem id)
    if (!id) {
      showToast('Salve o caso primeiro antes de adicionar movimentações', 'warning');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    setMovimentacaoFormData({
      data: today,
      tipo: 'DESPACHO',
      tipo_customizado: '',
      titulo: '',
      descricao: '',
      prazo: '',
      create_task: false,
      task_urgencia: 'NORMAL',
      task_titulo: '',
      task_descricao: '',
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

    // Validar tipo customizado se tipo = OUTROS
    if (movimentacaoFormData.tipo === 'OUTROS' && !movimentacaoFormData.tipo_customizado?.trim()) {
      showToast('Especifique o tipo de movimentação', 'error');
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

    // Aviso se prazo não foi preenchido (campo importante)
    if (!movimentacaoFormData.prazo || movimentacaoFormData.prazo === '') {
      console.warn('⚠️ Movimentação sendo criada SEM prazo em dias - não aparecerá na aba Prazos');
      showToast('Dica: Preencha o campo "Prazo (em dias)" para que a movimentação apareça na aba Prazos', 'info');
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

      // Enviar tipo customizado se aplicável
      if (movimentacaoFormData.tipo === 'OUTROS') {
        dataToSave.tipo_customizado = movimentacaoFormData.tipo_customizado.trim();
      }

      if (editingMovimentacaoId) {
        // UPDATE existing movimentacao
        await caseMovementsService.updateMovement(editingMovimentacaoId, dataToSave);
        showToast('Movimentação atualizada com sucesso!', 'success');
      } else {
        // CREATE new movimentacao
        const createdMovement = await caseMovementsService.createMovement(dataToSave);

        if (movimentacaoFormData.create_task) {
          await caseTasksService.createTask({
            case: parseInt(id),
            movimentacao: createdMovement.id,
            titulo: (movimentacaoFormData.task_titulo || '').trim() || `Tarefa: ${movimentacaoFormData.titulo}`,
            descricao: (movimentacaoFormData.task_descricao || '').trim(),
            urgencia: movimentacaoFormData.task_urgencia || 'NORMAL',
            status: 'PENDENTE',
          });
        }

        showToast('Movimentação cadastrada com sucesso!', 'success');
      }
      
      // Reload movimentacoes, deadlines and case data (to update resumo)
      await loadMovimentacoes();
      await loadDeadlines();
      await loadTasks();
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
      tipo_customizado: mov.tipo_customizado || '',
      titulo: mov.titulo,
      descricao: mov.descricao || '',
      prazo: mov.prazo || '',
      create_task: false,
      task_urgencia: 'NORMAL',
      task_titulo: '',
      task_descricao: '',
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
   * Create movement from publication (manual mode)
   */
  const handleCreateMovementFromPublication = async (publicationIdApi) => {
    try {
      const result = await publicationsService.createMovementFromPublication(publicationIdApi);
      
      if (result.success) {
        showToast('Movimentação criada com sucesso!', 'success');
        
        // Reload movimentacoes and deadlines
        await loadMovimentacoes();
        await loadDeadlines();
      } else {
        showToast(result.error || 'Erro ao criar movimentação', 'error');
      }
    } catch (error) {
      console.error('Error creating movement from publication:', error);
      showToast('Erro ao criar movimentação', 'error');
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
      tipo_customizado: '',
      titulo: '',
      descricao: '',
      prazo: '',
      create_task: false,
      task_urgencia: 'NORMAL',
      task_titulo: '',
      task_descricao: '',
    });
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

  // Mostrar erro só se tem ID mas não carregou dados
  if (id && !caseData) {
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
            {/* Oculta aba Publicações se auto-sync estiver ativo e configuração permitir */}
            {!(systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION && systemSettings?.HIDE_PUBLICATIONS_TAB_WHEN_AUTO_SYNC) && (
              <button
                className={`nav-tab ${activeSection === 'publicacoes' ? 'active' : ''}`}
                onClick={() => setActiveSection('publicacoes')}
              >
                📰 Publicações
                {publicacoes.length > 0 && <span className="badge">{publicacoes.length}</span>}
              </button>
            )}
            <button
              className={`nav-tab ${activeSection === 'deadlines' ? 'active' : ''}`}
              onClick={() => setActiveSection('deadlines')}
            >
              ⏰ Prazos
              {deadlines.length > 0 && <span className="badge">{deadlines.length}</span>}
            </button>
            <button
              className={`nav-tab ${activeSection === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveSection('tasks')}
            >
              ✅ Tarefas
              {tasks.length > 0 && <span className="badge">{tasks.length}</span>}
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
            onOpenLatestMovimentacao={handleOpenLatestMovimentacao}
            onAddPartyClick={handleOpenContactSelection}
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
            numeroProcesso={caseData?.numero_processo}
            deadlines={deadlines}
            highlightedMovimentacaoId={highlightedMovimentacaoId}
            formatDate={formatDate}
            onOpenModal={handleOpenMovimentacaoModal}
            onEdit={handleEditMovimentacao}
            onDelete={handleDeleteMovimentacao}
            onAddPrazo={(mov) => setActiveSection('deadlines')}
          />
        )}

        {/* Documentos Section */}
        {activeSection === 'documentos' && (
          <DocumentosTab 
            documentos={documentos}
            setDocumentos={setDocumentos}
          />
        )}

        {/* Publicações Section - Oculta se auto-sync estiver ativo */}
        {activeSection === 'publicacoes' && !(systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION && systemSettings?.HIDE_PUBLICATIONS_TAB_WHEN_AUTO_SYNC) && (
          <PublicacoesTab
            caseId={id}
            publicacoes={publicacoes}
            loading={loadingPublicacoes}
            systemSettings={systemSettings}
            onVincularPublicacao={(publicacao) => {
              // TODO: Implementar handler para vincular publicação ao caso
              console.log('Vincular publicação:', publicacao);
            }}
            onDesvincularPublicacao={(publicacaoId) => {
              // TODO: Implementar handler para desvincular publicação
              console.log('Desvincular publicação:', publicacaoId);
              setPublicacoes(prev => prev.filter(p => p.id !== publicacaoId));
            }}
            onCreateMovement={handleCreateMovementFromPublication}
            onRefresh={loadPublicacoes}
          />
        )}

        {/* Prazos Section */}
        {activeSection === 'deadlines' && (
          <DeadlinesTab 
            movements={movimentacoes}
            loadingMovements={loadingMovimentacoes}
            caseId={id}
            numeroProcesso={caseData?.numero_processo}
          />
        )}

        {activeSection === 'tasks' && (
          <TasksTab
            caseId={id}
            tasks={tasks}
            movimentacoes={movimentacoes}
            loading={loadingTasks}
            onRefresh={loadTasks}
            onCreateTask={handleCreateTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onOpenLinkedMovimentacao={handleOpenLinkedMovimentacao}
          />
        )}

        {/* Financeiro Section */}
        {activeSection === 'financeiro' && (
          <FinanceiroTab
            id={id}
            formData={formData}
            setFormData={setFormData}
            recebimentos={recebimentos}
            despesas={despesas}
            participacaoTipo={participacaoTipo}
            participacaoPercentual={participacaoPercentual}
            participacaoValorFixo={participacaoValorFixo}
            pagaMedianteGanho={pagaMedianteGanho}
            valorCausaInput={valorCausaInput}
            recebimentoForm={recebimentoForm}
            despesaForm={despesaForm}
            onInputChange={handleInputChange}
            setRecebimentoForm={setRecebimentoForm}
            setDespesaForm={setDespesaForm}
            setParticipacaoTipo={setParticipacaoTipo}
            setParticipacaoPercentual={setParticipacaoPercentual}
            setParticipacaoValorFixo={setParticipacaoValorFixo}
            setPagaMedianteGanho={setPagaMedianteGanho}
            setValorCausaInput={setValorCausaInput}
            onAddRecebimento={handleAdicionarRecebimento}
            onRemoveRecebimento={handleRemoverRecebimento}
            onAddDespesa={handleAdicionarDespesa}
            onRemoveDespesa={handleRemoverDespesa}
            onSaveFinancial={handleSaveFinancialData}
            saving={saving}
            formatDate={formatDate}
            parseCurrencyValue={parseCurrencyValue}
            formatCurrencyInput={formatCurrencyInput}
            calcularParticipacao={calcularParticipacao}
            calcularTotalRecebimentos={calcularTotalRecebimentos}
            calcularTotalDespesas={calcularTotalDespesas}
          />
        )}

        {/* Partes Section */}
        {activeSection === 'parties' && (
          <PartiesTab 
            id={id}
            parties={parties}
            loadingParties={loadingParties}
            onAddPartyClick={handleOpenContactSelection}
            onRemoveParty={handleRemoveParty}
            onEditParty={handleEditParty}
          />
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

      {/* Modal de Seleção de Contato */}
      {showSelectContactModal && (
        <SelectContactModal
          isOpen={showSelectContactModal}
          onClose={() => setShowSelectContactModal(false)}
          onSelectContact={handleSelectContactForParty}
          onCreateNew={handleCreateNewContactForParty}
        />
      )}

      {/* Modal de Novo Cliente/Parte */}
      {showContactModal && (
        <ContactDetailModal
          contactId={null}
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onContactUpdated={handleContactCreated}
          showLinkToProcessButton={false}
          onLinkToProcess={handleSelectContactForParty}
        />
      )}

      {/* Modal de Edição de Papel da Parte */}
      {editingParty && (
        <div className="modal-overlay" onClick={() => setEditingParty(null)}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Papel da Parte</h2>
              <button className="modal-close" onClick={() => setEditingParty(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="selected-contact-info">
                <span className="contact-icon">
                  {editingParty.contact_person_type === 'PF' ? '👤' : '🏢'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <strong>{editingParty.contact_name}</strong>
                    <button
                      className="btn-edit-contact-link"
                      onClick={() => handleEditContact(editingParty.contact)}
                      title="Editar dados pessoais do contato"
                      style={{
                        background: 'none',
                        border: '1px solid #2563eb',
                        borderRadius: '4px',
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        color: '#2563eb',
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#2563eb';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'none';
                        e.target.style.color = '#2563eb';
                      }}
                    >
                      ✏️ Editar dados pessoais
                    </button>
                  </div>
                  {editingParty.contact_document && (
                    <span className="contact-doc"> • {editingParty.contact_document}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Papel no Processo *</label>
                <select
                  value={editingPartyFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditingPartyFormData(prev => ({
                      ...prev,
                      role: newRole,
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

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editingPartyFormData.is_client}
                    onChange={(e) => setEditingPartyFormData(prev => ({ ...prev, is_client: e.target.checked }))}
                  />
                  <span>É cliente do escritório neste processo</span>
                </label>
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={editingPartyFormData.observacoes}
                  onChange={(e) => setEditingPartyFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Ex: Cliente pela contraparte, não é nosso cliente..."
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingParty(null)}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handleSavePartyChanges}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Contato (dados pessoais) */}
      {editingContactId && (
        <ContactDetailModal
          contactId={editingContactId}
          isOpen={!!editingContactId}
          onClose={() => setEditingContactId(null)}
          onContactUpdated={handleContactUpdated}
          showLinkToProcessButton={false}
          openInEditMode={true}
        />
      )}

      {/* Modal de Definir Papel da Parte */}
      {showAddPartyModal && selectedContact && (
        <div className="modal-overlay" onClick={handleCloseAddPartyModal}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar ao Processo</h2>
              <button className="modal-close" onClick={handleCloseAddPartyModal}>×</button>
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
                onClick={handleCloseAddPartyModal}
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
                  <small className="form-helper-text">
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

                {movimentacaoFormData.tipo === 'OUTROS' && (
                  <div className="form-group">
                    <label>Especifique o tipo de movimentação *</label>
                    <input
                      type="text"
                      value={movimentacaoFormData.tipo_customizado || ''}
                      onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, tipo_customizado: e.target.value }))}
                      placeholder="Ex: Despacho do juiz, Comunicado da secretaria, etc..."
                      required
                    />
                  </div>
                )}
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

              <div className="form-group" style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1.25rem', borderRadius: '4px' }}>
                <label style={{ color: '#b45309', fontWeight: '600' }}>
                  Prazo (em dias)
                  <span style={{ marginLeft: '0.5rem', color: '#d97706' }}>*</span>
                </label>
                <input
                  type="number"
                  value={movimentacaoFormData.prazo}
                  onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, prazo: e.target.value }))}
                  placeholder="Ex: 15"
                  min="0"
                />
                <small className="form-helper-text">
                  IMPORTANTE: Preencha com o número de dias para que a movimentação apareça na aba Prazos. A data limite será calculada automaticamente.
                </small>
              </div>

              {!editingMovimentacaoId && (
                <div className="form-group" style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '1.25rem', borderRadius: '4px' }}>
                  <label style={{ fontWeight: 600 }}>Vincular tarefa a esta movimentação</label>

                  <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(movimentacaoFormData.create_task)}
                        onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, create_task: e.target.checked }))}
                      />
                      Gerar tarefa automaticamente
                    </label>
                  </div>

                  {movimentacaoFormData.create_task && (
                    <div
                      style={{
                        background:
                          movimentacaoFormData.task_urgencia === 'URGENTE'
                            ? '#fff7ed'
                            : movimentacaoFormData.task_urgencia === 'URGENTISSIMO'
                            ? '#fef2f2'
                            : '#ecfdf5',
                        border:
                          movimentacaoFormData.task_urgencia === 'URGENTE'
                            ? '1px solid #f59e0b'
                            : movimentacaoFormData.task_urgencia === 'URGENTISSIMO'
                            ? '1px solid #dc2626'
                            : '1px solid #10b981',
                        borderRadius: '6px',
                        padding: '1rem',
                        marginTop: '0.75rem',
                      }}
                    >
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Título da tarefa</label>
                        <input
                          type="text"
                          value={movimentacaoFormData.task_titulo}
                          onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, task_titulo: e.target.value }))}
                          placeholder="Ex: Telefonar para cliente antes da audiência"
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label>Urgência</label>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                        }}>
                          <button
                            type="button"
                            onClick={() => setMovimentacaoFormData(prev => ({ ...prev, task_urgencia: 'NORMAL' }))}
                            style={{
                              background: movimentacaoFormData.task_urgencia === 'NORMAL' ? '#10b981' : '#ffffff',
                              color: movimentacaoFormData.task_urgencia === 'NORMAL' ? '#ffffff' : '#10b981',
                              border: '1px solid #10b981',
                              borderRadius: '4px',
                              padding: '0.5rem 1rem',
                              fontWeight: movimentacaoFormData.task_urgencia === 'NORMAL' ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Normal
                          </button>
                          <button
                            type="button"
                            onClick={() => setMovimentacaoFormData(prev => ({ ...prev, task_urgencia: 'URGENTE' }))}
                            style={{
                              background: movimentacaoFormData.task_urgencia === 'URGENTE' ? '#f59e0b' : '#ffffff',
                              color: movimentacaoFormData.task_urgencia === 'URGENTE' ? '#ffffff' : '#f59e0b',
                              border: '1px solid #f59e0b',
                              borderRadius: '4px',
                              padding: '0.5rem 1rem',
                              fontWeight: movimentacaoFormData.task_urgencia === 'URGENTE' ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Urgente
                          </button>
                          <button
                            type="button"
                            onClick={() => setMovimentacaoFormData(prev => ({ ...prev, task_urgencia: 'URGENTISSIMO' }))}
                            style={{
                              background: movimentacaoFormData.task_urgencia === 'URGENTISSIMO' ? '#dc2626' : '#ffffff',
                              color: movimentacaoFormData.task_urgencia === 'URGENTISSIMO' ? '#ffffff' : '#dc2626',
                              border: '1px solid #dc2626',
                              borderRadius: '4px',
                              padding: '0.5rem 1rem',
                              fontWeight: movimentacaoFormData.task_urgencia === 'URGENTISSIMO' ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            Urgentíssimo
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Descrição da tarefa (opcional)</label>
                        <textarea
                          rows="2"
                          value={movimentacaoFormData.task_descricao}
                          onChange={(e) => setMovimentacaoFormData(prev => ({ ...prev, task_descricao: e.target.value }))}
                          placeholder="Detalhes extras da tarefa..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '2px solid #ef4444' }}>
              <h2 style={{ color: '#7f1d1d', margin: 0 }}>🗑️ Deletar Processo</h2>
              <button
                className="modal-close"
                onClick={handleCancelDelete}
                style={{ color: '#ef4444' }}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>
                Tem certeza que deseja deletar este processo <strong>{caseData?.numero_processo}</strong>?
              </p>
              
              {caseData?.publicacao_origem_id && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600, color: '#92400e' }}>
                    ⚠️ Este processo está vinculado a uma publicação:
                  </p>
                  <p style={{ margin: 0, color: '#78350f', fontSize: '0.95rem' }}>
                    <strong>{caseData?.publicacao_origem_numero_processo}</strong> - {caseData?.publicacao_origem_tipo}
                  </p>
                </div>
              )}
              
              {caseData?.publicacao_origem_id && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={deletePublicationToo}
                      onChange={(e) => setDeletePublicationToo(e.target.checked)}
                      style={{ marginTop: '0.25rem', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#374151' }}>
                      <strong>Deletar também a publicação de origem</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                        {deletePublicationToo 
                          ? '✓ A publicação será deletada do sistema e não poderá ser recuperada'
                          : 'A publicação será desvinculada e retornará à lista "Publicações Não Vinculadas"'
                        }
                      </p>
                    </span>
                  </label>
                </div>
              )}
              
              <div style={{
                background: '#f3f4f6',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#6b7280',
                marginTop: '1rem'
              }}>
                ℹ️ Esta ação é irreversível. O processo será marcado como deletado por segurança.
              </div>
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb' }}>
              <button
                className="btn btn-secondary"
                onClick={handleCancelDelete}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                style={{ background: '#ef4444' }}
              >
                🗑️ Deletar Processo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseDetailPage;
