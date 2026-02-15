// src/utils/masks.js
// Máscaras de input para formatação em tempo real

/**
 * Remove todos os caracteres não numéricos
 */
export function unmask(value) {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Máscara para CPF: 000.000.000-00
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
 * Máscara para CNPJ: 00.000.000/0000-00
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
 * Máscara para Telefone: (00) 0000-0000 ou (00) 00000-0000
 * Detecta automaticamente se é fixo (8 dígitos) ou celular (9 dígitos)
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
 * Máscara para CEP: 00000-000
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
 * Máscara para documento (CPF ou CNPJ) - detecta automaticamente
 */
export function maskDocument(value, personType) {
  if (personType === 'PJ') {
    return maskCNPJ(value);
  } else {
    return maskCPF(value);
  }
}

/**
 * Validação básica de CPF (algoritmo simplificado)
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
 * Validação básica de CNPJ (algoritmo simplificado)
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
 * Máscara para número do processo CNJ: 0000000-00.0000.0.00.0000
 * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
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
