/**
 * Utils para detectar e normalizar números de processo no padrão CNJ.
 */

import { maskNumeroProcesso } from './formatters';

const CNJ_EXACT_REGEX = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g;
const CNJ_20_DIGITS_REGEX = /\b\d{20}\b/g;
const CNJ_ANY_REGEX = /\b(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}|\d{20})\b/g;

export function normalizeCnj(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (digits.length !== 20) return null;
  return digits;
}

export function formatCnj(value) {
  const digits = normalizeCnj(value);
  if (!digits) return null;
  return maskNumeroProcesso(digits);
}

export function extractCnjs(text) {
  if (!text) return [];
  const source = String(text);

  const found = new Set();

  const exact = source.match(CNJ_EXACT_REGEX) || [];
  exact.forEach((cnj) => {
    const formatted = formatCnj(cnj);
    if (formatted) found.add(formatted);
  });

  const digits20 = source.match(CNJ_20_DIGITS_REGEX) || [];
  digits20.forEach((cnj) => {
    const formatted = formatCnj(cnj);
    if (formatted) found.add(formatted);
  });

  return Array.from(found);
}

export function tokenizeTextWithCnjs(text) {
  const source = String(text || '');
  if (!source) return [];

  const tokens = [];
  let lastIndex = 0;

  for (const match of source.matchAll(CNJ_ANY_REGEX)) {
    const matchText = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({ type: 'text', value: source.slice(lastIndex, index) });
    }

    const formatted = formatCnj(matchText);
    if (formatted) {
      tokens.push({ type: 'cnj', value: formatted, raw: matchText });
    } else {
      tokens.push({ type: 'text', value: matchText });
    }

    lastIndex = index + matchText.length;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: 'text', value: source.slice(lastIndex) });
  }

  return tokens;
}

export function stripHtmlToText(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return String(html);

  const container = document.createElement('div');
  container.innerHTML = String(html);
  return container.textContent || '';
}
