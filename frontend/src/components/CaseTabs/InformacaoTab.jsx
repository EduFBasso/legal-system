import { Link } from 'react-router-dom';
import { Edit2, Save, X, Trash2, UserPlus, Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { generateAllConsultaLinks } from '../../utils/consultaLinksHelper';
import { SelectField, DateInputMasked, CurrencyInput, TextAreaField } from '../FormFields';
import EditableDetailField from '../EditableDetailField';
import { SaveButton, CancelButton, DeleteButton, EditButton } from '../common/Button';

/**
 * InformacaoTab - Aba de Informações do Processo
 * Exibe e permite edição de dados do case: número, tribunal, partes, datas, etc.
 */
function InformacaoTab({
  id,
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
  onOpenOrigemMovimentacao = null,
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
  const handleOpenMovimentacoesFromOrigem = () => {
    if (typeof onOpenOrigemMovimentacao === 'function') {
      onOpenOrigemMovimentacao();
      return;
    }

    const movementUrl = `${window.location.pathname}?tab=movements`;
    window.open(movementUrl, '_blank', 'noopener,noreferrer,width=1400,height=900,left=100,top=100');
  };

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
  const renderProcessConsultaButtons = ({ wrap = true } = {}) => {
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
        flexWrap: wrap ? 'wrap' : 'nowrap'
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
            {!isEditing && (
              <>
                <EditButton onClick={() => {
                  setActiveSection('info');
                  setIsEditing(true);
                }} />
                <DeleteButton onClick={() => {
                  setActiveSection('info');
                  onDelete();
                }} />
              </>
            )}
          </div>
        </div>
        
        {/* MODO MISTO - Visualização com Edição Inline no grupo Identificação */}
        <div className="details-readonly">
          {/* Identificação do Processo - EDIÇÃO INLINE */}
          <div className="details-group" data-inline-editing={isEditing}>
            <h3 className="details-group-title">
              🔖 Identificação
              {isEditing && <span className="editing-indicator"> EDITANDO</span>}
            </h3>
            <div className="details-content">
              {/* Número do Processo e Título - Row especial */}
              <div className="detail-item-row" data-editing={isEditing}>
                <div className="detail-item-col">
                  {!isEditing ? (
                    <>
                      <span className="detail-label">PROCESSO Nº</span>
                      <span className="detail-value-large">{formData.numero_processo_formatted || formData.numero_processo}</span>
                    </>
                  ) : (
                    <>
                      <span className="detail-label">
                        PROCESSO Nº <span style={{color: '#ef4444'}}>*</span>
                      </span>
                      <input
                        type="text"
                        value={formData.numero_processo || ''}
                        onChange={(e) => handleInputChange('numero_processo', e.target.value)}
                        placeholder="0000000-00.0000.0.00.0000"
                        className="detail-input detail-input-large"
                      />
                    </>
                  )}
                </div>
                <div className="detail-item-col right">
                  {!isEditing ? (
                    <>
                      <span className="detail-label">TÍTULO</span>
                      <span className="detail-value-medium">{formData.titulo || '—'}</span>
                    </>
                  ) : (
                    <>
                      <span className="detail-label">TÍTULO</span>
                      <input
                        type="text"
                        value={formData.titulo || ''}
                        onChange={(e) => handleInputChange('titulo', e.target.value)}
                        placeholder="Ex: Ação de Cobrança"
                        className="detail-input detail-input-medium"
                      />
                    </>
                  )}
                </div>
              </div>
              
              {/* Tribunal, Status, Tipo - apenas no modo edição para evitar duplicidade */}
              {isEditing && (
                <div className="detail-grid-3">
                  <EditableDetailField
                    label="Tribunal"
                    value={formData.tribunal}
                    isEditing={isEditing}
                    type="select"
                    options={tribunalOptions}
                    onChange={(value) => handleInputChange('tribunal', value)}
                    formatDisplay={(v) => formData.tribunal_display || v}
                    placeholder="Selecione..."
                    required={true}
                  />
                  
                  <EditableDetailField
                    label="Status"
                    value={formData.status || 'ATIVO'}
                    isEditing={isEditing}
                    type="select"
                    options={statusOptions}
                    onChange={(value) => handleInputChange('status', value)}
                    formatDisplay={(v) => formData.status_display || v}
                  />
                  
                  <EditableDetailField
                    label="Tipo de Ação"
                    value={formData.tipo_acao}
                    isEditing={isEditing}
                    type="select"
                    options={tipoAcaoOptions}
                    onChange={(value) => handleInputChange('tipo_acao', value)}
                    formatDisplay={(v) => formData.tipo_acao_display || v}
                    placeholder="Selecione..."
                  />
                </div>
              )}
              
              {/* Badges - Apenas quando NÃO está editando */}
              {!isEditing && (
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
              )}
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
                      onClick={() => window.open(
                        `/cases/${id}?tab=parties`,
                        '_blank',
                        'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes'
                      )}
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
                
                {/* Valor da Causa - Edição Inline */}
                {!isEditing ? (
                  <div className="detail-financeiro-row">
                    <div className="detail-financeiro-item">
                      <span className="detail-label">💰 Valor da Causa</span>
                      <span className="detail-value-large">{formatCurrency(formData.valor_causa)}</span>
                    </div>
                    <div className="detail-financeiro-actions">
                      <button
                        className="btn-link detail-financeiro-hint"
                        onClick={() => window.open(
                          `/cases/${id}?tab=financeiro`,
                          '_blank',
                          'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes'
                        )}
                      >💰 Use a aba "Financeiro" para controlar recebimentos e despesas</button>
                    </div>
                  </div>
                ) : (
                  <div style={{marginTop: '1.5rem'}}>
                    <EditableDetailField
                      label="Valor da Causa"
                      value={formData.valor_causa}
                      isEditing={isEditing}
                      type="currency"
                      onChange={(value) => handleInputChange('valor_causa', value)}
                      placeholder="0,00"
                    />
                    <button
                      className="btn-link detail-financeiro-hint"
                      onClick={() => window.open(
                        `/cases/${id}?tab=financeiro`,
                        '_blank',
                        'width=1400,height=900,left=100,top=100,resizable=yes,scrollbars=yes'
                      )}
                      style={{marginTop: '0.5rem', display: 'block'}}
                    >💰 Use a aba "Financeiro" para controlar recebimentos e despesas</button>
                  </div>
                )}
              </div>
            </div>

            {/* Cronologia */}
            <div className="details-group">
              <h3 className="details-group-title">📅 Cronologia</h3>
              <div className="details-content">
                {!isEditing ? (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Data de Distribuição</span>
                      <span className="detail-value"><strong>{formatDate(formData.data_distribuicao)}</strong></span>
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
                  </>
                ) : (
                  <EditableDetailField
                    label="Data de Distribuição"
                    value={formData.data_distribuicao}
                    isEditing={isEditing}
                    type="date"
                    onChange={(value) => handleInputChange('data_distribuicao', value)}
                  />
                )}
              </div>
            </div>

            {/* Localização */}
            <div className="details-group">
              <h3 className="details-group-title">📍 Localização</h3>
              <div className="details-content">
                {!isEditing ? (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Comarca</span>
                      <span className="detail-value">{formData.comarca || '-'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Vara</span>
                      <span className="detail-value">{formData.vara || '-'}</span>
                    </div>
                  </>
                ) : (
                  <div className="detail-grid-2">
                    <EditableDetailField
                      label="Comarca"
                      value={formData.comarca}
                      isEditing={isEditing}
                      type="text"
                      onChange={(value) => handleInputChange('comarca', value)}
                      placeholder="Ex: São Paulo"
                    />
                    <EditableDetailField
                      label="Vara"
                      value={formData.vara}
                      isEditing={isEditing}
                      type="text"
                      onChange={(value) => handleInputChange('vara', value)}
                      placeholder="Ex: 1ª Vara Cível"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {(formData.observacoes || formData.publicacao_origem) && (
              <div className="details-group">
                <h3 className="details-group-title">📝 Observações</h3>
                <div className="details-content">
                  {formData.publicacao_origem && (
                    <div className="observacoes-origem-box">
                      <div className="observacoes-origem-row">
                        <button
                          type="button"
                          className="observacoes-origem-link"
                          onClick={handleOpenMovimentacoesFromOrigem}
                          title="Abrir aba Movimentações em nova janela"
                        >
                          🔗 Origem: {formData.publicacao_origem_tipo || 'Publicação'} • {formatDate(formData.publicacao_origem_data) || '-'}
                        </button>
                        <div className="observacoes-origem-actions">
                          {/* Botões de Consulta */}
                          {renderProcessConsultaButtons({ wrap: false })}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isEditing ? (
                    formData.observacoes ? (
                      <div className="detail-item full">
                        <p className="detail-value">{formData.observacoes}</p>
                      </div>
                    ) : null
                  ) : (
                    <EditableDetailField
                      label="Observações"
                      value={formData.observacoes}
                      isEditing={isEditing}
                      type="textarea"
                      onChange={(value) => handleInputChange('observacoes', value)}
                      placeholder="Observações sobre o processo..."
                      rows={4}
                    />
                  )}
                </div>
              </div>
            )}
        </div>
        
        {/* Botões de Ação - Modo Edição */}
        {isEditing && (
          <div className="form-actions" style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <CancelButton className="case-info-btn-cancel" onClick={onCancel} disabled={saving} />
            <SaveButton onClick={onSave} disabled={saving}>
              {saving ? '⏳ Salvando...' : '💾 Salvar'}
            </SaveButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default InformacaoTab;
