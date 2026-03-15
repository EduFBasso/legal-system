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
  
  const str = String(value).trim();
  
  // Remove 'R$' prefix and whitespace
  let cleaned = str.replace(/R\$/g, '').replace(/\s/g, '');
  
  // Detect format and normalize
  if (cleaned.includes(',')) {
    // Brazilian format with comma as decimal: "1.234,56" → "1234.56"
    // Remove all dots (thousand separators), then replace comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else if (cleaned.match(/\d+\.\d{2}$/)) {
    // Likely ISO format with decimal point: "15000.00"
    // Keep as-is (dot is already decimal separator)
  } else {
    // Plain number or thousand-separated without decimal: "1234" or "1.234"
    // Remove dots (they're thousand separators)
    cleaned = cleaned.replace(/\./g, '');
  }
  
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

/**
 * Format CPF with mask (000.000.000-00)
 * 
 * @param {string} value - CPF string with only digits or already formatted
 * @returns {string} Formatted CPF or original value if invalid
 * 
 * @example
 * formatCPF('12345678900') // "123.456.789-00"
 */
export function formatCPF(value) {
  if (!value) return '-';
  
  try {
    // Remove non-digits
    const digits = String(value).replace(/\D/g, '');
    
    // Check if it's a valid CPF length
    if (digits.length !== 11) return value;
    
    // Apply mask: XXX.XXX.XXX-XX
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } catch (error) {
    console.warn(`Failed to format CPF: ${value}`, error);
    return value;
  }
}

/**
 * Format CNPJ with mask (00.000.000/0000-00)
 * 
 * @param {string} value - CNPJ string with only digits or already formatted
 * @returns {string} Formatted CNPJ or original value if invalid
 * 
 * @example
 * formatCNPJ('12345678000191') // "12.345.678/0001-91"
 */
export function formatCNPJ(value) {
  if (!value) return '-';
  
  try {
    // Remove non-digits
    const digits = String(value).replace(/\D/g, '');
    
    // Check if it's a valid CNPJ length
    if (digits.length !== 14) return value;
    
    // Apply mask: XX.XXX.XXX/XXXX-XX
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  } catch (error) {
    console.warn(`Failed to format CNPJ: ${value}`, error);
    return value;
  }
}

/**
 * Format phone number with mask ((XX) XXXXX-XXXX)
 * 
 * @param {string} value - Phone string with only digits or already formatted
 * @returns {string} Formatted phone or original value if invalid
 * 
 * @example
 * formatPhone('11987654321') // "(11) 98765-4321"
 * formatPhone('1133334444') // "(11) 3333-4444"
 */
export function formatPhone(value) {
  if (!value) return '-';
  
  try {
    // Remove non-digits
    const digits = String(value).replace(/\D/g, '');
    
    // Check if it's a valid phone length (10 or 11 digits)
    if (digits.length === 11) {
      // Mobile: (XX) XXXXX-XXXX
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length === 10) {
      // Landline: (XX) XXXX-XXXX
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return value;
  } catch (error) {
    console.warn(`Failed to format phone: ${value}`, error);
    return value;
  }
}

/**
 * Apply progressive CNJ mask to a processo number while typing.
 * Format: NNNNNNN-DD.AAAA.J.TT.OOOO (20 digits total)
 *
 * @param {string} value - Raw input (digits and/or separators)
 * @returns {string} Masked string up to full CNJ format
 *
 * @example
 * maskNumeroProcesso('0001234') // "0001234"
 * maskNumeroProcesso('000123456') // "0001234-56"
 * maskNumeroProcesso('00012345620248') // "0001234-56.2024.8"
 * maskNumeroProcesso('0001234562024826') // "0001234-56.2024.8.26"
 * maskNumeroProcesso('00012345620248260001') // "0001234-56.2024.8.26.0001"
 */
export function maskNumeroProcesso(value) {
  if (!value) return '';

  const digits = String(value).replace(/\D/g, '').slice(0, 20);

  if (digits.length <= 7) return digits;
  if (digits.length <= 9)  return `${digits.slice(0, 7)}-${digits.slice(7)}`;
  if (digits.length <= 13) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9)}`;
  if (digits.length <= 14) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13)}`;
  if (digits.length <= 16) return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14)}`;
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16)}`;
}

/**
 * Format document (CPF or CNPJ based on length)
 *
 * @param {string} value - Document string
 * @param {string} personType - 'PF' for CPF or 'PJ' for CNPJ
 * @returns {string} Formatted document
 *
 * @example
 * formatDocument('12345678900', 'PF') // "123.456.789-00"
 * formatDocument('12345678000191', 'PJ') // "12.345.678/0001-91"
 */
export function formatDocument(value, personType) {
  if (!value) return '-';
  
  if (personType === 'PJ') {
    return formatCNPJ(value);
  }
  return formatCPF(value);
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
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatDocument,
  maskNumeroProcesso,
};
