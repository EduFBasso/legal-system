import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';
import useAutoSave from '../hooks/useAutoSave';
import systemSettingsService from '../services/systemSettingsService';
import Toast from '../components/common/Toast';
import ContactDetailModal from '../components/ContactDetailModal';
import SelectContactModal from '../components/SelectContactModal';
import { 
  InformacaoTab, 
  PartiesTab, 
  MovimentacoesTab, 
  DocumentosTab, 
  FinanceiroTab,
  PublicacoesTab,
  TasksTab,
} from '../components/CaseTabs';

// Custom hooks para separação de responsabilidades
import { useModalsAndNotifications } from '../hooks/useModalsAndNotifications';
import { usePageNavigation } from '../hooks/usePageNavigation';
import { useCaseCore } from '../hooks/useCaseCore';
import { usePartyManagement } from '../hooks/usePartyManagement';
import { useMovementsAndTasks } from '../hooks/useMovementsAndTasks';
import { usePublicationsForCase } from '../hooks/usePublicationsForCase';
import { useFinancialData } from '../hooks/useFinancialData';

import './CaseDetailPage.css';

/**
 * CaseDetailPage - Página dedicada para detalhes completos do processo
 * 
 * Abre em nova aba do navegador, aproveitando toda largura da tela
 * sem sidebar. Permite edição inline de informações do processo.
 * 
 * Modularizado com 7 custom hooks:
 * - useCaseCore: Dados e CRUD do caso
 * - usePartyManagement: Partes do processo
 * - useMovementsAndTasks: Movimentações e tarefas
 * - useFinancialData: Dados financeiros
 * - usePublicationsForCase: Publicações
 * - useModalsAndNotifications: Modais e notificações (Toast)
 * - usePageNavigation: Navegação de abas e URL params
 */
function CaseDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const publicationId = new URLSearchParams(location.search).get('pub_id');
  const linkAction = new URLSearchParams(location.search).get('action');
  const linkContactId = parseInt(new URLSearchParams(location.search).get('contactId') || '', 10);

  // System settings
  const [systemSettings, setSystemSettings] = useState(null);

  /**
   * Hooks de negócio - cada um responsável por um domínio
   */
  
  // Modals e notificações (base)
  const modalsNotif = useModalsAndNotifications();

  // Navegação de páginas (base)
  const navigation = usePageNavigation();

  // Case core data
  const caseCore = useCaseCore(
    id,
    publicationId,
    systemSettings,
    modalsNotif.showToast,
    handleCaseCreated,
    handleCaseDeleted,
  );

  // Party management
  const parties = usePartyManagement(
    id,
    modalsNotif.showToast,
    []
  );

  // Movements and tasks
  const movements = useMovementsAndTasks(
    id,
    systemSettings,
    modalsNotif.showToast
  );

  // Publications
  const publications = usePublicationsForCase(
    id,
    systemSettings,
    modalsNotif.showToast
  );

  // Financial data
  const financial = useFinancialData(
    id,
    caseCore.formData,
    caseCore.setFormData,
    navigation.activeSection === 'financeiro',
    modalsNotif.showToast,
  );

  // Auto-save financial data (debounce 800ms + só campos alterados)
  const { isSaving: autoSavingFinancial } = useAutoSave(
    financial.buildFinancialPayload(),
    async (changedFields) => {
      const { default: casesService } = await import('../services/casesService');
      await casesService.update(id, changedFields);
    },
    {
      delay: 800,
      enabled: !!(id && navigation.activeSection === 'financeiro' && !caseCore.saving),
      getChangedFields: financial.getChangedFinancialFields,
    }
  );

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
      }
    };
    
    loadSettings();
  }, []);

  /**
   * Detecta link action para vincular contato ao caso
   */
  useEffect(() => {
    if (!id || linkAction !== 'link' || !Number.isInteger(linkContactId) || linkContactId <= 0) {
      return;
    }

    const runLinkFlow = async () => {
      if (navigation.activeSection !== 'parties') {
        navigation.setActiveSection('parties');
        return;
      }

      if (modalsNotif.contacts.length === 0) {
        await modalsNotif.loadContacts();
        return;
      }

      const alreadyLinked = parties.parties.some((party) => party.contact === linkContactId);
      if (alreadyLinked) {
        modalsNotif.showToast('Contato já está vinculado a este processo.', 'warning');
        navigation.clearLinkQueryParams();
        return;
      }

      const contact = modalsNotif.contacts.find((item) => item.id === linkContactId);
      if (!contact) {
        modalsNotif.showToast('Contato não encontrado para vinculação.', 'error');
        navigation.clearLinkQueryParams();
        return;
      }

      parties.setSelectedContact(contact);
      parties.setShowAddPartyModal(true);
      navigation.clearLinkQueryParams();
    };

    runLinkFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, linkAction, linkContactId]);

  /**
   * Carregar partes ao carregar página
   */
  useEffect(() => {
    const shouldAutoLoad = systemSettings?.AUTO_LOAD_PARTIES_ON_CASE !== false;
    
    if (shouldAutoLoad && parties.loadParties) {
      parties.loadParties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemSettings]);

  /**
   * Recarregar partes quando trocar de aba
   */
  useEffect(() => {
    if (navigation.activeSection === 'parties' && parties.loadParties) {
      parties.loadParties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.activeSection]);

  /**
   * Callback quando caso é criado
   */
  function handleCaseCreated(caseId) {
    const currentParams = new URLSearchParams(location.search);
    currentParams.delete('pub_id');
    currentParams.delete('action');
    currentParams.delete('contactId');
    currentParams.set('tab', navigation.activeSection || 'info');
    const nextQuery = currentParams.toString();
    const nextUrl = nextQuery ? `/cases/${caseId}?${nextQuery}` : `/cases/${caseId}`;
    navigate(nextUrl, { replace: true });
  }

  /**
   * Callback quando caso é deletado
   */
  function handleCaseDeleted() {
    setTimeout(() => {
      window.close();
    }, 1500);
  }

  /**
   * Extensão para salvar caso + parties
   */
  const handleSaveCaseWithParties = async () => {
    try {
      await caseCore.handleSave(parties.parties);
    } catch {
      // Error already handled by hook
    }
  };

  /**
   * Handler para abrir seleção de contato
   */
  const handleOpenContactSelection = () => {
    parties.setShowAddPartyModal(false);
    modalsNotif.setShowSelectContactModal(true);
  };

  /**
   * Handler para seleção de contato
   */
  const handleSelectContactForParty = (contact) => {
    parties.setSelectedContact(contact);
    modalsNotif.setShowSelectContactModal(false);
    modalsNotif.setShowContactModal(false);
    parties.setShowAddPartyModal(true);
  };

  /**
   * Handler para criar novo contato para parte
   */
  const handleCreateNewContactForParty = () => {
    modalsNotif.setShowSelectContactModal(false);
    modalsNotif.setShowContactModal(true);
  };

  /**
   * Handler para salvar parte
   */
  const handleSaveParty = async () => {
    await parties.handleSaveParty(parties.selectedContact, modalsNotif.loadContacts);
  };

  /**
   * Handler para remover parte
   */
  const handleRemoveParty = async (partyId, partyName) => {
    await parties.handleRemoveParty(partyId, partyName, modalsNotif.loadContacts);
  };

  /**
   * Handler para salvar alterações na parte
   */
  const handleSavePartyChanges = async () => {
    await parties.handleSavePartyChanges(modalsNotif.loadContacts);
  };

  /**
   * Handler para abrir origem movimentação
   */
  const handleOpenOrigemMovimentacao = () => {
    if (!id) return;

    const sourcePublicationApiId = caseCore.sourcePublication?.id_api
      ? Number(caseCore.sourcePublication.id_api)
      : null;

    const origemPublicationPk = Number(caseCore.formData?.publicacao_origem || caseCore.caseData?.publicacao_origem_id || 0);
    const origemPublication = !sourcePublicationApiId && origemPublicationPk && Array.isArray(publications.publicacoes)
      ? publications.publicacoes.find((pub) => Number(pub.id) === origemPublicationPk)
      : null;

    const origemPublicationApiId = sourcePublicationApiId || Number(origemPublication?.id_api || 0) || null;

    const origemMovimentacao = origemPublicationApiId && Array.isArray(movements.movimentacoes)
      ? movements.movimentacoes.find((mov) => Number(mov.publicacao_id) === Number(origemPublicationApiId))
      : null;

    const targetUrl = origemMovimentacao?.id
      ? `/cases/${id}?tab=movements&focusMovement=${origemMovimentacao.id}`
      : `/cases/${id}?tab=movements`;

    window.open(targetUrl, '_blank', 'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes');
  };

  /**
   * Handler para deletar caso
   */
  const handleDelete = async () => {
    modalsNotif.setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    modalsNotif.setShowDeleteConfirmModal(false);
    
    try {
      await caseCore.handleDelete(modalsNotif.deletePublicationToo);
    } finally {
      modalsNotif.setDeletePublicationToo(false);
    }
  };

  const handleCancelDelete = () => {
    modalsNotif.setShowDeleteConfirmModal(false);
    modalsNotif.setDeletePublicationToo(false);
  };

  /**
   * Handler para mudança de aba (protegido)
   */
  const handleTabChange = (newTab) => {
    navigation.handleTabChange(
      newTab,
      caseCore.isEditing,
      caseCore.caseData,
      caseCore.formData,
      caseCore.setIsEditing,
      caseCore.setFormData
    );
  };

  const activeTasks = useMemo(
    () => (movements.tasks || []).filter((task) => task.status !== 'CONCLUIDA'),
    [movements.tasks]
  );

  const activeLinkedTasksCount = useMemo(
    () => activeTasks.filter((task) => !!task.movimentacao).length,
    [activeTasks]
  );

  const activeStandaloneTasksCount = useMemo(
    () => activeTasks.filter((task) => !task.movimentacao).length,
    [activeTasks]
  );

  if (caseCore.loading) {
    return (
      <div className="case-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando processo...</p>
        </div>
      </div>
    );
  }

  if (id && !caseCore.caseData) {
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
      {/* Navigation Bar */}
      <nav className="case-navbar">
        <div className="case-navbar-content">
          <div className="case-navbar-tabs">
            <button
              className={`nav-tab ${navigation.activeSection === 'info' ? 'active' : ''}`}
              onClick={() => handleTabChange('info')}
            >
              📋 Informações{caseCore.isEditing && navigation.activeSection === 'info' && ' *'}
            </button>
            <button
              className={`nav-tab ${navigation.activeSection === 'parties' ? 'active' : ''}`}
              onClick={() => handleTabChange('parties')}
            >
              👥 Partes
              {parties.parties.length > 0 && <span className="badge">{parties.parties.length}</span>}
            </button>
            <button
              className={`nav-tab ${navigation.activeSection === 'movimentacoes' ? 'active' : ''}`}
              onClick={() => handleTabChange('movimentacoes')}
            >
              ⚖️ Movimentações
              {activeLinkedTasksCount > 0 && <span className="badge">{activeLinkedTasksCount}</span>}
            </button>
            <button
              className={`nav-tab ${navigation.activeSection === 'documentos' ? 'active' : ''}`}
              onClick={() => handleTabChange('documentos')}
            >
              📄 Documentos
            </button>
            {!(systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION && systemSettings?.HIDE_PUBLICATIONS_TAB_WHEN_AUTO_SYNC) && (
              <button
                className={`nav-tab ${navigation.activeSection === 'publicacoes' ? 'active' : ''}`}
                onClick={() => handleTabChange('publicacoes')}
              >
                📰 Publicações
                {publications.publicacoes.length > 0 && <span className="badge">{publications.publicacoes.length}</span>}
              </button>
            )}
            <button
              className={`nav-tab ${navigation.activeSection === 'tasks' ? 'active' : ''}`}
              onClick={() => handleTabChange('tasks')}
            >
              ✅ Tarefas
              {activeStandaloneTasksCount > 0 && <span className="badge">{activeStandaloneTasksCount}</span>}
            </button>
            <button
              className={`nav-tab ${navigation.activeSection === 'financeiro' ? 'active' : ''}`}
              onClick={() => handleTabChange('financeiro')}
            >
              💰 Financeiro
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="case-content">
        {navigation.activeSection === 'info' && (
          <InformacaoTab
            id={id}
            formData={caseCore.formData}
            setFormData={caseCore.setFormData}
            isEditing={caseCore.isEditing}
            setIsEditing={caseCore.setIsEditing}
            saving={caseCore.saving}
            onSave={handleSaveCaseWithParties}
            onCancel={caseCore.handleCancel}
            onDelete={handleDelete}
            setActiveSection={navigation.setActiveSection}
            onOpenLatestMovimentacao={() => {
              navigation.setActiveSection('movimentacoes');
              movements.handleOpenLatestMovimentacao();
            }}
            onOpenOrigemMovimentacao={handleOpenOrigemMovimentacao}
            onAddPartyClick={handleOpenContactSelection}
            parties={parties.parties}
            caseData={caseCore.caseData}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            tribunalOptions={caseCore.tribunalOptions}
            statusOptions={caseCore.statusOptions}
            tipoAcaoOptions={caseCore.tipoAcaoOptions}
            onInputChange={caseCore.handleInputChange}
          />
        )}

        {navigation.activeSection === 'movimentacoes' && (
          <MovimentacoesTab 
            id={id}
            movimentacoes={movements.movimentacoes}
            numeroProcesso={caseCore.caseData?.numero_processo}
            tasks={movements.tasks}
            highlightedMovimentacaoId={navigation.highlightedMovimentacaoId}
            highlightedTaskId={navigation.highlightedTaskId}
            formatDate={formatDate}
            onDelete={movements.handleDeleteMovimentacao}
            onRefreshTasks={movements.loadTasks}
            onRefreshMovements={movements.loadMovimentacoes}
          />
        )}

        {navigation.activeSection === 'documentos' && (
          <DocumentosTab 
            documentos={[]}
            setDocumentos={() => {}}
          />
        )}

        {navigation.activeSection === 'publicacoes' && !(systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION && systemSettings?.HIDE_PUBLICATIONS_TAB_WHEN_AUTO_SYNC) && (
          <PublicacoesTab
            caseId={id}
            publicacoes={publications.publicacoes}
            loading={publications.loadingPublicacoes}
            systemSettings={systemSettings}
            onVincularPublicacao={(publicacao) => {
              console.log('Vincular publicação:', publicacao);
            }}
            onDesvincularPublicacao={(publicacaoId) => {
              publications.setPublicacoes(prev => prev.filter(p => p.id !== publicacaoId));
            }}
            onCreateMovement={movements.handleCreateMovementFromPublication}
            onRefresh={publications.loadPublicacoes}
          />
        )}

        {navigation.activeSection === 'tasks' && (
          <TasksTab
            caseId={id}
            caseData={caseCore.caseData}
            tasks={movements.tasks}
            setTasks={movements.setTasks}
            formatDate={formatDate}
            onRefreshTasks={movements.loadTasks}
          />
        )}

        {navigation.activeSection === 'financeiro' && (
          <FinanceiroTab
            id={id}
            formData={caseCore.formData}
            setFormData={caseCore.setFormData}
            recebimentos={financial.recebimentos}
            despesas={financial.despesas}
            participacaoTipo={financial.participacaoTipo}
            participacaoPercentual={financial.participacaoPercentual}
            participacaoValorFixo={financial.participacaoValorFixo}
            pagaMedianteGanho={financial.pagaMedianteGanho}
            recebimentoForm={financial.recebimentoForm}
            despesaForm={financial.despesaForm}
            onInputChange={caseCore.handleInputChange}
            setRecebimentoForm={financial.setRecebimentoForm}
            setDespesaForm={financial.setDespesaForm}
            setParticipacaoTipo={financial.setParticipacaoTipo}
            setParticipacaoPercentual={financial.setParticipacaoPercentual}
            setParticipacaoValorFixo={financial.setParticipacaoValorFixo}
            setPagaMedianteGanho={financial.setPagaMedianteGanho}
            onAddRecebimento={financial.handleAdicionarRecebimento}
            onRemoveRecebimento={financial.handleRemoverRecebimento}
            onAddDespesa={financial.handleAdicionarDespesa}
            onRemoveDespesa={financial.handleRemoverDespesa}
            autoSavingObservations={autoSavingFinancial}
          />
        )}

        {navigation.activeSection === 'parties' && (
          <PartiesTab 
            id={id}
            parties={parties.parties}
            loadingParties={parties.loadingParties}
            onAddPartyClick={handleOpenContactSelection}
            onRemoveParty={handleRemoveParty}
            onEditParty={parties.handleEditParty}
          />
        )}
      </main>

      {/* Modal de Seleção de Contato */}
      {modalsNotif.showSelectContactModal && (
        <SelectContactModal
          isOpen={modalsNotif.showSelectContactModal}
          onClose={() => modalsNotif.setShowSelectContactModal(false)}
          onSelectContact={handleSelectContactForParty}
          onCreateNew={handleCreateNewContactForParty}
          existingPartyContactIds={parties.parties.map(p => p.contact)}
        />
      )}

      {/* Modal de Novo Cliente/Parte */}
      {modalsNotif.showContactModal && (
        <ContactDetailModal
          contactId={null}
          isOpen={modalsNotif.showContactModal}
          onClose={() => modalsNotif.setShowContactModal(false)}
          onContactUpdated={modalsNotif.handleContactCreated}
          showLinkToProcessButton={false}
          onLinkToProcess={handleSelectContactForParty}
        />
      )}

      {/* Modal de Edição de Papel da Parte */}
      {parties.editingParty && (
        <div className="modal-overlay" onClick={() => parties.setEditingParty(null)}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Papel da Parte</h2>
              <button className="modal-close" onClick={() => parties.setEditingParty(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="selected-contact-info">
                <span className="contact-icon">
                  {parties.editingParty.contact_person_type === 'PF' ? '👤' : '🏢'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <strong>{parties.editingParty.contact_name}</strong>
                    <button
                      className="btn-edit-contact-link"
                      onClick={() => modalsNotif.setEditingContactId(parties.editingParty.contact)}
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
                  {parties.editingParty.contact_document && (
                    <span className="contact-doc"> • {parties.editingParty.contact_document}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Papel no Processo *</label>
                <select
                  value={parties.editingPartyFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    parties.setEditingPartyFormData(prev => ({
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
                    checked={parties.editingPartyFormData.is_client}
                    onChange={(e) => parties.setEditingPartyFormData(prev => ({ ...prev, is_client: e.target.checked }))}
                  />
                  <span>É cliente do escritório neste processo</span>
                </label>
              </div>

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={parties.editingPartyFormData.observacoes}
                  onChange={(e) => parties.setEditingPartyFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Ex: Cliente pela contraparte, não é nosso cliente..."
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => parties.setEditingParty(null)}>
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
      {modalsNotif.editingContactId && (
        <ContactDetailModal
          contactId={modalsNotif.editingContactId}
          isOpen={!!modalsNotif.editingContactId}
          onClose={() => modalsNotif.setEditingContactId(null)}
          onContactUpdated={() => {
            modalsNotif.handleContactUpdated();
            parties.loadParties();
          }}
          showLinkToProcessButton={false}
          openInEditMode={true}
        />
      )}

      {/* Modal de Definir Papel da Parte */}
      {parties.showAddPartyModal && parties.selectedContact && (
        <div className="modal-overlay" onClick={parties.handleCloseAddPartyModal}>
          <div className="modal-content party-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar ao Processo</h2>
              <button className="modal-close" onClick={parties.handleCloseAddPartyModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="selected-contact-info">
                <span className="contact-icon">
                  {parties.selectedContact.person_type === 'PF' ? '👤' : '🏢'}
                </span>
                <div>
                  <strong>{parties.selectedContact.name}</strong>
                  {parties.selectedContact.document_number && (
                    <span className="contact-doc"> • {parties.selectedContact.document_number}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Papel no Processo *</label>
                <select
                  value={parties.partyFormData.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    parties.setPartyFormData(prev => ({
                      ...prev,
                      role: newRole,
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

              {!['TESTEMUNHA', 'PERITO', 'CLIENTE'].includes(parties.partyFormData.role) && (() => {
                const hasExistingClient = parties.parties.some(p => p.is_client);
                return (
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={parties.partyFormData.is_client}
                        onChange={(e) => parties.setPartyFormData(prev => ({ ...prev, is_client: e.target.checked }))}
                        disabled={hasExistingClient}
                      />
                      <span style={{ opacity: hasExistingClient ? 0.6 : 1 }}>
                        É cliente do escritório neste processo
                      </span>
                    </label>
                    {hasExistingClient && (
                      <div className="field-hint" style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        ⓘ Este processo já possui um cliente cadastrado
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={parties.partyFormData.observacoes}
                  onChange={(e) => parties.setPartyFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows="3"
                  placeholder="Observações sobre a participação desta parte..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={parties.handleCloseAddPartyModal}
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

      {/* Delete Confirmation Modal */}
      {modalsNotif.showDeleteConfirmModal && (
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
                Tem certeza que deseja deletar este processo <strong>{caseCore.caseData?.numero_processo}</strong>?
              </p>
              
              {caseCore.caseData?.publicacao_origem_id && (
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
                    <strong>{caseCore.caseData?.publicacao_origem_numero_processo}</strong> - {caseCore.caseData?.publicacao_origem_tipo}
                  </p>
                </div>
              )}
              
              {caseCore.caseData?.publicacao_origem_id && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={modalsNotif.deletePublicationToo}
                      onChange={(e) => modalsNotif.setDeletePublicationToo(e.target.checked)}
                      style={{ marginTop: '0.25rem', cursor: 'pointer' }}
                    />
                    <span style={{ color: '#374151' }}>
                      <strong>Deletar também a publicação de origem</strong>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>
                        {modalsNotif.deletePublicationToo 
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

      {/* Toast - Renderizado por último para ficar visualmente acima */}
      {modalsNotif.toast && (
        <Toast
          isOpen={true}
          message={modalsNotif.toast.message}
          type={modalsNotif.toast.type}
          autoCloseMs={modalsNotif.toast.duration || 3000}
          onClose={() => modalsNotif.setToast(null)}
        />
      )}
    </div>
  );
}

export default CaseDetailPage;
