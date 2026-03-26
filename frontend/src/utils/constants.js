/**
 * @fileoverview Application constants, enums, and choices
 * @module utils/constants
 * 
 * Centralized definitions for all choice fields and enums used across the application.
 * Derived from Django model choices in backend/apps/cases/models.py
 */

/**
 * Case Status
 */
export const CASE_STATUS = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
  SUSPENSO: 'SUSPENSO',
  ARQUIVADO: 'ARQUIVADO',
  ENCERRADO: 'ENCERRADO',
};

export const CASE_STATUS_CHOICES = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'INATIVO', label: 'Inativo' },
  { value: 'SUSPENSO', label: 'Suspenso' },
  { value: 'ARQUIVADO', label: 'Arquivado' },
  { value: 'ENCERRADO', label: 'Encerrado' },
];

export const CASE_STATUS_DISPLAY = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  SUSPENSO: 'Suspenso',
  ARQUIVADO: 'Arquivado',
  ENCERRADO: 'Encerrado',
};

/**
 * Case Types (Áreas do Direito)
 */
export const CASE_TYPES = {
  CIVEL: 'CIVEL',
  CRIMINAL: 'CRIMINAL',
  TRABALHISTA: 'TRABALHISTA',
  TRIBUTARIA: 'TRIBUTARIA',
  FAMILIA: 'FAMILIA',
  CONSUMIDOR: 'CONSUMIDOR',
  OUTROS: 'OUTROS',
};

export const CASE_TYPES_CHOICES = [
  { value: 'CIVEL', label: 'Cível' },
  { value: 'CRIMINAL', label: 'Criminal' },
  { value: 'TRABALHISTA', label: 'Trabalhista' },
  { value: 'TRIBUTARIA', label: 'Tributária' },
  { value: 'FAMILIA', label: 'Família' },
  { value: 'CONSUMIDOR', label: 'Consumidor' },
  { value: 'OUTROS', label: 'Outros' },
];

export const CASE_TYPES_DISPLAY = {
  CIVEL: 'Cível',
  CRIMINAL: 'Criminal',
  TRABALHISTA: 'Trabalhista',
  TRIBUTARIA: 'Tributária',
  FAMILIA: 'Família',
  CONSUMIDOR: 'Consumidor',
  OUTROS: 'Outros',
};

/**
 * Party Roles (Papéis no Processo)
 */
export const PARTY_ROLES = {
  CLIENTE: 'CLIENTE',
  AUTOR: 'AUTOR',
  REU: 'REU',
  TESTEMUNHA: 'TESTEMUNHA',
  PERITO: 'PERITO',
  TERCEIRO: 'TERCEIRO',
};

export const PARTY_ROLES_CHOICES = [
  { value: 'AUTOR', label: 'Autor' },
  { value: 'REU', label: 'Réu' },
  { value: 'TESTEMUNHA', label: 'Testemunha' },
  { value: 'PERITO', label: 'Perito' },
  { value: 'TERCEIRO', label: 'Terceiro Interessado' },
];

export const PARTY_ROLES_DISPLAY = {
  AUTOR: 'Autor',
  REU: 'Réu',
  TESTEMUNHA: 'Testemunha',
  PERITO: 'Perito',
  TERCEIRO: 'Terceiro Interessado',
};

/**
 * Movement Types (Tipos de Movimentações)
 */
export const MOVEMENT_TYPES = {
  DESPACHO: 'DESPACHO',
  DECISAO: 'DECISAO',
  SENTENCA: 'SENTENCA',
  ACORDAO: 'ACORDAO',
  AUDIENCIA: 'AUDIENCIA',
  JUNTADA: 'JUNTADA',
  INTIMACAO: 'INTIMACAO',
  CITACAO: 'CITACAO',
  CONCLUSAO: 'CONCLUSAO',
  RECURSO: 'RECURSO',
  PETICAO: 'PETICAO',
  OUTROS: 'OUTROS',
};

export const MOVEMENT_TYPES_CHOICES = [
  { value: 'DESPACHO', label: 'Despacho' },
  { value: 'DECISAO', label: 'Decisão Interlocutória' },
  { value: 'SENTENCA', label: 'Sentença' },
  { value: 'ACORDAO', label: 'Acórdão' },
  { value: 'AUDIENCIA', label: 'Audiência' },
  { value: 'JUNTADA', label: 'Juntada de Documento' },
  { value: 'INTIMACAO', label: 'Intimação' },
  { value: 'CITACAO', label: 'Citação' },
  { value: 'CONCLUSAO', label: 'Conclusos' },
  { value: 'RECURSO', label: 'Recurso' },
  { value: 'PETICAO', label: 'Petição Protocolada' },
  { value: 'OUTROS', label: 'Outros' },
];

export const MOVEMENT_TYPES_DISPLAY = {
  DESPACHO: 'Despacho',
  DECISAO: 'Decisão Interlocutória',
  SENTENCA: 'Sentença',
  ACORDAO: 'Acórdão',
  AUDIENCIA: 'Audiência',
  JUNTADA: 'Juntada de Documento',
  INTIMACAO: 'Intimação',
  CITACAO: 'Citação',
  CONCLUSAO: 'Conclusos',
  RECURSO: 'Recurso',
  PETICAO: 'Petição Protocolada',
  OUTROS: 'Outros',
};

/**
 * Movement Origins (Origem das Movimentações)
 */
export const MOVEMENT_ORIGINS = {
  MANUAL: 'MANUAL',
  DJE: 'DJE',
  ESAJ: 'ESAJ',
  PJE: 'PJE',
};

export const MOVEMENT_ORIGINS_CHOICES = [
  { value: 'MANUAL', label: 'Cadastro Manual' },
  { value: 'DJE', label: 'Importado do DJE' },
  { value: 'ESAJ', label: 'Importado do e-SAJ' },
  { value: 'PJE', label: 'Importado do PJE' },
];

export const MOVEMENT_ORIGINS_DISPLAY = {
  MANUAL: 'Cadastro Manual',
  DJE: 'Importado do DJE',
  ESAJ: 'Importado do e-SAJ',
  PJE: 'Importado do PJE',
};

/**
 * Client Positions (Posições do Cliente Principal)
 */
export const CLIENT_POSITIONS = {
  AUTOR: 'AUTOR',
  REU: 'REU',
};

export const CLIENT_POSITIONS_CHOICES = [
  { value: 'AUTOR', label: 'Autor/Requerente' },
  { value: 'REU', label: 'Réu/Requerido' },
];

export const CLIENT_POSITIONS_DISPLAY = {
  AUTOR: 'Autor/Requerente',
  REU: 'Réu/Requerido',
};

/**
 * Participation Types (Tipos de Participação)
 */
export const PARTICIPATION_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

export const PARTICIPATION_TYPES_CHOICES = [
  { value: 'percentage', label: 'Percentual' },
  { value: 'fixed', label: 'Valor Fixo' },
];

export const PARTICIPATION_TYPES_DISPLAY = {
  percentage: 'Percentual',
  fixed: 'Valor Fixo',
};

/**
 * Tribunals (Tribunais)
 */
export const TRIBUNALS = {
  TJSP: 'TJSP',
  TJMG: 'TJMG',
  TJRJ: 'TJRJ',
  TJBA: 'TJBA',
  TJRS: 'TJRS',
  TJGO: 'TJGO',
  TJPR: 'TJPR',
  TJSC: 'TJSC',
  TJDF: 'TJDF',
  TJES: 'TJES',
  TRF1: 'TRF1',
  TRF2: 'TRF2',
  TRF3: 'TRF3',
  TRF4: 'TRF4',
  TRF5: 'TRF5',
  STF: 'STF',
  STJ: 'STJ',
  TST: 'TST',
  TRT: 'TRT',
};

export const TRIBUNALS_CHOICES = [
  // State Supreme Courts
  { value: 'TJSP', label: 'TJSP - SP' },
  { value: 'TJMG', label: 'TJMG - MG' },
  { value: 'TJRJ', label: 'TJRJ - RJ' },
  { value: 'TJBA', label: 'TJBA - BA' },
  { value: 'TJRS', label: 'TJRS - RS' },
  { value: 'TJGO', label: 'TJGO - GO' },
  { value: 'TJPR', label: 'TJPR - PR' },
  { value: 'TJSC', label: 'TJSC - SC' },
  { value: 'TJDF', label: 'TJDF - DF' },
  { value: 'TJES', label: 'TJES - ES' },
  // Federal Courts
  { value: 'TRF1', label: 'TRF1 - 1ª Região' },
  { value: 'TRF2', label: 'TRF2 - 2ª Região' },
  { value: 'TRF3', label: 'TRF3 - 3ª Região' },
  { value: 'TRF4', label: 'TRF4 - 4ª Região' },
  { value: 'TRF5', label: 'TRF5 - 5ª Região' },
  // Superior Courts
  { value: 'STF', label: 'STF - Supremo Tribunal Federal' },
  { value: 'STJ', label: 'STJ - Superior Tribunal de Justiça' },
  { value: 'TST', label: 'TST - Tribunal Superior do Trabalho' },
  { value: 'TRT', label: 'TRT - Tribunal Regional do Trabalho' },
];

export const TRIBUNALS_DISPLAY = {
  TJSP: 'TJSP - SP',
  TJMG: 'TJMG - MG',
  TJRJ: 'TJRJ - RJ',
  TJBA: 'TJBA - BA',
  TJRS: 'TJRS - RS',
  TJGO: 'TJGO - GO',
  TJPR: 'TJPR - PR',
  TJSC: 'TJSC - SC',
  TJDF: 'TJDF - DF',
  TJES: 'TJES - ES',
  TRF1: 'TRF1 - 1ª Região',
  TRF2: 'TRF2 - 2ª Região',
  TRF3: 'TRF3 - 3ª Região',
  TRF4: 'TRF4 - 4ª Região',
  TRF5: 'TRF5 - 5ª Região',
  STF: 'STF - Supremo Tribunal Federal',
  STJ: 'STJ - Superior Tribunal de Justiça',
  TST: 'TST - Tribunal Superior do Trabalho',
  TRT: 'TRT - Tribunal Regional do Trabalho',
};

/**
 * Status colors for UI
 */
export const STATUS_COLORS = {
  ATIVO: '#4caf50',
  INATIVO: '#9e9e9e',
  SUSPENSO: '#ff9800',
  ARQUIVADO: '#757575',
  ENCERRADO: '#2196f3',
};

/**
 * Tribunal colors for UI
 */
export const TRIBUNAL_COLORS = {
  TJSP: '#1976d2',
  STF: '#c62828',
  STJ: '#6a1b9a',
  TRF1: '#00796b',
  TRF2: '#00796b',
  TRF3: '#00796b',
  TRF4: '#00796b',
  TRF5: '#00796b',
  TST: '#f57c00',
};

/**
 * Helper function to get display value for any choice type
 * 
 * @param {string} type - Type of choice (e.g., 'CASE_STATUS', 'PARTY_ROLES')
 * @param {string} value - Value to look up
 * @returns {string} Display value
 * 
 * @example
 * getChoiceDisplay('CASE_STATUS', 'ATIVO') // "Ativo"
 * getChoiceDisplay('PARTY_ROLES', 'CLIENTE') // "Cliente/Representado"
 */
export function getChoiceDisplay(type, value) {
  const displays = {
    CASE_STATUS: CASE_STATUS_DISPLAY,
    CASE_TYPES: CASE_TYPES_DISPLAY,
    PARTY_ROLES: PARTY_ROLES_DISPLAY,
    MOVEMENT_TYPES: MOVEMENT_TYPES_DISPLAY,
    MOVEMENT_ORIGINS: MOVEMENT_ORIGINS_DISPLAY,
    CLIENT_POSITIONS: CLIENT_POSITIONS_DISPLAY,
    PARTICIPATION_TYPES: PARTICIPATION_TYPES_DISPLAY,
    TRIBUNALS: TRIBUNALS_DISPLAY,
  };
  
  return displays[type]?.[value] || value;
}

/**
 * Helper function to get choices array for any type
 * 
 * @param {string} type - Type of choices (e.g., 'CASE_STATUS', 'PARTY_ROLES')
 * @returns {Array} Array of { value, label } objects
 * 
 * @example
 * getChoices('CASE_STATUS')
 * // [{ value: 'ATIVO', label: 'Ativo' }, ...]
 */
export function getChoices(type) {
  const choices = {
    CASE_STATUS: CASE_STATUS_CHOICES,
    CASE_TYPES: CASE_TYPES_CHOICES,
    PARTY_ROLES: PARTY_ROLES_CHOICES,
    MOVEMENT_TYPES: MOVEMENT_TYPES_CHOICES,
    MOVEMENT_ORIGINS: MOVEMENT_ORIGINS_CHOICES,
    CLIENT_POSITIONS: CLIENT_POSITIONS_CHOICES,
    PARTICIPATION_TYPES: PARTICIPATION_TYPES_CHOICES,
    TRIBUNALS: TRIBUNALS_CHOICES,
  };
  
  return choices[type] || [];
}

/**
 * Helper function to get color for a status
 * 
 * @param {string} status - Status value
 * @returns {string} Hex color code
 * 
 * @example
 * getStatusColor('ATIVO') // "#4caf50"
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status] || '#757575';
}

/**
 * Helper function to get color for a tribunal
 * 
 * @param {string} tribunal - Tribunal code
 * @returns {string} Hex color code
 * 
 * @example
 * getTribunalColor('TJSP') // "#1976d2"
 */
export function getTribunalColor(tribunal) {
  return TRIBUNAL_COLORS[tribunal] || '#757575';
}

export default {
  CASE_STATUS,
  CASE_STATUS_CHOICES,
  CASE_STATUS_DISPLAY,
  CASE_TYPES,
  CASE_TYPES_CHOICES,
  CASE_TYPES_DISPLAY,
  PARTY_ROLES,
  PARTY_ROLES_CHOICES,
  PARTY_ROLES_DISPLAY,
  MOVEMENT_TYPES,
  MOVEMENT_TYPES_CHOICES,
  MOVEMENT_TYPES_DISPLAY,
  MOVEMENT_ORIGINS,
  MOVEMENT_ORIGINS_CHOICES,
  MOVEMENT_ORIGINS_DISPLAY,
  CLIENT_POSITIONS,
  CLIENT_POSITIONS_CHOICES,
  CLIENT_POSITIONS_DISPLAY,
  PARTICIPATION_TYPES,
  PARTICIPATION_TYPES_CHOICES,
  PARTICIPATION_TYPES_DISPLAY,
  TRIBUNALS,
  TRIBUNALS_CHOICES,
  TRIBUNALS_DISPLAY,
  STATUS_COLORS,
  TRIBUNAL_COLORS,
  getChoiceDisplay,
  getChoices,
  getStatusColor,
  getTribunalColor,
};
