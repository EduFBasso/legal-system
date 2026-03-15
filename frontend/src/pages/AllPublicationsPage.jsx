import { useEffect, useState, useCallback } from 'react';
import { FileText } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import PublicationCard from '../components/PublicationCard';
import Toast from '../components/common/Toast';
import PublicationDeleteDialogs from '../components/publications/PublicationDeleteDialogs';
import { usePublicationNotificationRead } from '../hooks/usePublicationNotificationRead';
import publicationsService from '../services/publicationsService';
import { subscribePublicationSync } from '../services/publicationSync';
import {
  getPublicationDeleteBlockedMessage,
  getPublicationDeleteSuccessMessage,
} from '../utils/publicationDeleteFeedback';
import './AllPublicationsPage.css';

export default function AllPublicationsPage() {
  const markPublicationNotificationAsRead = usePublicationNotificationRead();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allPublications, setAllPublications] = useState([]);
  const [toast, setToast] = useState(null);
  const [, setIntegrating] = useState(null);
  const [statusFilter, setStatusFilter] = useState(''); // '' = todas, 'PENDING', 'INTEGRATED'
  const [searchQuery, setSearchQuery] = useState(''); // para filtrar por nome/número
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeletePublication, setPendingDeletePublication] = useState(null);
  const [showDeleteBlockedDialog, setShowDeleteBlockedDialog] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('');

  const loadAllPublications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await publicationsService.getAllPublications({
        integrationStatus: statusFilter,
        limit: 100
      });
      if (result.success) {
        setAllPublications(result.results || []);
      } else {
        setError(result.error || 'Erro ao carregar publicações');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar publicações');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAllPublications();
  }, [loadAllPublications]);

  useEffect(() => {
    const unsubscribe = subscribePublicationSync((event) => {
      if (event?.type === 'PUBLICATION_INTEGRATED') {
        loadAllPublications();
      }
    });

    return unsubscribe;
  }, [loadAllPublications]);

  const handleIntegrate = async (pub) => {
    if (!pub.case_suggestion?.id) {
      window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
      return;
    }

    setIntegrating(pub.id_api);
    try {
      const result = await publicationsService.integratePublication(pub.id_api, {
        caseId: pub.case_suggestion.id,
        createMovement: true
      });

      if (result.success) {
        setToast({ message: '✅ Publicação vinculada com sucesso!', type: 'success' });
        setTimeout(() => loadAllPublications(), 500);
      } else {
        setToast({ message: result.error || '❌ Erro ao integrar publicação', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message || '❌ Erro ao integrar publicação', type: 'error' });
    } finally {
      setIntegrating(null);
    }
  };

  const handleCreateCase = async (pub) => {
    setIntegrating(pub.id_api);
    try {
      const latest = await publicationsService.getPublicationById(pub.id_api);
      const latestPublication = latest?.publication;
      const linkedCaseId = latestPublication?.case_id;
      const suggestedCaseId = latestPublication?.case_suggestion?.id;

      if (linkedCaseId) {
        setToast({ message: `✅ Publicação já vinculada ao caso #${linkedCaseId}`, type: 'success' });
        window.open(`/cases/${linkedCaseId}`, '_blank', 'noopener,noreferrer');
        await loadAllPublications();
        return;
      }

      if (suggestedCaseId) {
        const result = await publicationsService.integratePublication(pub.id_api, {
          caseId: suggestedCaseId,
          createMovement: true,
        });

        if (result.success) {
          setToast({ message: `✅ Publicação vinculada ao caso #${suggestedCaseId}`, type: 'success' });
          await loadAllPublications();
          return;
        }
      }

      window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
    } finally {
      setIntegrating(null);
    }
  };

  const handleOpenPublicationDetails = (pub) => {
    const url = `/publications/${pub.id_api}/details`;
    window.open(url, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
  };

  const handleDelete = async (pub) => {
    const linkedToCase = !!pub.case_id || pub.integration_status === 'INTEGRATED';

    if (linkedToCase) {
      setDeleteBlockedMessage('Esta publicação não pode ser excluída porque está vinculada a um processo no sistema.');
      setShowDeleteBlockedDialog(true);
      return;
    }

    setPendingDeletePublication(pub);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeletePublication = async () => {
    if (!pendingDeletePublication) return;

    setShowDeleteConfirmDialog(false);
    setIntegrating(pendingDeletePublication.id_api);
    try {
      const result = await publicationsService.deletePublication(pendingDeletePublication.id_api);
      if (result.success) {
        setToast({
          message: getPublicationDeleteSuccessMessage({
            single: true,
            notificationsDeleted: result.notifications_deleted || 0,
          }),
          type: 'success'
        });
        setTimeout(() => loadAllPublications(), 500);
      } else {
        setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
          result.error,
          'Não foi possível excluir a publicação.'
        ));
        setShowDeleteBlockedDialog(true);
      }
    } catch (err) {
      setDeleteBlockedMessage(getPublicationDeleteBlockedMessage(
        err.message,
        'Não foi possível excluir a publicação.'
      ));
      setShowDeleteBlockedDialog(true);
    } finally {
      setIntegrating(null);
      setPendingDeletePublication(null);
    }
  };



  // Filtrar publicações por searchQuery (nome, número da publicação)
  const filteredPublications = allPublications.filter((pub) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    // Buscar por número do processo
    if (pub.numero_processo && pub.numero_processo.toLowerCase().includes(query)) {
      return true;
    }

    // Buscar por órgão/resumo (a partir de 3 caracteres)
    if (query.length >= 3) {
      if (pub.orgao && pub.orgao.toLowerCase().includes(query)) {
        return true;
      }
      if (pub.texto_resumo && pub.texto_resumo.toLowerCase().includes(query)) {
        return true;
      }
      if (pub.texto_completo && pub.texto_completo.toLowerCase().includes(query)) {
        return true;
      }
    }

    return false;
  });

  const pendingCount = allPublications.filter(p => p.integration_status === 'PENDING').length;
  const integratedCount = allPublications.filter(p => p.integration_status === 'INTEGRATED').length;

  return (
    <div className="all-publications-page">
      <header className="all-page-header">
        <div>
          <h1>📚 Todas as Publicações</h1>
        </div>
      </header>

      {/* Search Input */}
      <div className="all-publications-search">
        <input
          type="text"
          placeholder="🔍 Procure por número do processo ou nome da publicação..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-all-publications"
        />
        {searchQuery && (
          <button 
            className="btn-clear-search"
            onClick={() => setSearchQuery('')}
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtros de Status */}
      <div className="all-publications-filters">
        <button 
          className={`status-filter ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          📊 Todas ({allPublications.length})
        </button>
        <button 
          className={`status-filter ${statusFilter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setStatusFilter('PENDING')}
        >
          ⏳ Não Vinculadas ({pendingCount})
        </button>
        <button 
          className={`status-filter ${statusFilter === 'INTEGRATED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('INTEGRATED')}
        >
          ✅ Vinculadas ({integratedCount})
        </button>
      </div>

      {loading ? (
        <div className="all-publications-grid">
          {/* Skeleton loading cards */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="publication-card skeleton-card">
              <div className="skeleton-header"></div>
              <div className="skeleton-body">
                <div className="skeleton-line skeleton-line-title"></div>
                <div className="skeleton-line skeleton-line-meta"></div>
                <div className="skeleton-line skeleton-line-text"></div>
                <div className="skeleton-line skeleton-line-text"></div>
              </div>
              <div className="skeleton-footer">
                <div className="skeleton-button"></div>
                <div className="skeleton-button"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="all-error">{error}</div>
      ) : allPublications.length === 0 ? (
        <EmptyState
          icon={FileText}
          message={statusFilter === 'PENDING' ? "Nenhuma publicação não vinculada" : "Nenhuma publicação no sistema"}
          hint={statusFilter === 'PENDING' ? "Todas as publicações foram vinculadas a processos" : "Comece pela aba 'Buscar Publicações' para encontrar novas publicações"}
        />
      ) : filteredPublications.length === 0 ? (
        <EmptyState
          icon={FileText}
          message={`Nenhuma publicação encontrada${searchQuery ? ` para "${searchQuery}"` : ''}`}
          hint={searchQuery ? "Tente uma busca diferente" : ""}
        />
      ) : (
        <div className="all-publications-grid">
          {filteredPublications.map((pub) => (
            <div key={pub.id_api} className="publication-card-wrapper">
              <PublicationCard
                publication={pub}
                onClick={() => {
                  markPublicationNotificationAsRead(pub.id_api);
                  handleOpenPublicationDetails(pub);
                }}
                highlighted={false}
                showActionButtons={true}
                onIntegrate={() => handleIntegrate(pub)}
                onCreateCase={() => handleCreateCase(pub)}
                onDelete={() => handleDelete(pub)}
                caseSuggestion={pub.case_suggestion}
              />
            </div>
          ))}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <PublicationDeleteDialogs
        showConfirm={showDeleteConfirmDialog}
        pendingDeletePublication={pendingDeletePublication}
        onConfirm={confirmDeletePublication}
        onCancelConfirm={() => {
          setShowDeleteConfirmDialog(false);
          setPendingDeletePublication(null);
        }}
        showBlocked={showDeleteBlockedDialog}
        blockedMessage={deleteBlockedMessage}
        onCloseBlocked={() => setShowDeleteBlockedDialog(false)}
      />
    </div>
  );
}
