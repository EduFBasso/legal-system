// src/utils/masks.js
/**
 * @fileoverview Input masks e validações para campos brasileiros
 * @module utils/masks
 * 
 * Máscaras de formatação em tempo real para:
 * - CPF: 000.000.000-00
 * - CNPJ: 00.000.000/0000-00
 * - Telefone: (00) 0000-0000 ou (00) 00000-0000 (auto-detecta)
 * - CEP: 00000-000
 * - Número de Processo CNJ: 0000000-00.0000.0.00.0000
 * 
 * Também inclui validações completas com dígitos verificadores.
 * 
 * @example
 * import { maskCPF, unmask, isValidCPF } from './masks';
 * 
 * const formatted = maskCPF('12345678901'); // "123.456.789-01"
 * const clean = unmask('123.456.789-01');    // "12345678901"
 * const valid = isValidCPF('12345678901');   // true/false
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 * @param {string} value - Valor a ser limpo
 * @returns {string} String contendo apenas dígitos
 * @example
 * unmask('123.456.789-01') // "12345678901"
 * unmask('(11) 98765-4321') // "11987654321"
 */
export function unmask(value) {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Aplica máscara de formatação para CPF
 * @param {string} value - CPF sem formatação ou parcialmente formatado
 * @returns {string} CPF formatado como 000.000.000-00
 * @example
 * maskCPF('12345678901') // "123.456.789-01"
 * maskCPF('123')         // "123"
 * maskCPF('123456')      // "123.456"
 */
export function maskCPF(value) {
  const numbers = unmask(value);
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
}

/**
 * Aplica máscara de formatação para CNPJ
 * @param {string} value - CNPJ sem formatação ou parcialmente formatado
 * @returns {string} CNPJ formatado como 00.000.000/0000-00
 * @example
 * maskCNPJ('12345678000190') // "12.345.678/0001-90"
 * maskCNPJ('12345')          // "12.345"
 */
export function maskCNPJ(value) {
  const numbers = unmask(value);
  
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
}

/**
 * Aplica máscara de formatação para telefone
 * Detecta automaticamente se é fixo (8 dígitos) ou celular (9 dígitos)
 * @param {string} value - Telefone sem formatação ou parcialmente formatado
 * @returns {string} Telefone formatado como (00) 0000-0000 ou (00) 00000-0000
 * @example
 * maskPhone('1133334444')   // "(11) 3333-4444" (fixo)
 * maskPhone('11987654321')  // "(11) 98765-4321" (celular)
 */
export function maskPhone(value) {
  const numbers = unmask(value);
  
  if (numbers.length === 0) {
    return '';
  } else if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    // Fixo: (00) 0000-0000
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
  } else {
    // Celular: (00) 00000-0000
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
}

/**
 * Aplica máscara de formatação para CEP
 * @param {string} value - CEP sem formatação ou parcialmente formatado
 * @returns {string} CEP formatado como 00000-000
 * @example
 * maskCEP('01310100')  // "01310-100"
 * maskCEP('01310')     // "01310"
 */
export function maskCEP(value) {
  const numbers = unmask(value);
  
  if (numbers.length <= 5) {
    return numbers;
  } else {
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }
}

/**
 * Aplica máscara automática para CPF ou CNPJ baseado no tipo de pessoa
 * @param {string} value - Documento sem formatação ou parcialmente formatado
 * @param {('PF'|'PJ')} personType - Tipo de pessoa: 'PF' (Pessoa Física) ou 'PJ' (Pessoa Jurídica)
 * @returns {string} Documento formatado (CPF se PF, CNPJ se PJ)
 * @example
 * maskDocument('12345678901', 'PF')     // "123.456.789-01"
 * maskDocument('12345678000190', 'PJ')  // "12.345.678/0001-90"
 */
export function maskDocument(value, personType) {
  if (personType === 'PJ') {
    return maskCNPJ(value);
  } else {
    return maskCPF(value);
  }
}

/**
 * Valida CPF usando algoritmo completo com dígitos verificadores
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean} true se CPF válido, false caso contrário
 * @example
 * isValidCPF('123.456.789-01')  // false (inválido)
 * isValidCPF('111.111.111-11')  // false (sequência inválida)
 */
export function isValidCPF(cpf) {
  const numbers = unmask(cpf);
  
  if (numbers.length !== 11) return false;
  
  // Verifica sequências inválidas (todos iguais)
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  
  if (parseInt(numbers.charAt(9)) !== digit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  
  return parseInt(numbers.charAt(10)) === digit2;
}

/**
 * Valida CNPJ usando algoritmo completo com dígitos verificadores
 * @param {string} cnpj - CNPJ com ou sem formatação
 * @returns {boolean} true se CNPJ válido, false caso contrário
 * @example
 * isValidCNPJ('12.345.678/0001-90')  // validará com algoritmo
 * isValidCNPJ('11.111.111/1111-11')  // false (sequência inválida)
 */
export function isValidCNPJ(cnpj) {
  const numbers = unmask(cnpj);
  
  if (numbers.length !== 14) return false;
  
  // Verifica sequências inválidas
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validação dos dígitos verificadores
  let size = numbers.length - 2;
  let digits = numbers.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

/**
 * Aplica máscara para número de processo judicial (formato CNJ)
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
 * - NNNNNNN: Número sequencial do processo
 * - DD: Dígito verificador
 * - AAAA: Ano de ajuizamento
 * - J: Segmento da Justiça (1-9)
 * - TR: Tribunal (01-99)
 * - OOOO: Origem (vara/comarca)
 * 
 * @param {string} value - Número do processo sem formatação (20 dígitos)
 * @returns {string} Número formatado como 0000000-00.0000.0.00.0000
 * @example
 * maskProcessNumber('12345678901234567890')  // "1234567-89.0123.4.56.7890"
 */
export function maskProcessNumber(value) {
  const numbers = unmask(value);
  
  if (numbers.length <= 7) {
    return numbers;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length <= 13) {
    return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9)}`;
  } else if (numbers.length <= 14) {
    return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13)}`;
  } else if (numbers.length <= 16) {
    return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14)}`;
  } else {
    return `${numbers.slice(0, 7)}-${numbers.slice(7, 9)}.${numbers.slice(9, 13)}.${numbers.slice(13, 14)}.${numbers.slice(14, 16)}.${numbers.slice(16, 20)}`;
  }
}
