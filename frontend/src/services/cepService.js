/**
 * @fileoverview CEP lookup + offline cache (ViaCEP)
 * @module services/cepService
 *
 * Goal:
 * - When user fills a CEP, fetch address data from ViaCEP
 * - Cache the last results so it keeps working offline for previously seen CEPs
 */

const STORAGE_KEY = 'legal_system_cep_cache_v1';
const MAX_CACHE_ITEMS = 50;

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadCache() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { items: {}, order: [] };
  }

  const cached = safeJsonParse(window.localStorage.getItem(STORAGE_KEY), null);
  if (!cached || typeof cached !== 'object') {
    return { items: {}, order: [] };
  }

  const items = cached.items && typeof cached.items === 'object' ? cached.items : {};
  const order = Array.isArray(cached.order) ? cached.order : [];
  return { items, order };
}

function saveCache(cache) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        items: cache.items,
        order: cache.order,
      })
    );
  } catch {
    // Ignore quota / serialization errors
  }
}

function normalizeCep(cep) {
  return String(cep || '').replace(/\D/g, '').slice(0, 8);
}

export function getCachedCep(cep) {
  const normalized = normalizeCep(cep);
  if (normalized.length !== 8) return null;

  const cache = loadCache();
  const entry = cache.items?.[normalized] || null;
  return entry && typeof entry === 'object' ? entry : null;
}

function putCachedCep(cep, data) {
  const normalized = normalizeCep(cep);
  if (normalized.length !== 8) return;

  const cache = loadCache();
  cache.items = cache.items || {};
  cache.order = Array.isArray(cache.order) ? cache.order : [];

  cache.items[normalized] = {
    ...data,
    cep: normalized,
    fetchedAt: Date.now(),
  };

  cache.order = [normalized, ...cache.order.filter((c) => c !== normalized)].slice(0, MAX_CACHE_ITEMS);

  // Remove items not in order (LRU cap)
  const allowed = new Set(cache.order);
  for (const key of Object.keys(cache.items)) {
    if (!allowed.has(key)) {
      delete cache.items[key];
    }
  }

  saveCache(cache);
}

/**
 * Fetch CEP from ViaCEP. Returns null if not found.
 * @param {string} cep - CEP (with or without mask)
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal]
 */
export async function lookupCep(cep, options = {}) {
  const normalized = normalizeCep(cep);
  if (normalized.length !== 8) return null;

  // Prefer online when available, but always allow fallback to cache
  const cached = getCachedCep(normalized);

  try {
    const url = `https://viacep.com.br/ws/${normalized}/json/`;
    const response = await fetch(url, {
      method: 'GET',
      signal: options.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      return cached;
    }

    const data = await response.json();
    if (!data || data.erro) {
      return null;
    }

    // Persist last successful lookup for offline use
    putCachedCep(normalized, data);

    return data;
  } catch (error) {
    // Offline / DNS / CORS / aborted -> use cache if any
    if (error?.name === 'AbortError') {
      return cached;
    }
    return cached;
  }
}
