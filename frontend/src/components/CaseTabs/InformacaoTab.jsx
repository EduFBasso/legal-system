import { Link } from 'react-router-dom';
import { Edit2, Save, X, Trash2, UserPlus, Plus } from 'lucide-react';
import { formatDate, maskNumeroProcesso } from '../../utils/formatters';
import { generateAllConsultaLinks } from '../../utils/consultaLinksHelper';
import { SelectField, DateInputMasked, CurrencyInput, TextAreaField } from '../FormFields';
import SearchableCreatableSelectField from '../FormFields/SearchableCreatableSelectField';
import EditableDetailField from '../EditableDetailField';
import { SaveButton, CancelButton, DeleteButton, EditButton } from '../common/Button';
import PartyRoleBadge from '../common/PartyRoleBadge';

/**
 * InformacaoTab - Aba de Informações do Processo
 * Exibe e permite edição de dados do case: número, tribunal, partes, datas, etc.
 */
function InformacaoTab({
  id,
  formData: rawFormData = {},
  setFormData = () => {},
  isEditing = false,
  setIsEditing = () => {},
  readOnly = false,
  saving = false,
  onSave = () => {},
  onCancel = () => {},
  onDelete = () => {},
  setActiveSection = () => {},
  onOpenLatestMovimentacao = () => {},
  onOpenOrigemMovimentacao = null,
  onOpenOrigemPublicacao = null,
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
  onCreateTipoAcaoOption = null,
  onEditTipoAcaoOption = null,
  tituloOptions = [],
  onCreateTituloOption = null,
  onEditTituloOption = null,
  onInputChange = () => {},
}) {
  const formData = rawFormData || {};

  const normalizeBadgeKey = (value) => {
    if (!value) return '';
    return String(value)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const getTipoAcaoBadgeVariant = (tipoAcaoValue) => {
    const normalized = normalizeBadgeKey(tipoAcaoValue);
    const variants = new Set([
      'consumidor',
      'civel',
      'criminal',
      'trabalhista',
      'tributaria',
      'familia',
      'outros',
    ]);
    return variants.has(normalized) ? normalized : 'custom';
  };

  const sanitizeHTML = (html) => {
    if (!html) return '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const hasPublicationOrigin = Boolean(formData.publicacao_origem && (formData.publicacao_origem_tipo || formData.publicacao_origem_data));

  const handleOpenOrigemPublicationDetails = () => {
    if (typeof onOpenOrigemPublicacao === 'function') {
      onOpenOrigemPublicacao();
      return;
    }

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
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      if (!formData.numero_processo || !navigator.clipboard?.writeText) return;

      navigator.clipboard.writeText(formData.numero_processo).catch(err => {
        console.error('Erro ao copiar:', err);
      });
    };

    return (
      <div className={`publication-buttons-group ${wrap ? 'is-wrap' : 'is-nowrap'}`}>
        {/* Link oficial (ESAJ ou principal) */}
        {consultaLinks.linkOficial && (
          <button
            className="btn-official-link btn btn-sm"
            onClick={() => handleConsultarProcesso(consultaLinks.linkOficial)}
            title="Copia o número e abre o portal do tribunal"
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
            {!isEditing && formData.owner_name && (
              <span className="section-owner-label">
                {formData.owner_name}{formData.owner_oab ? ` ${formData.owner_oab}` : ''}
              </span>
            )}
            {!isEditing && !readOnly && (
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
                        <span style={{ whiteSpace: 'nowrap' }}>
                          PROCESSO Nº <span style={{ color: '#ef4444' }}>*</span>
                        </span>
                      </span>
                      <input
                        type="text"
                        value={formData.numero_processo || ''}
                        onChange={(e) => handleInputChange('numero_processo', maskNumeroProcesso(e.target.value))}
                        placeholder="0000000-00.0000.0.00.0000"
                        className="detail-input detail-input-large"
                        maxLength={25}
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
                      <div className="detail-select-wrapper">
                        <SearchableCreatableSelectField
                          value={formData.titulo || ''}
                          onChange={(v) => handleInputChange('titulo', v)}
                          options={tituloOptions}
                          placeholder="Pesquisar ou digitar..."
                          allowCreate={true}
                          onCreateOption={onCreateTituloOption || null}
                          onEditOption={onEditTituloOption || null}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Tipo, Status, Tribunal - apenas no modo edição para evitar duplicidade */}
              {isEditing && (
                <div className="detail-grid-3">
                  <EditableDetailField
                    label="Tipo de Ação"
                    value={formData.tipo_acao}
                    isEditing={isEditing}
                    type="searchable-select"
                    options={tipoAcaoOptions}
                    onChange={(value) => handleInputChange('tipo_acao', value)}
                    formatDisplay={(v) => formData.tipo_acao_display || v}
                    placeholder="Selecione..."
                    selectProps={{
                      allowCreate: true,
                      onCreateOption: onCreateTipoAcaoOption || null,
                      onEditOption: onEditTipoAcaoOption || null,
                      placeholder: 'Pesquisar ou cadastrar...'
                    }}
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
                    label="Tribunal"
                    value={formData.tribunal}
                    isEditing={isEditing}
                    type="select"
                    options={tribunalOptions}
                    onChange={(value) => handleInputChange('tribunal', value)}
                    formatDisplay={(v) => formData.tribunal_display || v}
                    placeholder="Selecione..."
                    required={true}
                    selectProps={{ placeholder: 'Selecione...' }}
                  />
                </div>
              )}
              
              {/* Badges - Apenas quando NÃO está editando */}
              {!isEditing && (
                <div className="detail-badges-row">
                  {formData.tipo_acao && (
                    <div className="detail-badge-item">
                      <span className="detail-label-small">Tipo</span>
                      <span className={`process-tipo-badge tipo-${getTipoAcaoBadgeVariant(formData.tipo_acao)}`}>
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
                                  title="Ver detalhes, selecionar ou criar outro processo com vínculo"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="detail-client-name">{clientParty.contact_name}</span> ↗
                                </Link>
                                <PartyRoleBadge label="CLIENTE" isClient={true} showCheck={true} size="md" />
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
                                <Link
                                  to={`/contacts?open=${party.contact}`}
                                  className="party-contact-link"
                                  title="Ver detalhes, selecionar ou criar outro processo com vínculo"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <strong>{party.contact_name}</strong> ↗
                                </Link>
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
                        onClick={() => setActiveSection('financeiro')}
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
                            <div
                              className="detail-value-sub"
                              dangerouslySetInnerHTML={{ __html: sanitizeHTML(formData.ultima_movimentacao_resumo) }}
                            />
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
            <div className="details-group">
              <h3 className="details-group-title">📝 Observações</h3>
              <div className="details-content">
                {hasPublicationOrigin && (
                  <div className="observacoes-origem-box">
                    <div className="observacoes-origem-row">
                      <button
                        type="button"
                        className="observacoes-origem-link"
                        onClick={handleOpenOrigemPublicationDetails}
                        title="Abrir detalhes da publicação de origem em nova janela"
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
                  <div className="detail-item full">
                    <p className="detail-value">{formData.observacoes || '-'}</p>
                  </div>
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
        </div>
        
        {/* Botões de Ação - Modo Edição */}
        {isEditing && !readOnly && (
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
