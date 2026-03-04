import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePublicationsContext } from '../contexts/PublicationsContext';
import { useSettings } from '../contexts/SettingsContext';
import publicationsService from '../services/publicationsService';
import PublicationsSearchForm from  '../components/PublicationsSearchForm';
import PublicationsList from '../components/PublicationsList';
import PublicationsStats from '../components/PublicationsStats';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import './PublicationsPage.css';

/**
 * Página principal de publicações
 * Usa Context API e componentes modulares para maior manutenibilidade
 */
export default function PublicationsPage() {
  const { settings } = useSettings();
  const location = useLocation();
  
  // Estado de seleção para exclusão
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showIntegrateConfirm, setShowIntegrateConfirm] = useState(false);
  const [integrateCount, setIntegrateCount] = useState(0);
  const [integrateLoading, setIntegrateLoading] = useState(false);
  const [showDeleteBlockedDialog, setShowDeleteBlockedDialog] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('');
  
  // Obter estado e ações do contexto
  const {
    publications,
    loading,
    searchParams,
    lastSearch,
    toast,
    search,
    loadLastSearch,
    openModal,
    hideToast,
    showToast
  } = usePublicationsContext();

  /**
   * Handler para busca com filtros
   * Adiciona retroactiveDays do settings
   * Se autoIntegration ativado, integra automaticamente
   */
  const handleSearch = useCallback(async (filters) => {
    const retroactiveDays = settings.retroactiveDays ?? 7;
    const autoIntegration = settings.autoIntegration ?? false;

    const result = await search({
      dataInicio: filters.dataInicio,
      dataFim: filters.dataFim,
      tribunais: filters.tribunais,
      retroactiveDays
    });

    if (result?.success && result.total_publicacoes > 0) {
      setIntegrateCount(result.total_publicacoes);
      
      if (autoIntegration) {
        // Integração automática ativada - integra sem confirmação
        await handleConfirmIntegrate();
      } else {
        // Integração manual - mostra modal
        setShowIntegrateConfirm(true);
      }
    }
  }, [search, settings.retroactiveDays, settings.autoIntegration]);

  const handleConfirmIntegrate = useCallback(async () => {
    setIntegrateLoading(true);
    try {
      const result = await publicationsService.batchIntegratePublications({
        autoLink: true,
        createMovement: false,
        autoIntegration: settings.autoIntegration ?? false
      });

      if (result.success) {
        showToast(
          `${result.integrated} integrada(s), ${result.pending} pendente(s), ${result.ignored} ignorada(s).`,
          'success'
        );
      } else {
        showToast(result.error || 'Erro ao integrar publicacoes.', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Erro ao integrar publicacoes.', 'error');
    } finally {
      setIntegrateLoading(false);
      setShowIntegrateConfirm(false);
    }
  }, [showToast, settings.autoIntegration]);

  /**
   * Funções de seleção para exclusão
   */
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const toggleSelectPublication = (idApi) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idApi)) {
        newSet.delete(idApi);
      } else {
        newSet.add(idApi);
      }
      return newSet;
    });
  };

  const selectAllPublications = () => {
    const allIds = new Set(publications.map(p => p.id_api));
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  /**
   * Handler para deletar publicações selecionadas
   */
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmMsg = `Apagar ${selectedIds.size} publicação(ões) selecionada(s)? Esta ação não pode ser desfeita.`;
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const result = await publicationsService.deleteMultiplePublications(Array.from(selectedIds));
      
      if (result.success) {
        const msg = `${result.deleted} publicação(ões) marcada(s) como deletadas!`;
        const notifMsg = result.notifications_updated > 0 
          ? `\n${result.notifications_updated} notificação(ões) relacionada(s) marcadas como lidas.` 
          : '';
        alert(msg + notifMsg);
        setSelectedIds(new Set());
        setSelectionMode(false);
        // Recarregar lista
        await loadLastSearch();
      } else {
        alert(`Erro ao deletar: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert(`Erro ao deletar publicações: ${error.message}`);
    }
  };

  /**
   * Handler para deletar TODAS as publicações
   */
  const handleDeleteSingle = async (idApi) => {
    try {
      const result = await publicationsService.deletePublication(idApi);
      
      if (result.success) {
        const notifMsg = result.notifications_updated > 0
          ? ` (${result.notifications_updated} notificação(ões) atualizadas)`
          : '';
        showToast(`✅ Publicação removida da listagem${notifMsg}.`, 'success');
        // Recarregar lista
        await loadLastSearch();
      } else {
        setDeleteBlockedMessage(result.error || 'Não foi possível excluir a publicação.');
        setShowDeleteBlockedDialog(true);
      }
    } catch (error) {
      const message = (error?.message || '').toLowerCase();
      if (message.includes('não é possível apagar publicação com processo vinculado')) {
        setDeleteBlockedMessage('Esta publicação não pode ser excluída porque está vinculada a um processo no sistema.');
      } else {
        setDeleteBlockedMessage(error.message || 'Não foi possível excluir a publicação.');
      }
      setShowDeleteBlockedDialog(true);
    }
  };

  /**
   * Handler para integrar uma publicação individual da aba Publicações
   */
  const handleIntegrateSingle = async (pub) => {
    if (pub.case_suggestion?.id) {
      // Tem case_suggestion - perguntar se deseja vincular
      const confirmed = window.confirm(
        `Vincular ao caso #${pub.case_suggestion.id}?`
      );
      if (!confirmed) return;

      try {
        const result = await publicationsService.integratePublication(pub.id_api, {
          caseId: pub.case_suggestion.id,
          createMovement: false
        });

        if (result.success) {
          showToast('✅ Publicação integrada com sucesso!', 'success');
          await loadLastSearch();
        } else {
          showToast(result.error || '❌ Erro ao integrar publicação', 'error');
        }
      } catch (error) {
        showToast(error.message || '❌ Erro ao integrar publicação', 'error');
      }
    } else {
      // Sem case_suggestion - deixar pendente ou criar novo caso
      const confirmed = window.confirm(
        'Nenhum caso foi encontrado automaticamente. Deseja deixar pendente para integração posterior?'
      );
      if (!confirmed) {
        window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
      } else {
        try {
          const result = await publicationsService.integratePublication(pub.id_api, {
            createMovement: false
          });
          if (result.success) {
            showToast('⏸️ Publicação deixada pendente', 'info');
            await loadLastSearch();
          }
        } catch (error) {
          showToast(error.message || '❌ Erro ao atualizar publicação', 'error');
        }
      }
    }
  };

  /**
   * Handler para criar novo caso a partir de uma publicação
   */
  const handleCreateCaseSingle = async (pub) => {
    window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteAll = async () => {
    const totalCount = publications.length;
    if (totalCount === 0) return;
    
    const confirmMsg = `Marcar TODAS as ${totalCount} publicações como deletadas?\n\nAs publicações serão ocultadas mas permanecerão no banco para auditoria.\nO histórico de buscas será removido.\nNotificações relacionadas serão marcadas como lidas.`;
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      const result = await publicationsService.deleteAllPublications();
      
      if (result.success) {
        const msg = `Todas as ${result.deleted} publicações foram marcadas como deletadas!`;
        const notifMsg = result.notifications_updated > 0
          ? `\n${result.notifications_updated} notificação(ões) relacionada(s) marcadas como lidas.`
          : '';
        const historyMsg = result.history_deleted > 0
          ? `\n${result.history_deleted} registro(s) de histórico removidos.`
          : '';
        alert(msg + notifMsg + historyMsg);
        setSelectedIds(new Set());
        setSelectionMode(false);
        // Recarregar lista
        await loadLastSearch();
      } else {
        alert(`Erro ao deletar: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert(`Erro ao deletar todas publicações: ${error.message}`);
    }
  };

  /**
   * Detectar navegação do cartão de Controles
   * Carrega última busca quando vem com state específico
   */
  useEffect(() => {
    if (location.state?.loadLastSearch) {
      loadLastSearch();
      // Limpar state para não recarregar ao voltar
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadLastSearch]);

  /**
   * Listener para evento customizado de reload da sidebar
   * Corrige bug de navegação para mesma rota
   */
  useEffect(() => {
    const handleReloadFromSidebar = () => {
      loadLastSearch();
    };
    
    window.addEventListener('reloadPublicationsFromSidebar', handleReloadFromSidebar);
    
    return () => {
      window.removeEventListener('reloadPublicationsFromSidebar', handleReloadFromSidebar);
    };
  }, [loadLastSearch]);

  return (
    <div className="publications-page">
      {/* Header */}
      <div className="publications-header">
        <div className="header-info">
          <h2>📰 Publicações Jurídicas</h2>
          {publications.length > 0 && (
            <p className="header-subtitle">
              {publications.length} {publications.length === 1 ? 'publicação encontrada' : 'publicações encontradas'}
            </p>
          )}
        </div>
      </div>

      {/* Search Form */}
      <PublicationsSearchForm onSearch={handleSearch} isLoading={loading} />

      {/* Last Search Stats Panel */}
      <PublicationsStats 
        lastSearch={lastSearch} 
        onLoadSearch={loadLastSearch} 
      />

      {/* Action Buttons - Deletar publicações */}
      {publications.length > 0 && (
        <div className="publications-actions">
          <button 
            className={`btn-selection-mode ${selectionMode ? 'active' : ''}`}
            onClick={toggleSelectionMode}
          >
            {selectionMode ? '✓ Modo Seleção' : '☑️ Selecionar'}
          </button>

          {selectionMode && (
            <>
              <button 
                className="btn-select-all"
                onClick={selectedIds.size === publications.length ? deselectAll : selectAllPublications}
              >
                {selectedIds.size === publications.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>

              <button 
                className="btn-delete-selected"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
              >
                🗑️ Apagar ({selectedIds.size})
              </button>
            </>
          )}

          <button 
            className="btn-delete-all-publications"
            onClick={handleDeleteAll}
          >
            🗑️ Apagar tudo ({publications.length})
          </button>
        </div>
      )}

      {/* Publications List */}
      <PublicationsList
        publications={publications}
        loading={loading}
        searchParams={searchParams}
        onCardClick={openModal}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectPublication}
        onDelete={handleDeleteSingle}
        showActionButtons={true}
        onIntegrate={handleIntegrateSingle}
        onCreateCase={handleCreateCaseSingle}
      />

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <ConfirmDialog
        isOpen={showIntegrateConfirm}
        type="info"
        title="🔗 Integrar publicações agora?"
        message={`Encontramos ${integrateCount} publicação(ões). Deseja integrar agora?`}
        warningMessage="Se escolher 'Deixar pendente', elas ficarão na aba Pendentes para integração posterior."
        confirmText={integrateLoading ? 'Integrando...' : '✅ Integrar agora'}
        cancelText="⏸️ Deixar pendente"
        onConfirm={handleConfirmIntegrate}
        onCancel={() => setShowIntegrateConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteBlockedDialog}
        type="danger"
        title="🚫 Exclusão não permitida"
        message={deleteBlockedMessage || 'Esta publicação não pode ser excluída porque está vinculada a um processo no sistema.'}
        warningMessage="Para preservar a rastreabilidade jurídica, publicações vinculadas permanecem protegidas."
        confirmText="Entendi"
        onConfirm={() => setShowDeleteBlockedDialog(false)}
        onCancel={() => setShowDeleteBlockedDialog(false)}
        showCancel={false}
        closeOnEnter={true}
      />
    </div>
  );
}
