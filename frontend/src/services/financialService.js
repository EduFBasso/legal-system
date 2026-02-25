/**
 * Financial Service - API para Payments e Expenses
 * Gerencia recebimentos de honorários e despesas do processo
 */
import api from './api';

const financialService = {
  // ========== PAYMENTS (Recebimentos) ==========
  
  /**
   * Get all payments for a case
   */
  async getPaymentsByCase(caseId) {
    const response = await api.get('/payments/', {
      params: { case_id: caseId }
    });
    return response.data;
  },

  /**
   * Create new payment
   */
  async createPayment(paymentData) {
    const response = await api.post('/payments/', paymentData);
    return response.data;
  },

  /**
   * Update payment
   */
  async updatePayment(id, paymentData) {
    const response = await api.put(`/payments/${id}/`, paymentData);
    return response.data;
  },

  /**
   * Delete payment
   */
  async deletePayment(id) {
    await api.delete(`/payments/${id}/`);
  },

  // ========== EXPENSES (Despesas) ==========
  
  /**
   * Get all expenses for a case
   */
  async getExpensesByCase(caseId) {
    const response = await api.get('/expenses/', {
      params: { case_id: caseId }
    });
    return response.data;
  },

  /**
   * Create new expense
   */
  async createExpense(expenseData) {
    const response = await api.post('/expenses/', expenseData);
    return response.data;
  },

  /**
   * Update expense
   */
  async updateExpense(id, expenseData) {
    const response = await api.put(`/expenses/${id}/`, expenseData);
    return response.data;
  },

  /**
   * Delete expense
   */
  async deleteExpense(id) {
    await api.delete(`/expenses/${id}/`);
  },
};

export default financialService;
