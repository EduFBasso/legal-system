/**
 * @fileoverview Validation utilities for forms
 * @module utils/validators
 * 
 * Common validation functions used across the application.
 */

import { parseCurrencyValue } from './currency.js';

/**
 * Validate CNJ process number format
 * Format: 0000000-00.0000.0.00.0000
 * 
 * @param {string} numero - Process number to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 * 
 * @example
 * validateProcessNumber('1234567-89.2021.8.26.0100')
 * // { isValid: true, error: null }
 * 
 * @example
 * validateProcessNumber('invalid')
 * // { isValid: false, error: 'Formato inválido...' }
 */
export function validateProcessNumber(numero) {
  if (!numero) {
    return { isValid: false, error: 'Número do processo é obrigatório' };
  }
  
  // Remove whitespace
  const cleaned = numero.trim();
  
  // CNJ pattern: 0000000-00.0000.0.00.0000
  const pattern = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
  
  if (!pattern.test(cleaned)) {
    return {
      isValid: false,
      error: 'Formato inválido. Use: 0000000-00.0000.0.00.0000 (CNJ)',
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 * 
 * @example
 * validateEmail('user@example.com') // { isValid: true, error: null }
 * validateEmail('invalid-email') // { isValid: false, error: '...' }
 */
export function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: 'Email é obrigatório' };
  }
  
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!pattern.test(email.trim())) {
    return { isValid: false, error: 'Email inválido' };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate currency value
 * 
 * @param {number|string} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value - default: 0
 * @param {number} options.max - Maximum value - default: Infinity
 * @param {boolean} options.required - Is value required - default: false
 * @returns {Object} { isValid: boolean, error: string|null, value: number|null }
 * 
 * @example
 * validateCurrency(1000, { min: 0, max: 10000 })
 * // { isValid: true, error: null, value: 1000 }
 * 
 * @example
 * validateCurrency('', { required: true })
 * // { isValid: false, error: 'Valor é obrigatório', value: null }
 */
export function validateCurrency(value, options = {}) {
  const { min = 0, max = Infinity, required = false } = options;
  
  if ((value === null || value === undefined || value === '') && required) {
    return { isValid: false, error: 'Valor é obrigatório', value: null };
  }
  
  if (!value && !required) {
    return { isValid: true, error: null, value: 0 };
  }
  
  try {
    const numeric = parseCurrencyValue(value);
    
    if (isNaN(numeric)) {
      return { isValid: false, error: 'Valor inválido', value: null };
    }
    
    if (numeric < min) {
      return {
        isValid: false,
        error: `Valor mínimo é R$ ${min.toLocaleString('pt-BR')}`,
        value: null,
      };
    }
    
    if (numeric > max) {
      return {
        isValid: false,
        error: `Valor máximo é R$ ${max.toLocaleString('pt-BR')}`,
        value: null,
      };
    }
    
    return { isValid: true, error: null, value: numeric };
  } catch (error) {
    return { isValid: false, error: 'Erro ao validar valor', value: null };
  }
}

/**
 * Validate date
 * 
 * @param {string|Date} date - Date to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.required - Is date required - default: false
 * @param {string|Date} options.minDate - Minimum date allowed
 * @param {string|Date} options.maxDate - Maximum date allowed
 * @param {boolean} options.notFuture - Disallow future dates - default: false
 * @returns {Object} { isValid: boolean, error: string|null }
 * 
 * @example
 * validateDate('2026-02-25', { notFuture: true })
 * // { isValid: true, error: null }
 * 
 * @example
 * validateDate('invalid') // { isValid: false, error: '...' }
 */
export function validateDate(date, options = {}) {
  const { required = false, minDate, maxDate, notFuture = false } = options;
  
  if (!date && required) {
    return { isValid: false, error: 'Data é obrigatória' };
  }
  
  if (!date && !required) {
    return { isValid: true, error: null };
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Data inválida' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (notFuture && dateObj > today) {
      return { isValid: false, error: 'Data não pode ser no futuro' };
    }
    
    if (minDate) {
      const minDateObj = typeof minDate === 'string' ? new Date(minDate) : minDate;
      if (dateObj < minDateObj) {
        return { isValid: false, error: `Data mínima: ${minDate}` };
      }
    }
    
    if (maxDate) {
      const maxDateObj = typeof maxDate === 'string' ? new Date(maxDate) : maxDate;
      if (dateObj > maxDateObj) {
        return { isValid: false, error: `Data máxima: ${maxDate}` };
      }
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Erro ao validar data' };
  }
}

/**
 * Validate required field
 * 
 * @param {*} value - Value to check
 * @param {string} fieldName - Field name for error message
 * @returns {Object} { isValid: boolean, error: string|null }
 * 
 * @example
 * validateRequired('João', 'Nome') // { isValid: true, error: null }
 * validateRequired('', 'Nome') // { isValid: false, error: 'Nome é obrigatório' }
 */
export function validateRequired(value, fieldName = 'Campo') {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    return { isValid: false, error: `${fieldName} é obrigatório` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate text length
 * 
 * @param {string} text - Text to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum length
 * @param {number} options.max - Maximum length
 * @param {string} options.fieldName - Field name for error message
 * @returns {Object} { isValid: boolean, error: string|null }
 * 
 * @example
 * validateLength('João Silva', { min: 3, max: 100, fieldName: 'Nome' })
 * // { isValid: true, error: null }
 */
export function validateLength(text, options = {}) {
  const { min, max, fieldName = 'Campo' } = options;
  
  if (!text) return { isValid: true, error: null };
  
  const length = text.toString().length;
  
  if (min !== undefined && length < min) {
    return {
      isValid: false,
      error: `${fieldName} deve ter no mínimo ${min} caracteres`,
    };
  }
  
  if (max !== undefined && length > max) {
    return {
      isValid: false,
      error: `${fieldName} deve ter no máximo ${max} caracteres`,
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validate payment form fields
 * 
 * @param {Object} form - Form object { data, descricao, valor }
 * @returns {Object} { isValid: boolean, errors: Object }
 * 
 * @example
 * validatePaymentForm({ data: '2026-02-25', descricao: 'Honorários', valor: 1000 })
 * // { isValid: true, errors: {} }
 */
export function validatePaymentForm(form) {
  const errors = {};
  
  if (!form.data) {
    errors.data = 'Data é obrigatória';
  }
  
  if (!form.descricao || form.descricao.trim() === '') {
    errors.descricao = 'Descrição é obrigatória';
  }
  
  if (!form.valor) {
    errors.valor = 'Valor é obrigatório';
  } else {
    const numeric = parseCurrencyValue(form.valor);
    if (isNaN(numeric) || numeric <= 0) {
      errors.valor = 'Valor deve ser um número positivo';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate movement form fields
 * 
 * @param {Object} form - Form object { data, tipo, titulo }
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateMovementForm(form) {
  const errors = {};
  
  if (!form.data) {
    errors.data = 'Data é obrigatória';
  }
  
  if (!form.tipo || form.tipo === '') {
    errors.tipo = 'Tipo é obrigatório';
  }
  
  if (!form.titulo || form.titulo.trim() === '') {
    errors.titulo = 'Título é obrigatório';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default {
  validateProcessNumber,
  validateEmail,
  validateCurrency,
  validateDate,
  validateRequired,
  validateLength,
  validatePaymentForm,
  validateMovementForm,
};
