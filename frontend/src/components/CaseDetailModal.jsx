import { useState, useEffect, useCallback } from 'react';
import casesService from '../services/casesService';
import './CaseDetailModal.css';

/**
 * Case Detail Modal Component
 * Displays detailed information about a case with tabs
 */
export default function CaseDetailModal({ caseData, onClose, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState(caseData || {});
  const [isEditing, setIsEditing] = useState(!caseData); // New case = editing mode
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState([]);

  /**
   * Load case parties
   */
  const loadParties = useCallback(async () => {
    if (!caseData?.id) return;
    try {
      const response = await casesService.getParties(caseData.id);
      setParties(response.results || []);
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  }, [caseData?.id]);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  /**
   * Sync formData with caseData prop when it changes
   */
  useEffect(() => {
    if (caseData) {
      setFormData(caseData);
    }
  }, [caseData]);

  /**
   * Handle form input change
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle form submit (create or update)
   */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Remove empty strings, null, and undefined values
      const cleanedData = {};
      Object.entries(formData).forEach(([key, value]) => {
        // Only include fields with actual values
        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      let updatedCase;
      if (caseData?.id) {
        // Update existing case
        updatedCase = await casesService.update(caseData.id, cleanedData);
      } else {
        // Create new case
        updatedCase = await casesService.create(cleanedData);
      }
      onUpdate(updatedCase);
      setIsEditing(false);
      setFormData(updatedCase);
    } catch (error) {
      console.error('Error details:', error);
      alert('Erro ao salvar processo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete
   */
  const handleDelete = () => {
    if (caseData?.id) {
      onDelete(caseData.id);
    }
  };

  /**
   * Get tribunal options
   */
  const tribunalOptions = [
    { value: 'TJSP', label: 'TJSP' },
    { value: 'STF', label: 'STF' },
    { value: 'STJ', label: 'STJ' },
    { value: 'TRF1', label: 'TRF1' },
    { value: 'TRF2', label: 'TRF2' },
    { value: 'TRF3', label: 'TRF3' },
    { value: 'TRF4', label: 'TRF4' },
    { value: 'TRF5', label: 'TRF5' },
    { value: 'TST', label: 'TST' },
  ];

  /**
   * Get status options
   */
  const statusOptions = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'ARQUIVADO', label: 'Arquivado' },
    { value: 'ENCERRADO', label: 'Encerrado' },
  ];

  /**
   * Get tipo acao options
   */
  const tipoAcaoOptions = [
    { value: '', label: 'Selecione...' },
    { value: 'CIVEL', label: 'Cível' },
    { value: 'CRIMINAL', label: 'Criminal' },
    { value: 'TRABALHISTA', label: 'Trabalhista' },
    { value: 'TRIBUTARIA', label: 'Tributária' },
    { value: 'FAMILIA', label: 'Família' },
    { value: 'CONSUMIDOR', label: 'Consumidor' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content case-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{caseData ? 'Detalhes do Processo' : 'Novo Processo'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 Informações
          </button>
          {caseData?.id && (
            <>
              <button
                className={`tab ${activeTab === 'parties' ? 'active' : ''}`}
                onClick={() => setActiveTab('parties')}
              >
                👥 Partes ({parties.length})
              </button>
              <button
                className={`tab ${activeTab === 'publications' ? 'active' : ''}`}
                onClick={() => setActiveTab('publications')}
              >
                📰 Publicações (0)
              </button>
              <button
                className={`tab ${activeTab === 'deadlines' ? 'active' : ''}`}
                onClick={() => setActiveTab('deadlines')}
              >
                ⏰ Prazos (0)
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="tab-content">
              {isEditing ? (
                /* Edit Form */
                <form className="case-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Número do Processo (CNJ) *</label>
                      <input
                        type="text"
                        value={formData.numero_processo || ''}
                        onChange={(e) => handleInputChange('numero_processo', e.target.value)}
                        placeholder="0000000-00.0000.0.00.0000"
                        pattern="^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Tribunal *</label>
                      <select
                        value={formData.tribunal || ''}
                        onChange={(e) => handleInputChange('tribunal', e.target.value)}
                        required
                      >
                        <option value="">Selecione...</option>
                        {tribunalOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Título *</label>
                    <input
                      type="text"
                      value={formData.titulo || ''}
                      onChange={(e) => handleInputChange('titulo', e.target.value)}
                      placeholder="Ex: Ação de Cobrança"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Comarca</label>
                      <input
                        type="text"
                        value={formData.comarca || ''}
                        onChange={(e) => handleInputChange('comarca', e.target.value)}
                        placeholder="Ex: São Paulo"
                      />
                    </div>
                    <div className="form-group">
                      <label>Vara</label>
                      <input
                        type="text"
                        value={formData.vara || ''}
                        onChange={(e) => handleInputChange('vara', e.target.value)}
                        placeholder="Ex: 1ª Vara Cível"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Status *</label>
                      <select
                        value={formData.status || 'ATIVO'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        required
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tipo de Ação</label>
                      <select
                        value={formData.tipo_acao || ''}
                        onChange={(e) => handleInputChange('tipo_acao', e.target.value)}
                        disabled={!isEditing}
                      >
                        {tipoAcaoOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Data Distribuição</label>
                      <input
                        type="date"
                        value={formData.data_distribuicao || ''}
                        onChange={(e) => handleInputChange('data_distribuicao', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Data Última Movimentação</label>
                      <input
                        type="date"
                        value={formData.data_ultima_movimentacao || ''}
                        onChange={(e) => handleInputChange('data_ultima_movimentacao', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Parte Contrária</label>
                    <input
                      type="text"
                      value={formData.parte_contraria || ''}
                      onChange={(e) => handleInputChange('parte_contraria', e.target.value)}
                      placeholder="Nome da parte contrária"
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor da Causa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.valor_causa || ''}
                      onChange={(e) => handleInputChange('valor_causa', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label>Observações</label>
                    <textarea
                      value={formData.observacoes || ''}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      rows="4"
                      placeholder="Observações sobre o processo..."
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                    {caseData?.id && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                /* View Mode */
                <div className="case-view">
                  <div className="view-section">
                    <h3>Informações Gerais</h3>
                    <div className="view-field">
                      <span className="field-label">Número:</span>
                      <span className="field-value">{formData.numero_processo_formatted || formData.numero_processo}</span>
                    </div>
                    <div className="view-field">
                      <span className="field-label">Título:</span>
                      <span className="field-value">{formData.titulo}</span>
                    </div>
                    <div className="view-field">
                      <span className="field-label">Tribunal:</span>
                      <span className="field-value">{formData.tribunal_display || formData.tribunal}</span>
                    </div>
                    <div className="view-field">
                      <span className="field-label">Status:</span>
                      <span className="field-value">{formData.status_display || formData.status}</span>
                    </div>
                    {formData.tipo_acao && (
                      <div className="view-field">
                        <span className="field-label">Tipo de Ação:</span>
                        <span className="field-value">{formData.tipo_acao_display || formData.tipo_acao}</span>
                      </div>
                    )}
                  </div>

                  <div className="view-section">
                    <h3>Localização</h3>
                    {formData.comarca && (
                      <div className="view-field">
                        <span className="field-label">Comarca:</span>
                        <span className="field-value">{formData.comarca}</span>
                      </div>
                    )}
                    {formData.vara && (
                      <div className="view-field">
                        <span className="field-label">Vara:</span>
                        <span className="field-value">{formData.vara}</span>
                      </div>
                    )}
                  </div>

                  <div className="view-section">
                    <h3>Datas</h3>
                    {formData.data_distribuicao && (
                      <div className="view-field">
                        <span className="field-label">Distribuição:</span>
                        <span className="field-value">{formatDate(formData.data_distribuicao)}</span>
                      </div>
                    )}
                    {formData.data_ultima_movimentacao && (
                      <div className="view-field">
                        <span className="field-label">Última Movimentação:</span>
                        <span className="field-value">{formatDate(formData.data_ultima_movimentacao)}</span>
                      </div>
                    )}
                    {formData.dias_sem_movimentacao !== null && formData.dias_sem_movimentacao !== undefined && (
                      <div className="view-field">
                        <span className="field-label">Dias sem Movimento:</span>
                        <span className="field-value">{formData.dias_sem_movimentacao}</span>
                      </div>
                    )}
                  </div>

                  {(formData.parte_contraria || formData.valor_causa) && (
                    <div className="view-section">
                      <h3>Partes e Valores</h3>
                      {formData.parte_contraria && (
                        <div className="view-field">
                          <span className="field-label">Parte Contrária:</span>
                          <span className="field-value">{formData.parte_contraria}</span>
                        </div>
                      )}
                      {formData.valor_causa && (
                        <div className="view-field">
                          <span className="field-label">Valor da Causa:</span>
                          <span className="field-value">R$ {parseFloat(formData.valor_causa).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.observacoes && (
                    <div className="view-section">
                      <h3>Observações</h3>
                      <p className="observacoes-text">{formData.observacoes}</p>
                    </div>
                  )}

                  <div className="view-actions">
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                      ✏️ Editar
                    </button>
                    <button className="btn btn-danger" onClick={handleDelete}>
                      🗑️ Apagar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parties Tab */}
          {activeTab === 'parties' && (
            <div className="tab-content">
              <div className="parties-list">
                {parties.length === 0 ? (
                  <p className="empty-message">Nenhuma parte cadastrada</p>
                ) : (
                  parties.map(party => (
                    <div key={party.id} className="party-item">
                      <div className="party-info">
                        <span className="party-name">{party.contact_name}</span>
                        <span className="party-role">{party.role_display}</span>
                      </div>
                      {party.observacoes && (
                        <p className="party-obs">{party.observacoes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Publications Tab */}
          {activeTab === 'publications' && (
            <div className="tab-content">
              <p className="coming-soon">🚧 Em construção: Publicações vinculadas ao processo</p>
            </div>
          )}

          {/* Deadlines Tab */}
          {activeTab === 'deadlines' && (
            <div className="tab-content">
              <p className="coming-soon">🚧 Em construção: Prazos e agenda do processo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
