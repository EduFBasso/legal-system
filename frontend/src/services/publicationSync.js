const STORAGE_KEY = 'publication-sync-event';
const LOCAL_EVENT = 'publicationSyncEvent';

export function notifyPublicationSync(event) {
  const payload = {
    timestamp: Date.now(),
    ...event,
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: payload }));
    }
  } catch (error) {
    console.error('[PublicationSync] Failed to broadcast publication event:', error);
  }
}

export function subscribePublicationSync(callback) {
  const onStorage = (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      callback(JSON.parse(event.newValue));
    } catch (error) {
      console.error('[PublicationSync] Failed to parse storage payload:', error);
    }
  };

  const onLocal = (event) => {
    callback(event.detail);
  };

  window.addEventListener('storage', onStorage);
  window.addEventListener(LOCAL_EVENT, onLocal);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LOCAL_EVENT, onLocal);
  };
}
