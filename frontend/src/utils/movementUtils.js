/**
 * Utilitários para movimentações processuais
 */

/**
 * Mapeia tipo de movimentação para exibição legível
 */
export const getTipoDisplay = (tipo, tipoCustomizado) => {
  if (!tipo) return '';
  
  const tipoMap = {
    'DESPACHO': 'Despacho',
    'DECISAO': 'Decisão Interlocutória',
    'SENTENCA': 'Sentença',
    'ACORDAO': 'Acórdão',
    'AUDIENCIA': 'Audiência',
    'JUNTADA': 'Juntada de Documento',
    'INTIMACAO': 'Intimação',
    'CITACAO': 'Citação',
    'CONCLUSAO': 'Conclusos',
    'RECURSO': 'Recurso',
    'PETICAO': 'Petição Protocolada',
    'OUTROS': tipoCustomizado || 'Outros'
  };
  
  return tipoMap[tipo] || tipo;
};

/**
 * Escapa caracteres especiais de regex
 */
export const escapeRegExp = (value = '') => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Remove duplicação de tipo da descrição manual
 */
export const sanitizeManualDescription = (descricao, tipoDisplay, tipoRaw) => {
  if (!descricao) return '';

  let sanitizedDescription = descricao.trim();
  const prefixes = [tipoDisplay, tipoRaw].filter(Boolean);

  prefixes.forEach((prefix) => {
    const prefixRegex = new RegExp(
      `^(?:tipo\\s*[:\\-–—]\\s*)?${escapeRegExp(prefix)}\\s*[:\\-–—]\\s*`,
      'i'
    );
    sanitizedDescription = sanitizedDescription.replace(prefixRegex, '');
  });

  return sanitizedDescription;
};

/**
 * Calcula dias até vencimento
 */
export const getDaysToDueDate = (dueDate) => {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);
  const diffMs = due.getTime() - today.getTime();

  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Retorna urgência baseada em dias restantes
 */
export const calculateUrgency = (dueDate) => {
  const daysRemaining = getDaysToDueDate(dueDate);
  if (daysRemaining === null) return 'NORMAL';
  
  if (daysRemaining <= 3) return 'URGENTISSIMO';
  if (daysRemaining <= 7) return 'URGENTE';
  return 'NORMAL';
};

/**
 * Lista de tipos de movimento padrão
 */
export const MOVIMENTO_TIPOS = [
  'DESPACHO',
  'DECISAO',
  'SENTENCA',
  'ACORDAO',
  'AUDIENCIA',
  'JUNTADA',
  'INTIMACAO',
  'CITACAO',
  'CONCLUSAO',
  'RECURSO',
  'PETICAO',
  'OUTROS'
];

/**
 * Trunca texto em comprimento específico tentando terminar em frase
 */
export const truncateAtSentence = (text, minChars = 240, maxChars = 360) => {
  if (!text || text.length <= minChars) {
    return text;
  }

  let truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastComma = truncated.lastIndexOf(',');

  if (lastPeriod > minChars) {
    truncated = text.substring(0, lastPeriod + 1);
  } else if (lastComma > minChars) {
    truncated = text.substring(0, lastComma + 1);
  }

  return truncated + '...';
};
