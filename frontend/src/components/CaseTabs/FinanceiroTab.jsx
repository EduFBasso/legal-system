import { Save, Plus, Trash2 } from 'lucide-react';
import { formatDate, formatCurrencyValue, parseCurrencyValue } from '../../utils/formatters';
import { CurrencyInput, DateInputMasked, TextAreaField } from '../FormFields';
import EmptyState from '../common/EmptyState';

/**
 * FinanceiroTab - Aba de Gestão Financeira do Processo
 * Controla valores, custos, recebimentos e despesas
 */
function FinanceiroTab({
  formData = {},
  recebimentos = [],
  despesas = [],
  participacaoTipo = 'percentage',
  participacaoPercentual = '',
  participacaoValorFixo = '',
  pagaMedianteGanho = false,
  recebimentoForm = { data: '', descricao: '', valor: '' },
  despesaForm = { data: '', descricao: '', valor: '' },
  onInputChange = () => {},
  setRecebimentoForm = () => {},
  setDespesaForm = () => {},
  setParticipacaoTipo = () => {},
  setParticipacaoPercentual = () => {},
  setParticipacaoValorFixo = () => {},
  setPagaMedianteGanho = () => {},
  onAddRecebimento = () => {},
  onRemoveRecebimento = () => {},
  onAddDespesa = () => {},
  onRemoveDespesa = () => {},
  onSaveFinancial = () => {},
  saving = false,
   autoSavingObservations = false,
  calcularParticipacao = () => {
    const valorCausa = parseCurrencyValue(formData.valor_causa);
    if (participacaoTipo === 'percentage') {
      return (valorCausa * (parseFloat(participacaoPercentual) || 0)) / 100;
    }
    return parseCurrencyValue(participacaoValorFixo);
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
             {autoSavingObservations && (
               <p className="section-subtitle" style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '4px' }}>
                 ✓ Observações sendo salvas...
               </p>
             )}
             {!autoSavingObservations && (
               <p className="section-subtitle">Controle de valores e custos do processo</p>
             )}
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
                  <CurrencyInput
                    label="💰 Valor da Causa"
                    value={formData.valor_causa}
                    onChange={(value) => onInputChange('valor_causa', value)}
                    placeholder="1.000,00"
                  />
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
                  <CurrencyInput
                    value={participacaoValorFixo}
                    onChange={(value) => setParticipacaoValorFixo(value)}
                    placeholder="0,00"
                    disabled={participacaoTipo !== 'fixed'}
                  />
                </div>

                <div className="financeiro-resumo-participacao">
                  <span>Valor Estimado da Participação:</span>
                  <strong>R$ {formatCurrencyValue(calcularParticipacao())}</strong>
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
                <DateInputMasked
                  label="Data"
                  value={recebimentoForm.data}
                  onChange={(value) => setRecebimentoForm({...recebimentoForm, data: value})}
                />

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

                <CurrencyInput
                  label="Valor"
                  value={recebimentoForm.valor}
                  onChange={(value) => setRecebimentoForm({...recebimentoForm, valor: value})}
                  placeholder="0,00"
                />

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
                <EmptyState
                  message="Nenhum recebimento registrado"
                  hint="Preencha os campos acima e clique em 'Adicionar Recebimento'"
                />
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
                          R$ {formatCurrencyValue(recebimento.value)}
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
                <strong>R$ {formatCurrencyValue(calcularTotalRecebimentos())}</strong>
              </div>
            </div>

            {/* Observações Bloco A */}
            <TextAreaField
              label="Observações"
              value={formData.observations_financial_block_a || ''}
              onChange={(value) => onInputChange('observations_financial_block_a', value)}
              placeholder="Anotações sobre ajustes de valores, acordos, parcelamentos, etc..."
              rows={3}
            />
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
                <DateInputMasked
                  label="Data"
                  value={despesaForm.data}
                  onChange={(value) => setDespesaForm({...despesaForm, data: value})}
                />

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

                <CurrencyInput
                  label="Valor"
                  value={despesaForm.valor}
                  onChange={(value) => setDespesaForm({...despesaForm, valor: value})}
                  placeholder="0,00"
                />

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
                <EmptyState
                  message="Nenhuma despesa registrada"
                  hint="Registre custas do tribunal, perícias, honorários e outros custos"
                />
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
                          R$ {formatCurrencyValue(despesa.value)}
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
              <strong>R$ {formatCurrencyValue(calcularTotalDespesas())}</strong>
            </div>

            {/* Observações Bloco B */}
            <TextAreaField
              label="Observações"
              value={formData.observations_financial_block_b || ''}
              onChange={(value) => onInputChange('observations_financial_block_b', value)}
              placeholder="Descrições detalhadas dos custos, justificativas ou pendências..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceiroTab;
