/**
 * @fileoverview Toast notification system hook and context
 * @module hooks/useToast
 * 
 * Provides a centralized way to show notifications across the application.
 * Should be wrapped in ToastProvider at app root level.
 */

import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Toast Context - stores toast state
 * @type {React.Context}
 */
const ToastContext = createContext();

/**
 * Toast Provider Component
 * Must wrap the entire app or component tree that uses useToast
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element}
 * 
 * @example
 * // In main.jsx or App.jsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = { toasts, addToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 * Must be used inside a component tree wrapped by ToastProvider
 * 
 * @returns {Object} Toast utilities
 * @returns {Function} returns.show - Show a toast
 * @returns {Function} returns.success - Show success toast
 * @returns {Function} returns.error - Show error toast
 * @returns {Function} returns.warning - Show warning toast
 * @returns {Function} returns.info - Show info toast
 * 
 * @example
 * const { show, success, error } = useToast();
 * 
 * @example
 * success('Salvo com sucesso!');
 * 
 * @example
 * error('Erro ao salvar', 5000); // 5 seconds duration
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be used inside a ToastProvider. ' +
      'Make sure your app is wrapped with <ToastProvider> in main.jsx'
    );
  }

  const { addToast, removeToast } = context;

  return {
    /**
     * Show a toast message with custom type
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'info', 'success', 'error', 'warning'
     * @param {number} duration - Duration in milliseconds (0 = never auto-hide)
     * @returns {number} Toast ID
     */
    show: (message, type = 'info', duration = 3000) => addToast(message, type, duration),

    /**
     * Show success toast (green)
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {number} Toast ID
     */
    success: (message, duration = 3000) => addToast(message, 'success', duration),

    /**
     * Show error toast (red)
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {number} Toast ID
     */
    error: (message, duration = 5000) => addToast(message, 'error', duration),

    /**
     * Show warning toast (orange)
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {number} Toast ID
     */
    warning: (message, duration = 4000) => addToast(message, 'warning', duration),

    /**
     * Show info toast (blue)
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     * @returns {number} Toast ID
     */
    info: (message, duration = 3000) => addToast(message, 'info', duration),

    /**
     * Remove a specific toast by ID
     * @param {number} id - Toast ID
     */
    remove: removeToast,
  };
}

/**
 * Toast Container Component - Renders toasts
 * Automatically included in ToastProvider
 */
function ToastContainer({ toasts, onClose }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * Individual Toast Component
 */
function Toast({ message, type, onClose }) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getBackground = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
      case 'error':
        return 'linear-gradient(135deg, #f44336 0%, #da190b 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)';
      case 'info':
        return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
      default:
        return 'linear-gradient(135deg, #757575 0%, #424242 100%)';
    }
  };

  return (
    <div
      className={`toast toast-${type}`}
      style={{
        background: getBackground(),
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button
        className="toast-close"
        onClick={onClose}
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  );
}

export default useToast;
