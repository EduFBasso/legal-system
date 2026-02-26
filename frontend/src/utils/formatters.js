/**
 * @fileoverview Formatting utilities for display data
 * @module utils/formatters
 * 
 * Common formatting functions reused across components.
 */

/**
 * Format date to Brazilian locale (pt-BR)
 * 
 * @param {string|Date} dateString - Date in ISO format or Date object
 * @param {string} defaultValue - Value to return if date is empty - default: '-'
 * @returns {string} Formatted date (e.g., "25/02/2026")
 * 
 * @example
 * formatDate('2026-02-25') // "25/02/2026"
 * formatDate(null) // "-"
 * formatDate('', 'N/A') // "N/A"
 */
export function formatDate(dateString, defaultValue = '-') {
  if (!dateString) return defaultValue;
  
  try {
    // If dateString is a string, append T00:00:00 to avoid timezone issues
    const dateObj = typeof dateString === 'string' 
      ? new Date(dateString + 'T00:00:00')
      : dateString;
    
    return dateObj.toLocaleDateString('pt-BR');
  } catch (error) {
    console.warn(`Failed to format date: ${dateString}`, error);
    return defaultValue;
  }
}

/**
 * Format date and time to Brazilian locale (pt-BR)
 * 
 * @param {string|Date} dateTimeString - DateTime in ISO format
 * @param {string} defaultValue - Value to return if date is empty - default: '-'
 * @returns {string} Formatted datetime (e.g., "25/02/2026 14:30:45")
 * 
 * @example
 * formatDateTime('2026-02-25T14:30:45') // "25/02/2026 14:30:45"
 */
export function formatDateTime(dateTimeString, defaultValue = '-') {
  if (!dateTimeString) return defaultValue;
  
  try {
    const dateObj = typeof dateTimeString === 'string'
      ? new Date(dateTimeString)
      : dateTimeString;
    
    const date = dateObj.toLocaleDateString('pt-BR');
    const time = dateObj.toLocaleTimeString('pt-BR');
    return `${date} ${time}`;
  } catch (error) {
    console.warn(`Failed to format datetime: ${dateTimeString}`, error);
    return defaultValue;
  }
}

/**
 * Format relative time (e.g., "há 2 dias atrás")
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 * 
 * @example
 * formatRelativeTime(new Date(Date.now() - 2*24*60*60*1000)) // "há 2 dias"
 */
export function formatRelativeTime(date) {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const secondsAgo = Math.floor((now - dateObj) / 1000);
    
    if (secondsAgo < 60) return 'agora mesmo';
    if (secondsAgo < 3600) return `há ${Math.floor(secondsAgo / 60)} minutos`;
    if (secondsAgo < 86400) return `há ${Math.floor(secondsAgo / 3600)} horas`;
    if (secondsAgo < 604800) return `há ${Math.floor(secondsAgo / 86400)} dias`;
    if (secondsAgo < 2592000) return `há ${Math.floor(secondsAgo / 604800)} semanas`;
    if (secondsAgo < 31536000) return `há ${Math.floor(secondsAgo / 2592000)} meses`;
    
    return `há ${Math.floor(secondsAgo / 31536000)} anos`;
  } catch (error) {
    console.warn(`Failed to format relative time: ${date}`, error);
    return '-';
  }
}

/**
 * Format number with thousand separators (pt-BR)
 * 
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places - default: 0
 * @returns {string} Formatted number (e.g., "1.234,56")
 * 
 * @example
 * formatNumber(1234.56) // "1.234"
 * formatNumber(1234.56, 2) // "1.234,56"
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '-';
  
  try {
    return parseFloat(value).toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.warn(`Failed to format number: ${value}`, error);
    return '-';
  }
}

/**
 * Format text to title case
 * 
 * @param {string} text - Text to format
 * @returns {string} Title cased text
 * 
 * @example
 * formatTitleCase('JOÃO SILVA') // "João Silva"
 * formatTitleCase('processo judicial') // "Processo Judicial"
 */
export function formatTitleCase(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse currency string to numeric value
 * Removes currency formatting and converts to number
 * 
 * @param {string|number} value - Formatted currency or number
 * @returns {number} Numeric value
 * 
 * @example
 * parseCurrencyValue('R$ 1.234,56') // 1234.56
 * parseCurrencyValue('1234,56') // 1234.56
 * parseCurrencyValue(1234.56) // 1234.56
 */
export function parseCurrencyValue(value) {
  if (!value && value !== 0) return 0;
  
  if (typeof value === 'number') return value;
  
  // Remove 'R$' and whitespace, replace Brazilian decimal separator
  const cleaned = String(value)
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')       // Remove thousand separators
    .replace(/,/g, '.');      // Replace decimal separator
  
  const numeric = parseFloat(cleaned);
  return isNaN(numeric) ? 0 : numeric;
}

/**
 * Format number as Brazilian currency
 * 
 * @param {string|number} value - Value to format
 * @returns {string} Formatted currency (e.g., "R$ 1.234,56")
 * 
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency('1234.56') // "R$ 1.234,56"
 */
export function formatCurrency(value) {
  if (!value && value !== 0) return '-';
  
  try {
    const numeric = parseCurrencyValue(value);
    return `R$ ${numeric.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  } catch (error) {
    console.warn(`Failed to format currency: ${value}`, error);
    return '-';
  }
}

/**
 * Format number as Brazilian currency without 'R$' prefix
 * 
 * @param {string|number} value - Value to format
 * @returns {string} Formatted number (e.g., "1.234,56")
 * 
 * @example
 * formatCurrencyValue(1234.56) // "1.234,56"
 */
export function formatCurrencyValue(value) {
  if (!value && value !== 0) return '-';
  
  try {
    const numeric = parseCurrencyValue(value);
    return numeric.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  } catch (error) {
    console.warn(`Failed to format currency value: ${value}`, error);
    return '-';
  }
}

/**
 * Truncate text with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 * 
 * @example
 * truncateText('Lorem ipsum dolor sit amet', 15) // "Lorem ipsum do..."
 */
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatTitleCase,
  parseCurrencyValue,
  formatCurrency,
  formatCurrencyValue,
  truncateText,
};
