import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Save, X, Trash2, UserPlus } from 'lucide-react';

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
  parties = [],
  deadlines = [],
  caseData = null,
  formatDate = (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '—',
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
                                onClick={() => setActiveSection('parties')}
                                style={{marginTop: '0.5rem'}}
                              >
                                <UserPlus size={16} />
                                Adicionar Cliente na aba Partes
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
              <label>Número do Processo (CNJ)</label>
              <input
                type="text"
                value={formData.numero_processo || ''}
                onChange={(e) => handleInputChange('numero_processo', e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>

            {/* Tribunal */}
            <div className="info-field">
              <label>Tribunal</label>
              <select
                value={formData.tribunal || ''}
                onChange={(e) => handleInputChange('tribunal', e.target.value)}
              >
                <option value="">Selecione...</option>
                {tribunalOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="info-field">
              <label>Status</label>
              <select
                value={formData.status || 'ATIVO'}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Ação */}
            <div className="info-field">
              <label>Tipo de Ação</label>
              <select
                value={formData.tipo_acao || ''}
                onChange={(e) => handleInputChange('tipo_acao', e.target.value)}
              >
                {tipoAcaoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

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
            <div className="info-field">
              <label>Data de Distribuição</label>
              <input
                type="date"
                value={formData.data_distribuicao || ''}
                onChange={(e) => handleInputChange('data_distribuicao', e.target.value)}
              />
            </div>

            {/* Data Última Movimentação - Calculado Automaticamente */}
            <div className="info-field">
              <label>Última Movimentação</label>
              {formData.data_ultima_movimentacao ? (
                <div>
                  <p className="info-value" style={{marginBottom: '0.25rem'}}>
                    <strong>{formatDate(formData.data_ultima_movimentacao)}</strong>
                  </p>
                  {formData.ultima_movimentacao_resumo && (
                    <p style={{fontSize: '0.9rem', color: '#6b7280'}}>
                      {formData.ultima_movimentacao_resumo}
                    </p>
                  )}
                </div>
              ) : (
                <p className="info-value">
                  <span style={{color: '#9ca3af', fontStyle: 'italic'}}>
                    Nenhuma movimentação cadastrada
                  </span>
                </p>
              )}
              <small style={{display: 'block', color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem'}}>
                ℹ️ Atualizado automaticamente pela aba Movimentações
              </small>
            </div>

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
                      onClick={() => setActiveSection('parties')}
                      style={{marginTop: '0.5rem'}}
                    >
                      <UserPlus size={16} />
                      Adicionar Cliente na aba Partes
                    </button>
                  </div>
                );
              })()}
              <span className="field-hint">
                💡 Clientes são gerenciados na aba "Partes". Marque "É nosso cliente?" ao adicionar.
              </span>
            </div>

            {/* Valor da Causa */}
            <div className="info-field">
              <label>Valor da Causa</label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_causa || ''}
                onChange={(e) => handleInputChange('valor_causa', e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Observações - Full Width */}
            <div className="info-field full-width">
              <label>Observações</label>
              <textarea
                value={formData.observacoes || ''}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows="4"
                placeholder="Observações sobre o processo..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InformacaoTab;
