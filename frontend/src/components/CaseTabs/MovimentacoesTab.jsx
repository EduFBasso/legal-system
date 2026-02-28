import { useEffect } from 'react';
import { Plus, FileText, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';

/**
 * MovimentacoesTab - Aba de Movimentações Processuais
 * Exibe lista de movimentações (publicações DJE, despachos, decisões)
 */
function MovimentacoesTab({ 
  id,
  movimentacoes = [],
  highlightedMovimentacaoId = null,
  onOpenModal = () => {},
  onEdit = () => {},
  onDelete = () => {}
}) {
  useEffect(() => {
    if (!highlightedMovimentacaoId) return;

    const element = document.getElementById(`movimentacao-${highlightedMovimentacaoId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedMovimentacaoId, movimentacoes]);

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">⚖️ Movimentações Processuais</h2>
            <p className="section-subtitle">Publicações do DJE, despachos, decisões e movimentações do tribunal</p>
          </div>
          {id && (
            <button className="btn btn-primary" onClick={onOpenModal}>
              <Plus size={18} /> Nova Movimentação
            </button>
          )}
        </div>
        
        {movimentacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhuma movimentação cadastrada"
            hint="Clique em 'Nova Movimentação' para adicionar despachos, decisões, audiências, etc."
          />
        ) : (
          <div className="movimentacoes-timeline">
            {movimentacoes.map(mov => (
              <div
                key={mov.id}
                id={`movimentacao-${mov.id}`}
                className="timeline-item"
                style={
                  highlightedMovimentacaoId === mov.id
                    ? {
                        background: '#eff6ff',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.15)',
                        transition: 'all 0.3s ease',
                      }
                    : undefined
                }
              >
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
                          onClick={() => onEdit(mov)}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon-small btn-danger" 
                          onClick={() => onDelete(mov.id)}
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
  );
}

export default MovimentacoesTab;
