/**
 * Financial Service - API para Payments e Expenses
 * Gerencia recebimentos de honorários e despesas do processo
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Generic API fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // DELETE returns 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

const financialService = {
  // ========== PAYMENTS (Recebimentos) ==========
  
  /**
   * Get all payments for a case
   */
  async getPaymentsByCase(caseId) {
    return await apiFetch(`/payments/?case_id=${caseId}`);
  },

  /**
   * Create new payment
   */
  async createPayment(paymentData) {
    return await apiFetch('/payments/', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  /**
   * Update payment
   */
  async updatePayment(id, paymentData) {
    return await apiFetch(`/payments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  },

  /**
   * Delete payment
   */
  async deletePayment(id) {
    return await apiFetch(`/payments/${id}/`, {
      method: 'DELETE',
    });
  },

  // ========== EXPENSES (Despesas) ==========
  
  /**
   * Get all expenses for a case
   */
  async getExpensesByCase(caseId) {
    return await apiFetch(`/expenses/?case_id=${caseId}`);
  },

  /**
   * Create new expense
   */
  async createExpense(expenseData) {
    return await apiFetch('/expenses/', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  /**
   * Update expense
   */
  async updateExpense(id, expenseData) {
    return await apiFetch(`/expenses/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  /**
   * Delete expense
   */
  async deleteExpense(id) {
    return await apiFetch(`/expenses/${id}/`, {
      method: 'DELETE',
    });
  },
};

export default financialService;
