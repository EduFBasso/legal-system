import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import PublicationCard from '../components/PublicationCard';
import Toast from '../components/common/Toast';
import publicationsService from '../services/publicationsService';
import './PendingPublicationsPage.css';

export default function PendingPublicationsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingPublications, setPendingPublications] = useState([]);
  const [toast, setToast] = useState(null);
  const [integrating, setIntegrating] = useState(null);

  useEffect(() => {
    loadPending();
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
      window.location.href = `/cases/new?pub_id=${pub.id_api}`;
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
    window.location.href = `/cases/new?pub_id=${pub.id_api}`;
  };

  const handleDelete = async (pub) => {
    const confirmed = window.confirm('Tem certeza que deseja apagar esta publicação?');
    if (!confirmed) return;

    setIntegrating(pub.id_api);
    try {
      const result = await publicationsService.deletePublication(pub.id_api);
      if (result.success) {
        setToast({ message: '✅ Publicação apagada com sucesso!', type: 'success' });
        setTimeout(() => loadPending(), 500);
      } else {
        setToast({ message: result.error || '❌ Erro ao apagar publicação', type: 'error' });
      }
    } catch (err) {
      setToast({ message: err.message || '❌ Erro ao apagar publicação', type: 'error' });
    } finally {
      setIntegrating(null);
    }
  };

  return (
    <div className="pending-publications-page">
      <header className="pending-page-header">
        <div>
          <h1>📋 Publicações Pendentes</h1>
          <p>Revise e integre publicações encontradas nas buscas.</p>
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
              onClick={() => {}}
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
    </div>
  );
}
