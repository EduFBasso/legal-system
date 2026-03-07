import { useEffect, useState } from 'react';
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
import './PendingPublicationsPage.css';

export default function PendingPublicationsPage() {
  const markPublicationNotificationAsRead = usePublicationNotificationRead();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingPublications, setPendingPublications] = useState([]);
  const [toast, setToast] = useState(null);
  const [, setIntegrating] = useState(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [pendingDeletePublication, setPendingDeletePublication] = useState(null);
  const [showDeleteBlockedDialog, setShowDeleteBlockedDialog] = useState(false);
  const [deleteBlockedMessage, setDeleteBlockedMessage] = useState('');

  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribePublicationSync((event) => {
      if (event?.type === 'PUBLICATION_INTEGRATED') {
        loadPending();
      }
    });

    return unsubscribe;
  }, []);

  const loadPending = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await publicationsService.getPendingPublications();
      if (result.success) {
        setPendingPublications(result.results || []);
      } else {
        setError(result.error || 'Erro ao carregar pendencias');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar pendencias');
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrate = async (pub) => {
    if (!pub.case_suggestion?.id) {
      // Redirecionar para criar novo caso
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
        setTimeout(() => loadPending(), 500);
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
    window.open(`/cases/new?pub_id=${pub.id_api}`, '_blank', 'noopener,noreferrer');
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
        setTimeout(() => loadPending(), 500);
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

  return (
    <div className="pending-publications-page">
      <header className="pending-page-header">
        <div>
          <h1>📋 Publicações Pendentes</h1>
        </div>
      </header>

      {loading ? (
        <div className="pending-publications-grid">
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
        <div className="pending-error">{error}</div>
      ) : pendingPublications.length === 0 ? (
        <EmptyState
          icon={FileText}
          message="Nenhuma publicação pendente"
          hint="Quando optar por adiar a integração, as publicações aparecerão aqui"
        />
      ) : (
        <div className="pending-publications-grid">
          {pendingPublications.map((pub) => (
            <PublicationCard
              key={pub.id_api}
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
