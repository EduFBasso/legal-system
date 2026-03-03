import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPrazos } from '../services/casePrazosService';
import './DeadlinesSummary.css';

/**
 * Componente para exibir resumo de prazos na sidebar
 * Mostra prazos agrupados por urgência (URGENTÍSSIMO, URGENTE, NORMAL)
 * com cores convencionais (vermelho, laranja, verde)
 */
export default function DeadlinesSummary() {
  const navigate = useNavigate();
  const [prazos, setPrazos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar todos os prazos do sistema
  useEffect(() => {
    const fetchPrazos = async () => {
      try {
        setLoading(true);
        const data = await getAllPrazos();
        setPrazos(data || []);
      } catch (error) {
        console.error('Erro ao buscar prazos:', error);
        setPrazos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrazos();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchPrazos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Agrupar prazos por urgência
  const prazosPorUrgencia = {
    URGENTISSIMO: prazos.filter(p => p.status_urgencia === 'URGENTISSIMO'),
    URGENTE: prazos.filter(p => p.status_urgencia === 'URGENTE'),
    NORMAL: prazos.filter(p => p.status_urgencia === 'NORMAL'),
  };

  const totalPrazos = prazos.length;

  const handlePrazoClick = (prazo) => {
    // Navegar para a página do caso, aba de Prazos
    navigate(`/cases/${prazo.case}/prazos`);
  };

  const handleViewAll = () => {
    // Navegar para a primeira página de casos (futuramente pode ser uma página de prazos global)
    navigate('/cases');
  };

  const getUrgenciaLabel = (urgencia) => {
    const labels = {
      URGENTISSIMO: 'Urgentíssimo',
      URGENTE: 'Urgente',
      NORMAL: 'Normal',
    };
    return labels[urgencia] || urgencia;
  };

  const getUrgenciaIcon = (urgencia) => {
    const icons = {
      URGENTISSIMO: '🔴',
      URGENTE: '🟠',
      NORMAL: '🟢',
    };
    return icons[urgencia] || '⏰';
  };

  const formatDaysRemaining = (diasRestantes) => {
    if (diasRestantes === null || diasRestantes === undefined) return 'Sem prazo';
    if (diasRestantes < 0) return `Atrasado ${Math.abs(diasRestantes)}d`;
    if (diasRestantes === 0) return 'Hoje';
    if (diasRestantes === 1) return 'Amanhã';
    return `${diasRestantes}d`;
  };

  if (loading) {
    return (
      <div className="deadlines-summary">
        <div className="deadlines-loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="deadlines-summary">
      {/* Header com contador total */}
      <div className="deadlines-header" onClick={handleViewAll}>
        <div className="deadline-count-badge">
          {totalPrazos > 0 ? (
            <>
              <span className="count-number">{totalPrazos}</span>
              <span className="count-label">{totalPrazos === 1 ? 'prazo' : 'prazos'}</span>
            </>
          ) : (
            <span className="count-label">Nenhum prazo</span>
          )}
        </div>
        <span className="view-all-link">Ver todos →</span>
      </div>

      {/* Prazos agrupados por urgência */}
      {totalPrazos > 0 ? (
        <div className="deadlines-groups">
          {/* URGENTÍSSIMO */}
          {prazosPorUrgencia.URGENTISSIMO.length > 0 && (
            <div className="deadline-group urgentissimo-group">
              <div className="group-header">
                <span className="group-icon">{getUrgenciaIcon('URGENTISSIMO')}</span>
                <span className="group-label">{getUrgenciaLabel('URGENTISSIMO')}</span>
                <span className="group-count">{prazosPorUrgencia.URGENTISSIMO.length}</span>
              </div>
              <div className="deadline-items">
                {prazosPorUrgencia.URGENTISSIMO.slice(0, 3).map((prazo) => (
                  <div
                    key={prazo.id}
                    className="deadline-item urgentissimo"
                    onClick={() => handlePrazoClick(prazo)}
                  >
                    <div className="deadline-title">{prazo.titulo || 'Sem título'}</div>
                    <div className="deadline-days">{formatDaysRemaining(prazo.dias_restantes)}</div>
                  </div>
                ))}
                {prazosPorUrgencia.URGENTISSIMO.length > 3 && (
                  <div className="more-deadlines" onClick={handleViewAll}>
                    +{prazosPorUrgencia.URGENTISSIMO.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )}

          {/* URGENTE */}
          {prazosPorUrgencia.URGENTE.length > 0 && (
            <div className="deadline-group urgente-group">
              <div className="group-header">
                <span className="group-icon">{getUrgenciaIcon('URGENTE')}</span>
                <span className="group-label">{getUrgenciaLabel('URGENTE')}</span>
                <span className="group-count">{prazosPorUrgencia.URGENTE.length}</span>
              </div>
              <div className="deadline-items">
                {prazosPorUrgencia.URGENTE.slice(0, 3).map((prazo) => (
                  <div
                    key={prazo.id}
                    className="deadline-item urgente"
                    onClick={() => handlePrazoClick(prazo)}
                  >
                    <div className="deadline-title">{prazo.titulo || 'Sem título'}</div>
                    <div className="deadline-days">{formatDaysRemaining(prazo.dias_restantes)}</div>
                  </div>
                ))}
                {prazosPorUrgencia.URGENTE.length > 3 && (
                  <div className="more-deadlines" onClick={handleViewAll}>
                    +{prazosPorUrgencia.URGENTE.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NORMAL */}
          {prazosPorUrgencia.NORMAL.length > 0 && (
            <div className="deadline-group normal-group">
              <div className="group-header">
                <span className="group-icon">{getUrgenciaIcon('NORMAL')}</span>
                <span className="group-label">{getUrgenciaLabel('NORMAL')}</span>
                <span className="group-count">{prazosPorUrgencia.NORMAL.length}</span>
              </div>
              <div className="deadline-items">
                {prazosPorUrgencia.NORMAL.slice(0, 2).map((prazo) => (
                  <div
                    key={prazo.id}
                    className="deadline-item normal"
                    onClick={() => handlePrazoClick(prazo)}
                  >
                    <div className="deadline-title">{prazo.titulo || 'Sem título'}</div>
                    <div className="deadline-days">{formatDaysRemaining(prazo.dias_restantes)}</div>
                  </div>
                ))}
                {prazosPorUrgencia.NORMAL.length > 2 && (
                  <div className="more-deadlines" onClick={handleViewAll}>
                    +{prazosPorUrgencia.NORMAL.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-deadlines">
          <span className="no-deadlines-icon">✅</span>
          <p>Nenhum prazo cadastrado</p>
        </div>
      )}
    </div>
  );
}
