import { useState } from 'react';
import { Link2, FileText, Calendar, Building2, ExternalLink, PlusCircle } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { generateAllConsultaLinks, openConsultaWithCopy } from '../../utils/consultaLinksHelper';
import './PublicacoesTab.css';

/**
 * PublicacoesTab - Aba de Publicações Vinculadas ao Processo
 * 
 * Exibe publicações do DJE relacionadas a este processo.
 * Permite vincular publicações existentes ou criar caso a partir de publicação.
 * 
 * TODO (decisões arquiteturais):
 * - [ ] Onde salvar vínculo: campo `case` em Publication OU tabela intermediária?
 * - [ ] Ordenação padrão: data_disponibilizacao DESC ou ASC?
 * - [ ] Integrar com Movimentações? (criar movimentação automática ao vincular pub)
 * - [ ] Permitir desvincular publicação?
 */
function PublicacoesTab({ 
  publicacoes = [], 
  loading = false,
  systemSettings = null,
  onVincularPublicacao = () => {},
  onDesvincularPublicacao = () => {},
  onCreateMovement = () => {},
  onRefresh = () => {},
}) {
  const [filter, setFilter] = useState('todas'); // 'todas', 'intimacoes', 'despachos', 'outras'
  
  /**
   * Copia número do processo e abre link de consulta no tribunal
   */
  const handleConsultarProcesso = (e, url, numeroProcesso) => {
    e.stopPropagation();
    openConsultaWithCopy(url, numeroProcesso, e.currentTarget);
  };
  
  /**
   * Abre página de detalhes da publicação em nova janela
   */
  const handleOpenPublicationDetails = (pub) => {
    const url = `/publications/${pub.id_api}/details`;
    window.open(url, '_blank', 'width=1200,height=800,resizable=yes,scrollbars=yes');
  };

  /**
   * Filtra publicações por tipo
   */
  const getFilteredPublicacoes = () => {
    if (filter === 'todas') return publicacoes;
    
    return publicacoes.filter(pub => {
      const tipo = pub.tipo_comunicacao?.toLowerCase() || '';
      
      if (filter === 'intimacoes') return tipo.includes('intimação');
      if (filter === 'despachos') return tipo.includes('despacho');
      if (filter === 'outras') return !tipo.includes('intimação') && !tipo.includes('despacho');
      
      return true;
    });
  };

  const filtered = getFilteredPublicacoes();

  /**
   * Trunca texto para preview
   */
  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="case-section">
      <div className="section-card">
        {/* Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">📰 Publicações do Processo</h2>
            <p className="section-subtitle">
              Publicações do DJE relacionadas a este processo
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn btn-secondary"
              onClick={onRefresh}
              disabled={loading}
              title="Atualizar lista"
            >
              🔄 Atualizar
            </button>
            <button 
              className="btn btn-primary"
              onClick={onVincularPublicacao}
              disabled={loading}
            >
              <Link2 size={18} />
              Vincular Publicação
            </button>
          </div>
        </div>

        {/* Filtros */}
        {publicacoes.length > 0 && (
          <div className="filters-row" style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button 
              className={`filter-btn ${filter === 'todas' ? 'active' : ''}`}
              onClick={() => setFilter('todas')}
            >
              Todas ({publicacoes.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'intimacoes' ? 'active' : ''}`}
              onClick={() => setFilter('intimacoes')}
            >
              Intimações
            </button>
            <button 
              className={`filter-btn ${filter === 'despachos' ? 'active' : ''}`}
              onClick={() => setFilter('despachos')}
            >
              Despachos
            </button>
            <button 
              className={`filter-btn ${filter === 'outras' ? 'active' : ''}`}
              onClick={() => setFilter('outras')}
            >
              Outras
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Carregando publicações...</p>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message={
              publicacoes.length === 0
                ? "Nenhuma publicação vinculada"
                : "Nenhuma publicação encontrada neste filtro"
            }
            hint={
              publicacoes.length === 0
                ? "Vincule publicações do DJE relacionadas a este processo para acompanhar intimações, despachos e outras comunicações oficiais"
                : "Tente outro filtro para ver mais publicações"
            }
          />
        ) : (
          /* Lista de Publicações */
          <div className="publicacoes-list">
            {filtered.map(pub => (
              <div key={pub.id} className="publicacao-card">
                {/* Header: Data + Tribunal + Tipo */}
                <div className="publicacao-header">
                  <div className="publicacao-meta-group">
                    <span className="publicacao-date">
                      <Calendar size={14} />
                      {formatDate(pub.data_disponibilizacao)}
                    </span>
                    <span className="publicacao-tribunal">
                      <Building2 size={14} />
                      {pub.tribunal}
                    </span>
                    <span className={`publicacao-tipo tipo-${pub.tipo_comunicacao?.toLowerCase().replace(' ', '-')}`}>
                      {pub.tipo_comunicacao}
                    </span>
                  </div>
                  
                  <div className="publicacao-actions">
                    {/* Botão criar movimentação - só aparece em modo manual */}
                    {systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION === false && (
                      <button
                        className="btn-icon-small btn-success-ghost"
                        onClick={() => onCreateMovement(pub.id_api)}
                        title="Criar movimentação a partir desta publicação"
                      >
                        <PlusCircle size={16} />
                      </button>
                    )}
                    <button
                      className="btn-icon-small btn-danger-ghost"
                      onClick={() => onDesvincularPublicacao(pub.id)}
                      title="Desvincular publicação"
                    >
                      🔗✗
                    </button>
                  </div>
                </div>

                {/* Órgão */}
                {pub.orgao && (
                  <div className="publicacao-orgao">
                    📍 {pub.orgao}
                  </div>
                )}

                {/* Texto Resumo */}
                <div className="publicacao-content">
                  <p className="publicacao-texto">
                    {truncateText(pub.texto_resumo || pub.texto_completo, 300)}
                  </p>
                </div>

                {/* Footer: Ver mais + Links de Consulta */}
                <div className="publicacao-footer">
                  <button 
                    className="btn-link"
                    onClick={() => handleOpenPublicationDetails(pub)}
                  >
                    Ver texto completo →
                  </button>
                  
                  {/* Links de consulta ao tribunal */}
                  {(() => {
                    if (!pub.numero_processo) return null;
                    
                    const consultaLinks = generateAllConsultaLinks(pub);
                    
                    // Renderiza se tem link oficial OU links alternativos
                    if (!consultaLinks.linkOficial && consultaLinks.linksAlternativos.length === 0) {
                      return null;
                    }
                    
                    return (
                      <div className="consulta-buttons-group">
                        {/* Botão oficial (ESAJ) */}
                        {consultaLinks.linkOficial && (
                          <button 
                            className="btn-consulta-oficial"
                            onClick={(e) => handleConsultarProcesso(e, consultaLinks.linkOficial, pub.numero_processo)}
                            title="Copia o número e abre o portal do tribunal"
                          >
                            🔍 Consultar ({pub.tribunal})
                          </button>
                        )}
                        
                        {/* Botões alternativos */}
                        {consultaLinks.linksAlternativos.length > 0 && (
                          consultaLinks.linksAlternativos.map((system, index) => (
                            <button 
                              key={index}
                              className="btn-consulta-alternativa"
                              onClick={(e) => handleConsultarProcesso(e, system.url, pub.numero_processo)}
                              title={system.description}
                            >
                              {system.icon} {system.shortName}
                            </button>
                          ))
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TODO: Modal para vincular publicação existente */}
      {/* Opcões:
          1. Buscar publicação por número de processo
          2. Listar publicações recentes não vinculadas
          3. Buscar por data/tribunal
      */}
    </div>
  );
}

export default PublicacoesTab;
