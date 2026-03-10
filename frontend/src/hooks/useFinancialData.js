import { useState, useEffect, useCallback } from 'react';
import financialService from '../services/financialService';
import useAutoSave from './useAutoSave';

/**
 * useFinancialData
 * Gerencia todo o estado financeiro do caso: recebimentos, despesas, participações.
 * Inclui auto-save via useAutoSave hook.
 * 
 * @param {number} id - ID do caso
 * @param {Object} formData - Dados do formulário do caso (participação, valores)
 * @param {function} setFormData - Setter para formData
 * @param {boolean} activeIsFinanceiro - Se aba financeiro está ativa
 * @param {boolean} saving - Se está salvando (caso)
 * @param {function} showToast - Função para exibir notificações
 * @param {function} onSaveFinancialData - Handler para salvar dados financeiros
 * @returns {Object} Estado e funções para gerenciar dados financeiros
 */
export function useFinancialData(
  id,
  formData,
  setFormData,
  activeIsFinanceiro,
  saving,
  showToast,
  onSaveFinancialData
) {
  // Recebimentos e despesas
  const [recebimentos, setRecebimentos] = useState([]);
  const [despesas, setDespesas] = useState([]);

  // Participação
  const [participacaoTipo, setParticipacaoTipo] = useState(null);
  const [participacaoPercentual, setParticipacaoPercentual] = useState('');
  const [participacaoValorFixo, setParticipacaoValorFixo] = useState('');
  const [pagaMedianteGanho, setPagaMedianteGanho] = useState(false);

  // Formulários para adicionar
  const [recebimentoForm, setRecebimentoForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: ''
  });

  const [despesaForm, setDespesaForm] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: ''
  });

  /**
   * Parse valor monetário para número
   */
  const parseCurrencyValue = (value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    
    return parseFloat(
      String(value)
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    ) || 0;
  };

  /**
   * Formatar valor monetário
   */
  const formatCurrencyInput = (value) => {
    const numeric = parseCurrencyValue(value);
    return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /**
   * Sincronizar campos financeiros do backend para state local
   */
  useEffect(() => {
    if (!formData || !id) return;

    setParticipacaoTipo(formData.participation_type ?? null);
    
    if (formData.participation_percentage !== null && formData.participation_percentage !== undefined) {
      setParticipacaoPercentual(formData.participation_percentage.toString());
    } else {
      setParticipacaoPercentual('');
    }
    
    if (formData.participation_fixed_value !== null && formData.participation_fixed_value !== undefined) {
      setParticipacaoValorFixo(formatCurrencyInput(formData.participation_fixed_value));
    } else {
      setParticipacaoValorFixo('');
    }
    
    if (formData.payment_conditional !== undefined) {
      setPagaMedianteGanho(formData.payment_conditional);
    }
  }, [formData, id]);

  /**
   * Sincronizar mudanças para formData
   */
  useEffect(() => {
    if (!id) return;

    setFormData(prev => ({
      ...prev,
      participation_type: participacaoTipo,
      participation_percentage: participacaoTipo === 'percentage' ? parseFloat(participacaoPercentual) || null : null,
      participation_fixed_value: participacaoTipo === 'fixed' ? parseCurrencyValue(participacaoValorFixo) : null,
      payment_conditional: pagaMedianteGanho,
    }));
  }, [id, participacaoTipo, participacaoPercentual, participacaoValorFixo, pagaMedianteGanho, setFormData]);

  /**
   * Carregar recebimentos
   */
  const loadPayments = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await financialService.getPaymentsByCase(id);
      setRecebimentos(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      showToast('Erro ao carregar recebimentos', 'error');
    }
  }, [id, showToast]);

  /**
   * Carregar despesas
   */
  const loadExpenses = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await financialService.getExpensesByCase(id);
      setDespesas(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      showToast('Erro ao carregar despesas', 'error');
    }
  }, [id, showToast]);

  /**
   * Auto-load ao entrar em aba Financeiro
   */
  useEffect(() => {
    if (activeIsFinanceiro && id) {
      loadPayments();
      loadExpenses();
    }
  }, [activeIsFinanceiro, id, loadPayments, loadExpenses]);

  /**
   * Construir payload financeiro para auto-save
   */
  const buildFinancialPayload = useCallback(() => ({
    valor_causa: parseCurrencyValue(formData.valor_causa),
    participation_type: participacaoTipo,
    participation_percentage: participacaoTipo === 'percentage' ? parseFloat(participacaoPercentual) || null : null,
    participation_fixed_value: participacaoTipo === 'fixed' ? parseCurrencyValue(participacaoValorFixo) : null,
    payment_conditional: pagaMedianteGanho,
    payment_terms: formData.payment_terms || '',
    attorney_fee_amount: formData.attorney_fee_amount ? parseCurrencyValue(formData.attorney_fee_amount) : null,
    attorney_fee_installments: Math.max(parseInt(formData.attorney_fee_installments || 1, 10) || 1, 1),
    observations_financial_block_a: formData.observations_financial_block_a || '',
    observations_financial_block_b: formData.observations_financial_block_b || '',
  }), [
    formData.valor_causa,
    formData.payment_terms,
    formData.attorney_fee_amount,
    formData.attorney_fee_installments,
    formData.observations_financial_block_a,
    formData.observations_financial_block_b,
    participacaoTipo,
    participacaoPercentual,
    participacaoValorFixo,
    pagaMedianteGanho,
  ]);

  /**
   * Detectar campos alterados
   */
  const getChangedFinancialFields = useCallback((currentData, baseData) => {
    if (!baseData) return currentData;

    const changed = {};
    Object.keys(currentData).forEach((key) => {
      if (currentData[key] !== baseData[key]) {
        changed[key] = currentData[key];
      }
    });

    return changed;
  }, []);

  /**
   * Adicionar recebimento
   */
  const handleAdicionarRecebimento = async () => {
    if (!recebimentoForm.data || !recebimentoForm.descricao || !recebimentoForm.valor) {
      showToast('Preencha todos os campos do recebimento', 'error');
      return;
    }

    const valor = parseFloat(recebimentoForm.valor);
    if (isNaN(valor) || valor <= 0) {
      showToast('Valor deve ser um número positivo', 'error');
      return;
    }

    try {
      const paymentData = {
        case: id,
        date: recebimentoForm.data,
        description: recebimentoForm.descricao,
        value: valor
      };

      await financialService.createPayment(paymentData);
      await loadPayments();
      
      setRecebimentoForm({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        valor: ''
      });
      showToast('Recebimento adicionado', 'success');
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast('Erro ao adicionar recebimento', 'error');
    }
  };

  /**
   * Remover recebimento
   */
  const handleRemoverRecebimento = async (paymentId) => {
    try {
      await financialService.deletePayment(paymentId);
      await loadPayments();
      showToast('Recebimento removido', 'success');
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('Erro ao remover recebimento', 'error');
    }
  };

  /**
   * Adicionar despesa
   */
  const handleAdicionarDespesa = async () => {
    if (!despesaForm.data || !despesaForm.descricao || !despesaForm.valor) {
      showToast('Preencha todos os campos da despesa', 'error');
      return;
    }

    const valor = parseFloat(despesaForm.valor);
    if (isNaN(valor) || valor <= 0) {
      showToast('Valor deve ser um número positivo', 'error');
      return;
    }

    try {
      const expenseData = {
        case: id,
        date: despesaForm.data,
        description: despesaForm.descricao,
        value: valor
      };

      await financialService.createExpense(expenseData);
      await loadExpenses();
      
      setDespesaForm({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        valor: ''
      });
      showToast('Despesa adicionada', 'success');
    } catch (error) {
      console.error('Error creating expense:', error);
      showToast('Erro ao adicionar despesa', 'error');
    }
  };

  /**
   * Remover despesa
   */
  const handleRemoverDespesa = async (expenseId) => {
    try {
      await financialService.deleteExpense(expenseId);
      await loadExpenses();
      showToast('Despesa removida', 'success');
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('Erro ao remover despesa', 'error');
    }
  };

  return {
    // Recebimentos
    recebimentos,
    setRecebimentos,
    recebimentoForm,
    setRecebimentoForm,

    // Despesas
    despesas,
    setDespesas,
    despesaForm,
    setDespesaForm,

    // Participação
    participacaoTipo,
    setParticipacaoTipo,
    participacaoPercentual,
    setParticipacaoPercentual,
    participacaoValorFixo,
    setParticipacaoValorFixo,
    pagaMedianteGanho,
    setPagaMedianteGanho,

    // Funções
    handleAdicionarRecebimento,
    handleRemoverRecebimento,
    handleAdicionarDespesa,
    handleRemoverDespesa,
    loadPayments,
    loadExpenses,
    buildFinancialPayload,
    getChangedFinancialFields,
    parseCurrencyValue,
    formatCurrencyInput,
  };
}

export default useFinancialData;
