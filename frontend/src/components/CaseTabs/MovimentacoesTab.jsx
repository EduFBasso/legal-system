import { useEffect, useMemo, useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovimentacoes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return movimentacoes;

    return movimentacoes.filter((mov) => {
      const searchableText = [
        mov.titulo,
        mov.descricao,
        mov.tipo,
        mov.tipo_display,
        mov.origem,
        mov.origem_display,
        mov.data,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [movimentacoes, searchTerm]);

  useEffect(() => {
    if (!highlightedMovimentacaoId) return;

    const element = document.getElementById(`movimentacao-${highlightedMovimentacaoId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedMovimentacaoId, filteredMovimentacoes]);

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
        
        {movimentacoes.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar movimentações por título, descrição, tipo, origem ou data..."
              className="financeiro-input"
              style={{ width: '100%' }}
            />
          </div>
        )}

        {movimentacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhuma movimentação cadastrada"
            hint="Clique em 'Nova Movimentação' para adicionar despachos, decisões, audiências, etc."
          />
        ) : filteredMovimentacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhuma movimentação encontrada"
            hint="Tente ajustar o texto de busca"
          />
        ) : (
          <div className="movimentacoes-timeline">
            {filteredMovimentacoes.map(mov => {
              const truncateText = (text, maxLength) => {
                if (!text || text.length <= maxLength) return text;
                return text.substring(0, maxLength) + '...';
              };

              return (
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
                    <div className="timeline-titulo">
                      {mov.publicacao_id ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(`/publications/${mov.publicacao_id}/details`, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
                          }}
                          style={{ 
                            color: '#2563eb', 
                            textDecoration: 'none',
                            cursor: 'pointer'
                          }}
                          title="Clique para ver publicação completa"
                        >
                          {truncateText(mov.titulo, 180)} 🔗
                        </a>
                      ) : (
                        truncateText(mov.titulo, 180)
                      )}
                    </div>
                    {mov.descricao && !mov.publicacao_id && (
                      <div className="timeline-descricao">
                        {truncateText(mov.descricao, 250)}
                      </div>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovimentacoesTab;
