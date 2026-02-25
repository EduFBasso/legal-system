import { Save, Plus, Trash2 } from 'lucide-react';

/**
 * FinanceiroTab - Aba de Gestão Financeira do Processo
 * Controla valores, custos, recebimentos e despesas
 */
function FinanceiroTab({
  id,
  formData = {},
  setFormData = () => {},
  recebimentos = [],
  despesas = [],
  participacaoTipo = 'percentage',
  participacaoPercentual = '',
  participacaoValorFixo = '',
  pagaMedianteGanho = false,
  valorCausaInput = '',
  recebimentoForm = { data: '', descricao: '', valor: '' },
  despesaForm = { data: '', descricao: '', valor: '' },
  onInputChange = () => {},
  setRecebimentoForm = () => {},
  setDespesaForm = () => {},
  setParticipacaoTipo = () => {},
  setParticipacaoPercentual = () => {},
  setParticipacaoValorFixo = () => {},
  setPagaMedianteGanho = () => {},
  setValorCausaInput = () => {},
  onAddRecebimento = () => {},
  onRemoveRecebimento = () => {},
  onAddDespesa = () => {},
  onRemoveDespesa = () => {},
  onSaveFinancial = () => {},
  saving = false,
  formatDate = (date) => date ? new Date(date).toLocaleDateString('pt-BR') : '—',
  parseCurrencyValue = (value) => {
    if (typeof value !== 'string') return value;
    return parseFloat(value.replace(/\D/g, '')) / 100 || 0;
  },
  formatCurrencyInput = (value) => {
    if (!value) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  calcularParticipacao = () => {
    const valorCausa = formData.valor_causa || 0;
    if (participacaoTipo === 'percentage') {
      return (valorCausa * (parseFloat(participacaoPercentual) || 0)) / 100;
    }
    return parseFloat(participacaoValorFixo) || 0;
  },
  calcularTotalRecebimentos = () => {
    return recebimentos.reduce((sum, r) => sum + (r.value || 0), 0);
  },
  calcularTotalDespesas = () => {
    return despesas.reduce((sum, d) => sum + (d.value || 0), 0);
  },
}) {
  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">💰 Gestão Financeira</h2>
            <p className="section-subtitle">Controle de valores e custos do processo</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={onSaveFinancial}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Dados Financeiros'}
          </button>
        </div>

        {/* BLOCO A: Valor do Processo */}
        <div className="financeiro-bloco financeiro-bloco-azul">
          <h3 className="financeiro-bloco-title">📋 Valor do Processo</h3>
          
          <div className="financeiro-bloco-content">
            
            {/* Card: Informações do Processo */}
            <div className="financeiro-card">
              <h4 className="financeiro-card-title">Informações do Processo</h4>
              
              <div className="financeiro-grid">
                <div className="financeiro-field">
                  <label className="financeiro-label financeiro-label-destaque">Valor da Causa</label>
                  <div className="financeiro-input-icon-group">
                    <span className="financeiro-currency-label">💰 R$</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="financeiro-input-clean"
                      placeholder="1.000,00" 
                      value={valorCausaInput}
                      onChange={(e) => setValorCausaInput(e.target.value)}
                      onBlur={(e) => {
                        const numericValue = parseCurrencyValue(e.target.value);
                        onInputChange('valor_causa', numericValue);
                        setValorCausaInput(formatCurrencyInput(numericValue));
                      }}
                    />
                  </div>
                </div>

                <div className="financeiro-field">
                  <label className="financeiro-label">Condição de Pagamento</label>
                  <div className="financeiro-checkbox-inline">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={pagaMedianteGanho}
                        onChange={(e) => setPagaMedianteGanho(e.target.checked)}
                      />
                      <span>Cliente paga mediante ganho de causa</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Participação do Escritório */}
            <div className="financeiro-card">
              <h4 className="financeiro-card-title">Participação do Escritório</h4>
              
              <div className="financeiro-participacao-group">
                <div className="financeiro-participacao-options">
                  <label className="financeiro-radio-inline">
                    <input 
                      type="radio" 
                      name="participation_type" 
                      value="percentage" 
                      checked={participacaoTipo === 'percentage'}
                      onChange={(e) => setParticipacaoTipo(e.target.value)}
                    />
                    <span>Percentual (%)</span>
                  </label>
                  <input 
                    type="number" 
                    className="financeiro-input-compact" 
                    placeholder="10" 
                    min="0" 
                    max="100"
                    value={participacaoPercentual}
                    onChange={(e) => setParticipacaoPercentual(e.target.value)}
                    disabled={participacaoTipo !== 'percentage'}
                  />
                  
                  <label className="financeiro-radio-inline">
                    <input 
                      type="radio" 
                      name="participation_type" 
                      value="fixed"
                      checked={participacaoTipo === 'fixed'}
                      onChange={(e) => setParticipacaoTipo(e.target.value)}
                    />
                    <span>Valor Fixo (R$)</span>
                  </label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className="financeiro-input-compact" 
                    placeholder="0,00" 
                    step="0.01"
                    value={participacaoValorFixo}
                    onChange={(e) => setParticipacaoValorFixo(e.target.value)}
                    onBlur={(e) => setParticipacaoValorFixo(formatCurrencyInput(e.target.value))}
                    disabled={participacaoTipo !== 'fixed'}
                  />
                </div>

                <div className="financeiro-resumo-participacao">
                  <span>Valor Estimado da Participação:</span>
                  <strong>R$ {calcularParticipacao().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>

            {/* Recebimentos */}
            <div className="financeiro-subsection">
              <div className="financeiro-subsection-header">
                <h4>💵 Recebimentos do Cliente</h4>
              </div>
              
              {/* Formulário para Novo Recebimento */}
              <div className="financeiro-recebimento-form">
                <div className="financeiro-field">
                  <label className="financeiro-label">Data</label>
                  <input 
                    type="date" 
                    className="financeiro-input"
                    value={recebimentoForm.data}
                    onChange={(e) => setRecebimentoForm({...recebimentoForm, data: e.target.value})}
                  />
                </div>

                <div className="financeiro-field">
                  <label className="financeiro-label">Descrição</label>
                  <input 
                    type="text" 
                    className="financeiro-input"
                    placeholder="Ex: Honorários - Parcela 1/3"
                    value={recebimentoForm.descricao}
                    onChange={(e) => setRecebimentoForm({...recebimentoForm, descricao: e.target.value})}
                  />
                </div>

                <div className="financeiro-field">
                  <label className="financeiro-label">Valor (R$)</label>
                  <input 
                    type="number" 
                    className="financeiro-input"
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    value={recebimentoForm.valor}
                    onChange={(e) => setRecebimentoForm({...recebimentoForm, valor: e.target.value})}
                  />
                </div>

                <button 
                  className="btn btn-success"
                  onClick={onAddRecebimento}
                >
                  <Plus size={16} />
                  Adicionar Recebimento
                </button>
              </div>

              {/* Lista de Recebimentos */}
              {recebimentos.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhum recebimento registrado</p>
                  <p className="empty-state-hint">
                    Preencha os campos acima e clique em "Adicionar Recebimento"
                  </p>
                </div>
              ) : (
                <div className="financeiro-lista">
                  {recebimentos.map(recebimento => (
                    <div key={recebimento.id} className="financeiro-item">
                      <div className="financeiro-item-info">
                        <span className="financeiro-item-data">{formatDate(recebimento.date)}</span>
                        <span className="financeiro-item-descricao">{recebimento.description}</span>
                      </div>
                      <div className="financeiro-item-actions">
                        <span className="financeiro-item-valor">
                          R$ {recebimento.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <button 
                          className="btn-icon-danger"
                          onClick={() => onRemoveRecebimento(recebimento.id)}
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total de Recebimentos */}
              <div className="financeiro-total-recebimentos">
                <span>Total Recebido:</span>
                <strong>R$ {calcularTotalRecebimentos().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>

            {/* Observações Bloco A */}
            <div className="financeiro-textarea-group">
              <label className="financeiro-label">Observações</label>
              <textarea
                placeholder="Anotações sobre ajustes de valores, acordos, parcelamentos, etc..."
                rows="3"
                value={formData.observations_financial_block_a || ''}
                onChange={(e) => onInputChange('observations_financial_block_a', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* BLOCO B: Custos do Escritório */}
        <div className="financeiro-bloco financeiro-bloco-azul">
          <h3 className="financeiro-bloco-title">💸 Custos e Despesas do Escritório</h3>
          
          <div className="financeiro-bloco-content">
            {/* Despesas */}
            <div className="financeiro-subsection">
              <div className="financeiro-subsection-header">
                <h4>Registros de Gastos</h4>
              </div>
              
              {/* Formulário para Nova Despesa */}
              <div className="financeiro-recebimento-form">
                <div className="financeiro-field">
                  <label className="financeiro-label">Data</label>
                  <input 
                    type="date" 
                    className="financeiro-input"
                    value={despesaForm.data}
                    onChange={(e) => setDespesaForm({...despesaForm, data: e.target.value})}
                  />
                </div>

                <div className="financeiro-field">
                  <label className="financeiro-label">Descrição</label>
                  <input 
                    type="text" 
                    className="financeiro-input"
                    placeholder="Ex: Custas processuais, Honorários perito"
                    value={despesaForm.descricao}
                    onChange={(e) => setDespesaForm({...despesaForm, descricao: e.target.value})}
                  />
                </div>

                <div className="financeiro-field">
                  <label className="financeiro-label">Valor (R$)</label>
                  <input 
                    type="number" 
                    className="financeiro-input"
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    value={despesaForm.valor}
                    onChange={(e) => setDespesaForm({...despesaForm, valor: e.target.value})}
                  />
                </div>

                <button 
                  className="btn btn-success"
                  onClick={onAddDespesa}
                >
                  <Plus size={16} />
                  Adicionar Despesa
                </button>
              </div>

              {/* Lista de Despesas */}
              {despesas.length === 0 ? (
                <div className="empty-state">
                  <p>Nenhuma despesa registrada</p>
                  <p className="empty-state-hint">
                    Registre custas do tribunal, perícias, honorários e outros custos
                  </p>
                </div>
              ) : (
                <div className="financeiro-lista">
                  {despesas.map(despesa => (
                    <div key={despesa.id} className="financeiro-item">
                      <div className="financeiro-item-info">
                        <span className="financeiro-item-data">{formatDate(despesa.date)}</span>
                        <span className="financeiro-item-descricao">{despesa.description}</span>
                      </div>
                      <div className="financeiro-item-actions">
                        <span className="financeiro-item-valor">
                          R$ {despesa.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <button 
                          className="btn-icon-danger"
                          onClick={() => onRemoveDespesa(despesa.id)}
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Despesas */}
            <div className="financeiro-total">
              <span>Total de Custos:</span>
              <strong>R$ {calcularTotalDespesas().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            {/* Observações Bloco B */}
            <div className="financeiro-textarea-group">
              <label className="financeiro-label">Observações</label>
              <textarea
                placeholder="Descrições detalhadas dos custos, justificativas ou pendências..."
                rows="3"
                value={formData.observations_financial_block_b || ''}
                onChange={(e) => onInputChange('observations_financial_block_b', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceiroTab;
