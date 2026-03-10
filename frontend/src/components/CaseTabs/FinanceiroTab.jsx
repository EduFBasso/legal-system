import { Save, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate, formatCurrencyValue, parseCurrencyValue } from '../../utils/formatters';
import { CurrencyInput, DateInputMasked, TextAreaField } from '../FormFields';
import EmptyState from '../common/EmptyState';

/**
 * FinanceiroTab - Aba de Gestão Financeira do Processo
 * Controla valores, custos, recebimentos e despesas
 */
function FinanceiroTab({
  id = null,
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
  const calcularTotalHonorarios = () => {
    const honorarioParcela = parseCurrencyValue(formData.attorney_fee_amount || '');
    const parcelas = Math.max(parseInt(formData.attorney_fee_installments || 1, 10) || 1, 1);
    return honorarioParcela * parcelas;
  };

  const [honorariosModo, setHonorariosModo] = useState('parcelado');
  const [honorarioValorHora, setHonorarioValorHora] = useState('');
  const [honorarioQtdHoras, setHonorarioQtdHoras] = useState('');

  const buildInitialChecks = () => ({
    percentual: participacaoTipo === 'percentage',
    valorFixo: participacaoTipo === 'fixed',
    honorarios: parseCurrencyValue(formData.attorney_fee_amount || '') > 0,
  });

  const [participacaoChecks, setParticipacaoChecks] = useState(buildInitialChecks);
  const [manualCheckControl, setManualCheckControl] = useState(false);

  useEffect(() => {
    setManualCheckControl(false);
  }, [id]);

  useEffect(() => {
    if (manualCheckControl) return;
    setParticipacaoChecks(buildInitialChecks());
  }, [manualCheckControl, participacaoTipo, formData.attorney_fee_amount]);

  const valorCausa = parseCurrencyValue(formData.valor_causa);
  const percentualValue = parseFloat(participacaoPercentual) || 0;
  const totalPercentual = participacaoChecks.percentual ? (valorCausa * percentualValue) / 100 : 0;
  const totalValorFixo = participacaoChecks.valorFixo ? parseCurrencyValue(participacaoValorFixo) : 0;
  const totalHonorariosParcelado = calcularTotalHonorarios();
  const totalHonorariosHora = parseCurrencyValue(honorarioValorHora) * (parseFloat(honorarioQtdHoras) || 0);
  const totalHonorariosSelecionado = honorariosModo === 'hora' ? totalHonorariosHora : totalHonorariosParcelado;
  const totalHonorarios = participacaoChecks.honorarios ? totalHonorariosSelecionado : 0;
  const totalParticipacao = totalPercentual + totalValorFixo + totalHonorarios;

  const handleToggleParticipacao = (tipo, checked) => {
    setManualCheckControl(true);
    setParticipacaoChecks((prev) => ({ ...prev, [tipo]: checked }));

    // Compatibilidade com os campos antigos de participacao no backend.
    if (tipo === 'percentual' && checked) {
      setParticipacaoTipo('percentage');
    }
    if (tipo === 'valorFixo' && checked) {
      setParticipacaoTipo('fixed');
    }

    if (!checked && tipo === 'percentual' && participacaoTipo === 'percentage') {
      if (participacaoChecks.valorFixo) {
        setParticipacaoTipo('fixed');
      } else {
        setParticipacaoTipo(null);
      }
      // Limpar valor de percentual ao desmarcar
      setParticipacaoPercentual('');
    }
    if (!checked && tipo === 'valorFixo' && participacaoTipo === 'fixed') {
      if (participacaoChecks.percentual) {
        setParticipacaoTipo('percentage');
      } else {
        setParticipacaoTipo(null);
      }
      // Limpar valor fixo ao desmarcar
      setParticipacaoValorFixo('');
    }
    if (!checked && tipo === 'honorarios') {
      // Limpar todos os valores de honorários ao desmarcar
      onInputChange('attorney_fee_amount', '');
      onInputChange('attorney_fee_installments', '');
      setHonorarioValorHora('');
      setHonorarioQtdHoras('');
    }
  };

  const handlePercentualChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 3);
    setParticipacaoPercentual(digitsOnly);
  };

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">💰 Gestão Financeira</h2>
             {autoSavingObservations && (
               <p className="section-subtitle" style={{ color: '#10b981', fontSize: '0.875rem', marginTop: '4px' }}>
                 ✓ Dados financeiros sendo salvos...
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

        {/* BLOCO A: Informações do Processo */}
        <div className="financeiro-bloco financeiro-bloco-azul">
          <h3 className="financeiro-bloco-title">📋 Informações do Processo</h3>
          
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

              <TextAreaField
                label="Condições de Pagamento"
                value={formData.payment_terms || ''}
                onChange={(value) => onInputChange('payment_terms', value)}
                placeholder="Ex: Entrada + parcelas mensais, vencimentos, reajustes e regras combinadas com o cliente..."
                rows={3}
              />
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

        {/* BLOCO B: Participação do Escritório */}
        <div className="financeiro-bloco financeiro-bloco-azul">
          <h3 className="financeiro-bloco-title">🤝 Participação do Escritório</h3>

          <div className="financeiro-bloco-content">
            <div className="financeiro-participacao-group">
                <div className="financeiro-participacao-item">
                  <div className="financeiro-participacao-topo">
                    <label className="financeiro-check-inline">
                      <input
                        type="checkbox"
                        checked={participacaoChecks.percentual}
                        onChange={(e) => handleToggleParticipacao('percentual', e.target.checked)}
                      />
                      <span>Percentual (%)</span>
                    </label>
                    {participacaoChecks.percentual && (
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        pattern="[0-9]*"
                        className="financeiro-input-compact"
                        placeholder="000"
                        value={participacaoPercentual}
                        onChange={(e) => handlePercentualChange(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="financeiro-participacao-item">
                  <div className="financeiro-participacao-topo">
                    <label className="financeiro-check-inline">
                      <input
                        type="checkbox"
                        checked={participacaoChecks.valorFixo}
                        onChange={(e) => handleToggleParticipacao('valorFixo', e.target.checked)}
                      />
                      <span>Valor Fixo (R$)</span>
                    </label>
                    {participacaoChecks.valorFixo && (
                      <CurrencyInput
                        value={participacaoValorFixo}
                        onChange={(value) => setParticipacaoValorFixo(value)}
                        placeholder="0,00"
                        className="financeiro-currency-inline"
                      />
                    )}
                  </div>
                </div>

                <div className="financeiro-participacao-item">
                  <div className="financeiro-participacao-topo">
                    <label className="financeiro-check-inline">
                      <input
                        type="checkbox"
                        checked={participacaoChecks.honorarios}
                        onChange={(e) => handleToggleParticipacao('honorarios', e.target.checked)}
                      />
                      <span>Honorários</span>
                    </label>
                    {participacaoChecks.honorarios && (
                      <div className="financeiro-honorarios-modo">
                        <label className="financeiro-honorarios-opcao">
                          <input
                            type="radio"
                            name="honorarios_modo"
                            value="hora"
                            checked={honorariosModo === 'hora'}
                            onChange={(e) => setHonorariosModo(e.target.value)}
                          />
                          <span>Por hora</span>
                        </label>
                        <label className="financeiro-honorarios-opcao">
                          <input
                            type="radio"
                            name="honorarios_modo"
                            value="parcelado"
                            checked={honorariosModo === 'parcelado'}
                            onChange={(e) => setHonorariosModo(e.target.value)}
                          />
                          <span>Por parcela</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {participacaoChecks.honorarios && (
                    <div className="financeiro-participacao-campos">

                      {honorariosModo === 'hora' && (
                        <div className="financeiro-grid financeiro-grid-honorarios">
                          <div className="financeiro-field-inline financeiro-field-inline-currency">
                            <label className="financeiro-label">Custo por Hora (R$)</label>
                            <CurrencyInput
                              value={honorarioValorHora}
                              onChange={(value) => setHonorarioValorHora(value)}
                              placeholder="0,00"
                              className="financeiro-currency-inline"
                            />
                          </div>

                          <div className="financeiro-field-inline">
                            <label className="financeiro-label">Quantidade de Horas</label>
                            <input
                              type="number"
                              className="financeiro-input-compact"
                              min="0"
                              step="0.5"
                              value={honorarioQtdHoras}
                              onChange={(e) => setHonorarioQtdHoras(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      )}

                      {honorariosModo === 'parcelado' && (
                        <div className="financeiro-grid financeiro-grid-honorarios">
                          <div className="financeiro-field-inline financeiro-field-inline-currency">
                            <label className="financeiro-label">Parcela (R$)</label>
                            <CurrencyInput
                              value={formData.attorney_fee_amount || ''}
                              onChange={(value) => onInputChange('attorney_fee_amount', value)}
                              placeholder="0,00"
                              className="financeiro-currency-inline"
                            />
                          </div>

                          <div className="financeiro-field-inline">
                            <label className="financeiro-label">Quantidade de Parcelas</label>
                            <input
                              type="number"
                              className="financeiro-input-compact"
                              min="1"
                              value={formData.attorney_fee_installments || 1}
                              onChange={(e) => onInputChange('attorney_fee_installments', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="financeiro-participacao-resumo-container">
                <div className="financeiro-participacao-resumo-linhas">
                  <div className="financeiro-participacao-resumo-linha">
                    <span>Percentual:</span>
                    <strong>R$ {formatCurrencyValue(totalPercentual)}</strong>
                  </div>
                  <div className="financeiro-participacao-resumo-linha">
                    <span>Valor Fixo:</span>
                    <strong>R$ {formatCurrencyValue(totalValorFixo)}</strong>
                  </div>
                  <div className="financeiro-participacao-resumo-linha">
                    <span>Honorários:</span>
                    <strong>R$ {formatCurrencyValue(totalHonorarios)}</strong>
                  </div>
                </div>
                <div className="financeiro-participacao-resumo-total">
                  <span>Total da Participação:</span>
                  <strong>R$ {formatCurrencyValue(totalParticipacao)}</strong>
                </div>
              </div>
          </div>
        </div>

        {/* BLOCO C: Recebimentos do Cliente */}
        <div className="financeiro-bloco financeiro-bloco-azul">
          <h3 className="financeiro-bloco-title">💵 Recebimentos do Cliente</h3>

          <div className="financeiro-bloco-content">
            <div className="financeiro-subsection">
              <div className="financeiro-subsection-header">
                <h4>Lançamentos de Recebimento</h4>
              </div>

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
            </div>

            <div className="financeiro-total-recebimentos">
              <span>Total Recebido:</span>
              <strong>R$ {formatCurrencyValue(calcularTotalRecebimentos())}</strong>
            </div>
          </div>
        </div>

        {/* BLOCO D: Custos do Escritório */}
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
            <div className="financeiro-total-recebimentos">
              <span>Total de Custos:</span>
              <strong>R$ {formatCurrencyValue(calcularTotalDespesas())}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinanceiroTab;
