import { Link } from 'react-router-dom';
import { Edit2, Save, X, Trash2, UserPlus, Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { generateAllConsultaLinks } from '../../utils/consultaLinksHelper';
import { SelectField, DateInputMasked, CurrencyInput, TextAreaField } from '../FormFields';

/**
 * InformacaoTab - Aba de Informações do Processo
 * Exibe e permite edição de dados do case: número, tribunal, partes, datas, etc.
 */
function InformacaoTab({
  formData = {},
  setFormData = () => {},
  isEditing = false,
  setIsEditing = () => {},
  saving = false,
  onSave = () => {},
  onCancel = () => {},
  onDelete = () => {},
  setActiveSection = () => {},
  onOpenLatestMovimentacao = () => {},
  onAddPartyClick,
  parties = [],
  formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },
  tribunalOptions = [],
  statusOptions = [],
  tipoAcaoOptions = [],
  onInputChange = () => {},
}) {
  // Handler para mudanças em inputs
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    if (onInputChange) {
      onInputChange(field, value);
    }
  };

  // Renderizar botões de consulta processual
  const renderProcessConsultaButtons = () => {
    if (!formData.publicacao_origem) return null;

    // Simular objeto publication a partir dos dados de case
    const simulatedPublication = {
      tribunal: formData.tribunal,
      numero_processo: formData.numero_processo,
      link_oficial: null, // Será construído dinamicamente
    };

    const consultaLinks = generateAllConsultaLinks(simulatedPublication);

    const handleConsultarProcesso = (url) => {
      if (!formData.numero_processo) return;

      // Copiar automaticamente o número do processo
      navigator.clipboard.writeText(formData.numero_processo).then(() => {
        // Abrir link
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        // Mesmo com erro, abre o link
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    };

    return (
      <div className="publication-buttons-group" style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Link oficial (ESAJ ou principal) */}
        {consultaLinks.linkOficial && (
          <button 
            className="btn-official-link btn btn-sm"
            onClick={() => handleConsultarProcesso(consultaLinks.linkOficial)}
            title="Copia o número e abre o portal do tribunal"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            🔍 {formData.tribunal || 'Consultar'}
          </button>
        )}
        
        {/* Links alternativos (eProc, TRF3, TRT15, etc.) */}
        {consultaLinks.linksAlternativos.map((system, index) => (
          <button 
            key={index}
            className="btn-alternative-link btn btn-sm"
            onClick={() => handleConsultarProcesso(system.url)}
            title={system.description}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            {system.icon} {system.shortName}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="case-section">
      {/* Detalhes do Processo */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">
            {isEditing ? '✏️ Editando Informações' : '📋 Detalhes do Processo'}
          </h2>
          <div className="section-header-actions">
            {!isEditing ? (
              <>
                <button className="btn case-btn-edit" onClick={() => {
                  setActiveSection('info');
                  setIsEditing(true);
                }}>
                  <Edit2 size={18} />
                  Editar
                </button>
                <button className="btn btn-danger" onClick={() => {
                  setActiveSection('info');
                  onDelete();
                }}>
                  <Trash2 size={18} />
                  Apagar
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-success" onClick={onSave} disabled={saving}>
                  <Save size={18} />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="btn btn-secondary" onClick={onCancel}>
                  <X size={18} />
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
        
        {!isEditing ? (
          /* MODO READONLY - Agrupamento Temático */
          <div className="details-readonly">
            {/* Identificação do Processo */}
            <div className="details-group">
              <h3 className="details-group-title">🔖 Identificação</h3>
              <div className="details-content">
                <div className="detail-item-row">
                  <div className="detail-item-col">
                    <span className="detail-label">PROCESSO Nº</span>
                    <span className="detail-value-large">{formData.numero_processo_formatted || formData.numero_processo}</span>
                  </div>
                  <div className="detail-item-col right">
                    <span className="detail-label">TÍTULO</span>
                    <span className="detail-value-medium">{formData.titulo || '—'}</span>
                  </div>
                </div>
                <div className="detail-badges-row">
                  {formData.tipo_acao && (
                    <div className="detail-badge-item">
                      <span className="detail-label-small">Tipo</span>
                      <span className={`process-tipo-badge tipo-${formData.tipo_acao.toLowerCase()}`}>
                        {formData.tipo_acao_display || formData.tipo_acao}
                      </span>
                    </div>
                  )}
                  <div className="detail-badge-item">
                    <span className="detail-label-small">Status</span>
                    <span className={`info-badge status status-${formData.status?.toLowerCase()}`}>
                      {formData.status_display || formData.status}
                    </span>
                  </div>
                  <div className="detail-badge-item">
                    <span className="detail-label-small">Tribunal</span>
                    <span className="info-badge tribunal">
                      {formData.tribunal_display || formData.tribunal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partes e Financeiro */}
            <div className="details-group">
              <h3 className="details-group-title">👥 Partes e Financeiro</h3>
              <div className="details-content">
                <div className="detail-partes-row">
                  <div className="detail-partes-col">
                    {(() => {
                      const clientParty = parties.find(p => p.is_client);
                      const dynamicLabel = clientParty?.role_display 
                        ? `${clientParty.role_display.toUpperCase()} DA AÇÃO` 
                        : 'CLIENTE';
                      
                      return (
                        <>
                          <span className="detail-label">{dynamicLabel}</span>
                          {clientParty ? (
                            <div className="detail-client-block">
                              <div className="detail-client-row">
                                <Link
                                  to={`/contacts?open=${clientParty.contact}`}
                                  className="party-contact-link detail-client-link"
                                  title="Ver detalhes do contato (abre em nova aba)"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="detail-client-name">{clientParty.contact_name}</span> ↗
                                </Link>
                                <span className="client-badge">✅ CLIENTE</span>
                              </div>
                            </div>
                          ) : (
                            <div className="detail-client-block">
                              <span className="detail-value empty">Nenhum cliente vinculado</span>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  if (onAddPartyClick) {
                                    onAddPartyClick();
                                  }
                                }}
                                style={{marginTop: '0.5rem'}}
                              >
                                  <UserPlus size={16} />
                                  Selecionar Contato
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <button
                      className="btn-link detail-partes-hint"
                      onClick={() => setActiveSection('parties')}
                    >ℹ️ Use a aba "Partes" para gerenciar detalhadamente</button>
                  </div>
                  <div className="detail-partes-col">
                    <span className="detail-label">Partes</span>
                    {(() => {
                      const otherParties = parties.filter(p => !p.is_client);
                      if (otherParties.length > 0) {
                        return (
                          <div className="detail-partes-list">
                            {otherParties.map(party => (
                              <div key={party.id} className="detail-partes-item">
                                <strong>{party.contact_name}</strong>
                                <span className="detail-value-sub">({party.role_display})</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <span className="detail-value empty">Nenhuma outra parte cadastrada</span>
                      );
                    })()}
                  </div>
                </div>
                
                {/* Valor da Causa - Compacto */}
                <div className="detail-financeiro-row">
                  <div className="detail-financeiro-item">
                    <span className="detail-label">💰 Valor da Causa</span>
                    <span className="detail-value-large">{formatCurrency(formData.valor_causa)}</span>
                  </div>
                  <div className="detail-financeiro-actions">
                    <button
                      className="btn-link detail-financeiro-hint"
                      onClick={() => setActiveSection('financeiro')}
                    >💰 Use a aba "Financeiro" para controlar recebimentos e despesas</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cronologia */}
            <div className="details-group">
              <h3 className="details-group-title">📅 Cronologia</h3>
              <div className="details-content">
                <div className="detail-item">
                  <span className="detail-label">Data de Distribuição</span>
                  <span className="detail-value">{formatDate(formData.data_distribuicao)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Última Movimentação</span>
                  {formData.data_ultima_movimentacao ? (
                    <div className="detail-value-stacked">
                      <strong>{formatDate(formData.data_ultima_movimentacao)}</strong>
                      {formData.ultima_movimentacao_resumo && (
                        <span className="detail-value-sub">{formData.ultima_movimentacao_resumo}</span>
                      )}
                      <button
                        className="btn-link detail-partes-hint"
                        style={{ marginTop: '0.35rem', alignSelf: 'flex-start' }}
                        onClick={onOpenLatestMovimentacao}
                      >
                        🔎 Ver movimentação destacada
                      </button>
                    </div>
                  ) : (
                    <span className="detail-value empty">Nenhuma movimentação cadastrada</span>
                  )}
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="details-group">
              <h3 className="details-group-title">📍 Localização</h3>
              <div className="details-content">
                <div className="detail-item">
                  <span className="detail-label">Comarca</span>
                  <span className="detail-value">{formData.comarca || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Vara</span>
                  <span className="detail-value">{formData.vara || '-'}</span>
                </div>
              </div>
            </div>

            {/* Origem - Criado a partir de Publicação (Versão compacta) */}
            {formData.publicacao_origem && (
              <div className="details-group" style={{
                background: '#f0f9ff',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ 
                    fontSize: '0.875rem',
                    color: '#0c4a6e',
                    fontWeight: 500
                  }}>
                    🔗 Origem: {formData.publicacao_origem_tipo || 'Publicação'} • {formatDate(formData.publicacao_origem_data) || '-'}
                  </span>
                  {/* Botões de Consulta */}
                  {renderProcessConsultaButtons()}
                </div>
              </div>
            )}

            {/* Observações */}
            {formData.observacoes && (
              <div className="details-group">
                <h3 className="details-group-title">📝 Observações</h3>
                <div className="details-content">
                  <div className="detail-item full">
                    <p className="detail-value">{formData.observacoes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MODO EDIÇÃO - Formulário Vertical */
          <div className="info-form-vertical">
            {/* Título */}
            <div className="info-field full-width">
              <label>Título do Processo</label>
              <input
                type="text"
                value={formData.titulo || ''}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Ex: Ação de Cobrança"
              />
            </div>

            {/* Número do Processo */}
            <div className="info-field">
              <label>Número do Processo (CNJ) <span style={{color: '#ef4444'}}>*</span></label>
              <input
                type="text"
                value={formData.numero_processo || ''}
                onChange={(e) => handleInputChange('numero_processo', e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>

            {/* Tribunal */}
            <SelectField
              label={<span>Tribunal <span style={{color: '#ef4444'}}>*</span></span>}
              value={formData.tribunal || ''}
              onChange={(value) => handleInputChange('tribunal', value)}
              options={tribunalOptions}
              placeholder="Selecione..."
            />

            {/* Status */}
            <SelectField
              label="Status"
              value={formData.status || 'ATIVO'}
              onChange={(value) => handleInputChange('status', value)}
              options={statusOptions}
            />

            {/* Tipo de Ação */}
            <SelectField
              label="Tipo de Ação"
              value={formData.tipo_acao || ''}
              onChange={(value) => handleInputChange('tipo_acao', value)}
              options={tipoAcaoOptions}
            />

            {/* Comarca */}
            <div className="info-field">
              <label>Comarca</label>
              <input
                type="text"
                value={formData.comarca || ''}
                onChange={(e) => handleInputChange('comarca', e.target.value)}
                placeholder="Ex: São Paulo"
              />
            </div>

            {/* Vara */}
            <div className="info-field">
              <label>Vara</label>
              <input
                type="text"
                value={formData.vara || ''}
                onChange={(e) => handleInputChange('vara', e.target.value)}
                placeholder="Ex: 1ª Vara Cível"
              />
            </div>

            {/* Data Distribuição */}
            <DateInputMasked
              label="Data de Distribuição"
              value={formData.data_distribuicao || ''}
              onChange={(value) => handleInputChange('data_distribuicao', value)}
            />

            {/* Nosso Cliente - Display only, gerenciado via aba Partes */}
            <div className="info-field full-width">
              <label>Nosso Cliente Neste Processo</label>
              {(() => {
                const clientParty = parties.find(p => p.is_client);
                if (clientParty) {
                  return (
                    <div className="client-display">
                      <p className="info-value">
                        <strong>{clientParty.contact_name}</strong> ({clientParty.role_display})
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="empty-state-inline">
                    <p className="info-value empty">Nenhum cliente vinculado</p>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        if (onAddPartyClick) {
                          onAddPartyClick();
                        }
                      }}
                      style={{marginTop: '0.5rem'}}
                    >
                      <UserPlus size={16} />
                      Selecionar Contato
                    </button>
                  </div>
                );
              })()}
              <div style={{ marginTop: '0.5rem' }}>
                {parties.length > 0 ? (
                  <p className="info-value" style={{ color: '#4b5563' }}>
                    <strong>Partes cadastradas:</strong>{' '}
                    {parties.map((party, index) => (
                      <span key={party.id}>
                        {party.contact_name} ({party.role_display})
                        {index < parties.length - 1 ? ' • ' : ''}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="info-value" style={{ color: '#9ca3af' }}>
                    Nenhuma parte vinculada
                  </p>
                )}
              </div>
              <span className="field-hint">
                💡 Clientes são gerenciados na aba "Partes". Marque "É nosso cliente?" ao adicionar.
              </span>
            </div>

            {/* Valor da Causa */}
            <CurrencyInput
              label="Valor da Causa"
              value={formData.valor_causa || 0}
              onChange={(value) => handleInputChange('valor_causa', value)}
              placeholder="0,00"
            />

            {/* Origem da Publicação - Versão compacta em 1 linha */}
            {formData.publicacao_origem && (
              <div className="info-field full-width" style={{
                background: '#f0f9ff',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <span style={{ 
                  fontSize: '0.875rem',
                  color: '#0c4a6e',
                  fontWeight: 500
                }}>
                  🔗 Origem: {formData.publicacao_origem_tipo || 'Publicação'} • {formatDate(formData.publicacao_origem_data) || '-'}
                </span>
                {renderProcessConsultaButtons()}
              </div>
            )}

            {/* Observações - Full Width */}
            <TextAreaField
              label="Observações"
              value={formData.observacoes || ''}
              onChange={(value) => handleInputChange('observacoes', value)}
              rows={4}
              placeholder="Observações sobre o processo..."
              className="full-width"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default InformacaoTab;
