/**
 * Task Sync Implementation - BroadcastChannel
 * 
 * Uses browser's BroadcastChannel API for cross-tab communication
 * Same browser, same origin only (but covers 90% of use cases)
 * 
 * Future: Can be replaced with taskSyncWebSocket.js or taskSyncPolling.js
 */

class TaskSyncBroadcast {
  constructor() {
    this.channel = null;
    this.subscribers = [];
    this.storageEventKey = 'task-sync-event';
    this.storageListener = this.handleStorageEvent.bind(this);
    this.init();
  }

  init() {
    try {
      // Check if BroadcastChannel is supported
      if (!window.BroadcastChannel) {
        console.warn('❌ [TaskSync.init] BroadcastChannel not supported in this browser. Task sync disabled.');
        this.channel = null;
        return;
      }

      // Se já tinha canal, fecha antes de recriar
      if (this.channel) {
        try {
          this.channel.close();
        } catch (e) {
          console.warn('[TaskSync.init] Error closing previous channel:', e);
        }
      }

      this.channel = new BroadcastChannel('task-sync-channel');
      
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', this.storageListener);
        window.addEventListener('storage', this.storageListener);
      }

    } catch (error) {
      console.error('❌ [TaskSync.init] Failed to initialize BroadcastChannel:', error);
      this.channel = null;
    }
  }

  /**
   * Subscribe to task updates
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    // Se o channel foi destruído, tenta recriar
    if (!this.channel && window.BroadcastChannel) {
      this.init();
    }

    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify other tabs about task update
   * @param {Object} event
   */
  notify(event) {
    // Se o channel foi destruído (por hot reload), tenta recriar
    if (!this.channel && window.BroadcastChannel) {
      this.init();
    }

    if (!this.channel) {
      console.warn('⚠️ [TaskSync.notify] BroadcastChannel not available. Message not sent.', {
        hasWindow: typeof window !== 'undefined',
        hasBroadcastChannel: !!window?.BroadcastChannel,
        subscriberCount: this.subscribers.length
      });
      return;
    }

    try {
      const payload = {
        timestamp: Date.now(),
        ...event,
      };

      this.channel.postMessage(payload);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.storageEventKey, JSON.stringify(payload));
      }
    } catch (error) {
      console.error('❌ [TaskSync.notify] Failed to broadcast task update:', error);
    }
  }

  handleStorageEvent(event) {
    if (event.key !== this.storageEventKey || !event.newValue) {
      return;
    }

    try {
      const data = JSON.parse(event.newValue);
      this.handleMessage(data);
    } catch (error) {
      console.error('❌ [TaskSync.storage] Failed to parse storage event payload:', error);
    }
  }

  /**
   * Handle incoming message from other tabs
   * @private
   */
  handleMessage(data) {
    // Call all registered subscribers
    this.subscribers.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in task sync subscriber:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.subscribers = [];
  }
}

export default new TaskSyncBroadcast();
