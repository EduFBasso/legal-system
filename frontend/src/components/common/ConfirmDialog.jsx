// src/components/common/ConfirmDialog.jsx
/**
 * @fileoverview Modal de confirmação genérico
 * Extraído do padrão de exclusão do ContactDetailModal
 * 
 * @example
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   type="danger"
 *   title="⚠️ Confirmar Exclusão"
 *   message="Tem certeza que deseja excluir João Silva?"
 *   warningMessage="Esta ação é irreversível!"
 *   confirmText="🗑️ Sim, excluir definitivamente"
 *   cancelText="✅ Não, manter contato"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 *   requirePassword={!!settings.deletePassword}
 *   password={password}
 *   onPasswordChange={setPassword}
 *   passwordError={passwordError}
 * />
 */

import Modal from '../Modal';
import './ConfirmDialog.css';

/**
 * ConfirmDialog - Modal de confirmação com suporte a senha
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade
 * @param {'danger'|'warning'|'info'} [props.type='info'] - Tipo visual do diálogo
 * @param {string} props.title - Título do modal
 * @param {string} props.message - Mensagem principal
 * @param {string} [props.warningMessage] - Mensagem de aviso adicional (ex: "irreversível")
 * @param {string} [props.confirmText='Confirmar'] - Texto do botão de confirmação
 * @param {string} [props.cancelText='Cancelar'] - Texto do botão de cancelamento
 * @param {function} props.onConfirm - Callback ao confirmar
 * @param {function} props.onCancel - Callback ao cancelar
 * @param {boolean} [props.requirePassword=false] - Exige senha para confirmar
 * @param {string} [props.password=''] - Valor do campo de senha
 * @param {function} [props.onPasswordChange] - Callback para mudança de senha
 * @param {string} [props.passwordError=''] - Mensagem de erro da senha
 */
export default function ConfirmDialog({
  isOpen,
  type = 'info',
  title,
  message,
  warningMessage,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  requirePassword = false,
  password = '',
  onPasswordChange,
  passwordError = '',
}) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="small"
    >
      <div className={`confirm-dialog-content confirm-dialog-${type}`}>
        <p className="confirm-message">{message}</p>
        
        {warningMessage && (
          <p className="confirm-warning">⚠️ {warningMessage}</p>
        )}
        
        {requirePassword && (
          <div className="confirm-password-section">
            <label htmlFor="confirm-password" className="confirm-password-label">
              🔒 Digite a senha para confirmar:
            </label>
            <input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="confirm-password-input"
              placeholder="Senha de confirmação"
              autoFocus
            />
          </div>
        )}
        
        {passwordError && (
          <p className="confirm-error">❌ {passwordError}</p>
        )}
        
        <div className="confirm-actions">
          <button
            onClick={onCancel}
            className="btn-cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`btn-confirm btn-confirm-${type}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
