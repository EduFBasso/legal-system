import { useState, useEffect, useCallback, useRef } from 'react';
import financialService from '../services/financialService';

/**
 * useFinancialData
 * Gerencia todo o estado financeiro do caso: recebimentos, despesas, participações.
 * Fornece payload e diff para auto-save feito pelo componente pai.
 * 
 * @param {number} id - ID do caso
 * @param {Object} formData - Dados do formulário do caso (participação, valores)
 * @param {function} setFormData - Setter para formData
 * @param {boolean} activeIsFinanceiro - Se aba financeiro está ativa
 * @param {function} showToast - Função para exibir notificações
 * @returns {Object} Estado e funções para gerenciar dados financeiros
 */
export function useFinancialData(
  id,
  formData,
  setFormData,
  activeIsFinanceiro,
  showToast
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

  const entriesInFlightRef = useRef({ caseId: null, promise: null });

  /**
   * Parse valor monetário para número
   */
  const parseCurrencyValue = useCallback((value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;

    let cleaned = String(value)
      .replace(/[^\d,.-]/g, '')
      .trim();

    if (!cleaned) return 0;

    if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      const hasSingleDot = parts.length === 2;
      const decimalDigits = hasSingleDot ? parts[1].length : 0;

      if (!(hasSingleDot && decimalDigits > 0 && decimalDigits <= 2)) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }

    return parseFloat(cleaned) || 0;
  }, []);

  /**
   * Formatar valor monetário
   */
  const formatCurrencyInput = useCallback((value) => {
    const numeric = parseCurrencyValue(value);
    return numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [parseCurrencyValue]);

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
  }, [formData, id, formatCurrencyInput]);

  /**
   * Sincronizar mudanças para formData
   */
  useEffect(() => {
    if (!id) return;

    const parsedPercentual = parseFloat(participacaoPercentual);
    const hasPercentual = participacaoPercentual !== '' && !Number.isNaN(parsedPercentual);
    const parsedValorFixo = parseCurrencyValue(participacaoValorFixo);
    const hasValorFixo = participacaoValorFixo !== '' && parsedValorFixo > 0;

    let participationTypeCompat = participacaoTipo;
    if (hasPercentual && hasValorFixo) {
      participationTypeCompat = participacaoTipo || 'percentage';
    } else if (hasPercentual) {
      participationTypeCompat = 'percentage';
    } else if (hasValorFixo) {
      participationTypeCompat = 'fixed';
    } else {
      participationTypeCompat = null;
    }

    setFormData((prev) => {
      const nextParticipationPercentage = hasPercentual ? parsedPercentual : null;
      const nextParticipationFixedValue = hasValorFixo ? parsedValorFixo : null;

      const prevParticipationType = prev?.participation_type ?? null;
      const prevParticipationPercentage = prev?.participation_percentage ?? null;
      const prevParticipationFixedValue = prev?.participation_fixed_value ?? null;
      const prevPaymentConditional = prev?.payment_conditional ?? false;

      const noChanges =
        prevParticipationType === participationTypeCompat
        && prevParticipationPercentage === nextParticipationPercentage
        && prevParticipationFixedValue === nextParticipationFixedValue
        && prevPaymentConditional === pagaMedianteGanho;

      if (noChanges) {
        return prev;
      }

      return {
        ...prev,
        participation_type: participationTypeCompat,
        participation_percentage: nextParticipationPercentage,
        participation_fixed_value: nextParticipationFixedValue,
        payment_conditional: pagaMedianteGanho,
      };
    });
  }, [id, participacaoTipo, participacaoPercentual, participacaoValorFixo, pagaMedianteGanho, parseCurrencyValue, setFormData]);

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
   * Carregar recebimentos + despesas juntos (reduz "tremor"/layout shift na montagem)
   * e deduplica chamadas concorrentes comuns no dev (React StrictMode).
   */
  const loadFinancialEntries = useCallback(async () => {
    if (!id) return;

    if (entriesInFlightRef.current.caseId === id && entriesInFlightRef.current.promise) {
      return entriesInFlightRef.current.promise;
    }

    const requestPromise = (async () => {
      const [paymentsResult, expensesResult] = await Promise.allSettled([
        financialService.getPaymentsByCase(id),
        financialService.getExpensesByCase(id),
      ]);

      if (paymentsResult.status === 'fulfilled') {
        setRecebimentos(paymentsResult.value);
      } else {
        console.error('Error loading payments:', paymentsResult.reason);
        showToast('Erro ao carregar recebimentos', 'error');
      }

      if (expensesResult.status === 'fulfilled') {
        setDespesas(expensesResult.value);
      } else {
        console.error('Error loading expenses:', expensesResult.reason);
        showToast('Erro ao carregar despesas', 'error');
      }
    })();

    entriesInFlightRef.current = { caseId: id, promise: requestPromise };

    try {
      await requestPromise;
    } finally {
      if (entriesInFlightRef.current.caseId === id) {
        entriesInFlightRef.current = { caseId: null, promise: null };
      }
    }
  }, [id, showToast]);

  /**
   * Auto-load ao entrar em aba Financeiro
   */
  useEffect(() => {
    if (activeIsFinanceiro && id) {
      loadFinancialEntries();
      return undefined;
    }

    return undefined;
  }, [activeIsFinanceiro, id, loadFinancialEntries]);

  /**
   * Construir payload financeiro para auto-save
   */
  const buildFinancialPayload = useCallback(() => {
    const safeFormData = formData || {};
    const parsedPercentual = parseFloat(participacaoPercentual);
    const hasPercentual = participacaoPercentual !== '' && !Number.isNaN(parsedPercentual);
    const parsedValorFixo = parseCurrencyValue(participacaoValorFixo);
    const hasValorFixo = participacaoValorFixo !== '' && parsedValorFixo > 0;

    let participationTypeCompat = participacaoTipo;
    if (hasPercentual && hasValorFixo) {
      participationTypeCompat = participacaoTipo || 'percentage';
    } else if (hasPercentual) {
      participationTypeCompat = 'percentage';
    } else if (hasValorFixo) {
      participationTypeCompat = 'fixed';
    } else {
      participationTypeCompat = null;
    }

    return {
      valor_causa: parseCurrencyValue(safeFormData.valor_causa),
      participation_type: participationTypeCompat,
      participation_percentage: hasPercentual ? parsedPercentual : null,
      participation_fixed_value: hasValorFixo ? parsedValorFixo : null,
      payment_conditional: pagaMedianteGanho,
      payment_terms: safeFormData.payment_terms || '',
      attorney_fee_amount: safeFormData.attorney_fee_amount ? parseCurrencyValue(safeFormData.attorney_fee_amount) : null,
      attorney_fee_installments: Math.max(parseInt(safeFormData.attorney_fee_installments || 1, 10) || 1, 1),
      observations_financial_block_a: safeFormData.observations_financial_block_a || '',
      observations_financial_block_b: safeFormData.observations_financial_block_b || '',
    };
  }, [
    formData,
    participacaoTipo,
    participacaoPercentual,
    participacaoValorFixo,
    pagaMedianteGanho,
    parseCurrencyValue,
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
