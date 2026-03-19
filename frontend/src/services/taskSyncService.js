/**
 * Task Sync Service - Abstract layer for cross-tab/cross-device task synchronization
 * 
 * Provides a clean interface that can switch between:
 * - BroadcastChannel (current: same browser, same origin)
 * - WebSocket (future: online, multiplataform)
 * - Polling (future: fallback)
 */

let syncImplementation = null;

/**
 * Initialize the sync implementation (injected at app startup)
 */
export const initTaskSync = (implementation) => {
  syncImplementation = implementation;
  if (syncImplementation && typeof syncImplementation.init === 'function') {
    syncImplementation.init();
  }
};

/**
 * Subscribe to task updates across tabs/devices
 * @param {Function} callback - Called when task changes: callback(event)
 *   event = { type: 'task-updated', action: 'status-changed'|'deleted', taskId, caseId, newStatus }
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToTaskUpdates = (callback) => {
  if (!syncImplementation) {
    return () => {};
  }
  return syncImplementation.subscribe(callback);
};

/**
 * Notify all tabs/devices that a task has been updated
 * @param {Object} event - Update event
 *   { type: 'task-updated', action: 'status-changed'|'deleted', taskId, caseId, newStatus }
 */
export const notifyTaskUpdate = (event) => {
  if (!syncImplementation) {
    return;
  }
  syncImplementation.notify(event);
};

/**
 * Clean up resources (called on app unmount)
 */
export const cleanupTaskSync = () => {
  if (syncImplementation && syncImplementation.cleanup) {
    syncImplementation.cleanup();
  }
};
