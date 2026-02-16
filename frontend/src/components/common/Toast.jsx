// src/components/common/Toast.jsx
/**
 * @fileoverview Toast/Notificação temporizada
 * Baseado no SystemMessageModal do clinic-system
 * 
 * @example
 * <Toast
 *   isOpen={showToast}
 *   message="Contato criado com sucesso!"
 *   type="success"
 *   onClose={() => setShowToast(false)}
 *   autoCloseMs={3000}
 * />
 */

import { useEffect, useRef } from 'react';
import Modal from '../Modal';
import './Toast.css';

/**
 * Toast - Notificação temporizada com auto-close
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade
 * @param {string} props.message - Mensagem a exibir
 * @param {'success'|'error'|'info'|'warning'} [props.type='info'] - Tipo da mensagem
 * @param {function} props.onClose - Callback ao fechar
 * @param {number} [props.autoCloseMs=3000] - Tempo para fechar automaticamente (ms)
 */
export default function Toast({
  isOpen,
  message,
  type = 'info',
  onClose,
  autoCloseMs = 3000,
}) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && autoCloseMs > 0) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoCloseMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen || !message) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="small"
    >
      <div className="toast-content-wrapper">
        <div className={`toast-card toast-${type}`}>
          <div className="toast-message">{message}</div>
          <button
            className={`toast-button toast-button-${type}`}
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}
