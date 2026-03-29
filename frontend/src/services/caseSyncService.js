export const CASE_SYNC_STORAGE_KEY = 'legal_system_case_sync_event';

const normalizeCaseIds = (caseIds = []) => {
  if (!Array.isArray(caseIds)) return [];

  const seen = new Set();
  const normalized = [];

  caseIds.forEach((value) => {
    const parsed = Number(value);
    if (!parsed) return;
    if (seen.has(parsed)) return;
    seen.add(parsed);
    normalized.push(parsed);
  });

  return normalized;
};

export function notifyCaseSync({ caseIds = [], action = 'updated', source = 'unknown' } = {}) {
  const normalizedCaseIds = normalizeCaseIds(caseIds);
  if (normalizedCaseIds.length === 0) return;

  try {
    window.localStorage.setItem(
      CASE_SYNC_STORAGE_KEY,
      JSON.stringify({
        caseIds: normalizedCaseIds,
        action: String(action || 'updated').trim() || 'updated',
        source: String(source || 'unknown').trim() || 'unknown',
        timestamp: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

export function parseCaseSyncStorageValue(value) {
  if (!value) return null;

  try {
    const payload = JSON.parse(value);
    const caseIds = normalizeCaseIds(payload?.caseIds);
    if (caseIds.length === 0) return null;

    return {
      caseIds,
      action: String(payload?.action || 'updated').trim() || 'updated',
      source: String(payload?.source || 'unknown').trim() || 'unknown',
      timestamp: Number(payload?.timestamp) || Date.now(),
    };
  } catch {
    return null;
  }
}
