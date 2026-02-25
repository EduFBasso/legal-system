/**
 * @fileoverview Currency formatting and parsing utilities
 * @module utils/currency
 * 
 * Handles currency formatting for pt-BR locale and parsing from multiple formats.
 * Supports both:
 * - pt-BR format: 1.234,56 (thousand separator = dot, decimal separator = comma)
 * - en-US format: 1234.56 (no thousand separator, decimal separator = dot)
 */

/**
 * Parse currency value from string to number
 * 
 * Intelligently detects format:
 * - If contains comma: assumes pt-BR format (220.000,00)
 * - If contains only dot or plain number: assumes en-US/decimal format (220000.00)
 * 
 * @param {number|string} value - Currency value to parse
 * @returns {number} Parsed numeric value
 * 
 * @example
 * parseCurrencyValue(220000) // 220000
 * parseCurrencyValue('220000') // 220000
 * parseCurrencyValue('220.000,00') // 220000
 * parseCurrencyValue(220000.00) // 220000
 */
export function parseCurrencyValue(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const str = value.toString();
  
  // If contains comma, assume pt-BR format (220.000,00)
  // Remove dots and replace comma with dot
  if (str.includes(',')) {
    const normalized = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }
  
  // If contains only dot or plain number, assume en-US/decimal format
  // parseFloat handles both "220000" and "220000.00" correctly
  return parseFloat(str) || 0;
}

/**
 * Format number as currency for display (pt-BR)
 * 
 * @param {number|string} value - Currency value
 * @param {Object} options - Formatting options
 * @param {boolean} options.showCurrency - Show "R$" prefix - default: true
 * @param {number} options.decimals - Decimal places - default: 2
 * @returns {string} Formatted currency (e.g., "R$ 1.234,56")
 * 
 * @example
 * formatCurrency(220000) // "R$ 220.000,00"
 * formatCurrency(220000, { showCurrency: false }) // "220.000,00"
 * formatCurrency(220000.50, { decimals: 2 }) // "R$ 220.000,50"
 */
export function formatCurrency(value, options = {}) {
  const { showCurrency = true, decimals = 2 } = options;
  
  if (!value && value !== 0) return '-';
  
  try {
    const numeric = parseCurrencyValue(value);
    const formatted = numeric.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    
    return showCurrency ? `R$ ${formatted}` : formatted;
  } catch (error) {
    console.warn(`Failed to format currency: ${value}`, error);
    return '-';
  }
}

/**
 * Format number for currency input field (pt-BR locale)
 * 
 * Converts to display format: 220000 → "220.000,00"
 * Used to display formatted value while user types
 * 
 * @param {number|string} value - Currency value
 * @param {number} decimals - Decimal places - default: 2
 * @returns {string} Formatted value for input (no currency symbol)
 * 
 * @example
 * formatCurrencyInput(220000) // "220.000,00"
 * formatCurrencyInput(220000.5, 2) // "220.000,50"
 */
export function formatCurrencyInput(value, decimals = 2) {
  if (value === null || value === undefined || value === '') return '';
  
  try {
    const numeric = parseCurrencyValue(value);
    return numeric.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.warn(`Failed to format currency input: ${value}`, error);
    return '';
  }
}

/**
 * Calculate percentage of a value
 * 
 * @param {number} value - Base value
 * @param {number} percentage - Percentage to calculate
 * @returns {number} Calculated amount
 * 
 * @example
 * calculatePercentage(1000, 10) // 100
 * calculatePercentage(5000, 15.5) // 775
 */
export function calculatePercentage(value, percentage) {
  const numeric = parseCurrencyValue(value);
  const percent = parseFloat(percentage) || 0;
  return (numeric * percent) / 100;
}

/**
 * Format currency for export/display in reports
 * 
 * @param {number|string} value - Currency value
 * @param {Object} options - Options
 * @param {string} options.currency - Currency code (BRL, USD, EUR) - default: BRL
 * @param {number} options.decimals - Decimal places - default: 2
 * @returns {string} Formatted string
 * 
 * @example
 * formatCurrencyForExport(220000) // "R$ 220.000,00"
 * formatCurrencyForExport(220000, { currency: 'USD' }) // "$ 220.000,00"
 */
export function formatCurrencyForExport(value, options = {}) {
  const { currency = 'BRL', decimals = 2 } = options;
  
  const currencySymbols = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
  };
  
  const symbol = currencySymbols[currency] || currency;
  return `${symbol} ${formatCurrencyInput(value, decimals)}`;
}

/**
 * Parse user input from text field
 * Removes non-numeric characters except separators
 * 
 * @param {string} input - Raw input from user
 * @returns {string} Cleaned input
 * 
 * @example
 * parseUserInput('R$ 1.234,56') // "1.234,56"
 * parseUserInput('1234,56') // "1234,56"
 */
export function parseUserInput(input) {
  if (!input) return '';
  
  // Remove everything except digits, commas, and dots
  return input.replace(/[^\d,.\s]/g, '').trim();
}

export default {
  parseCurrencyValue,
  formatCurrency,
  formatCurrencyInput,
  calculatePercentage,
  formatCurrencyForExport,
  parseUserInput,
};
