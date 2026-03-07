import PropTypes from 'prop-types';
import ConfirmDialog from '../common/ConfirmDialog';

export default function PublicationDeleteDialogs({
  showConfirm,
  pendingDeletePublication,
  onConfirm,
  onCancelConfirm,
  showBlocked,
  blockedMessage,
  onCloseBlocked,
  singleConfirmText = '🗑️ Excluir publicação',
}) {
  const confirmMessage = pendingDeletePublication
    ? (pendingDeletePublication.count
      ? `Apagar ${pendingDeletePublication.count} publicação(ões) selecionada(s)?`
      : `Deseja excluir a publicação do processo ${pendingDeletePublication.numero_processo || 'sem número'}?`)
    : 'Deseja excluir esta publicação?';

  const confirmText = pendingDeletePublication?.count
    ? '🗑️ Excluir publicação(ões)'
    : singleConfirmText;

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirm}
        type="warning"
        title="⚠️ Confirmar exclusão"
        message={confirmMessage}
        confirmText={confirmText}
        cancelText="Cancelar"
        onConfirm={onConfirm}
        onCancel={onCancelConfirm}
      />

      <ConfirmDialog
        isOpen={showBlocked}
        type="danger"
        title="🚫 Exclusão não permitida"
        message={blockedMessage || 'Esta publicação não pode ser excluída porque está vinculada a um processo no sistema.'}
        warningMessage="Para preservar a rastreabilidade jurídica, publicações vinculadas permanecem protegidas."
        confirmText="Entendi"
        onConfirm={onCloseBlocked}
        onCancel={onCloseBlocked}
        showCancel={false}
        closeOnEnter={true}
      />
    </>
  );
}

PublicationDeleteDialogs.propTypes = {
  showConfirm: PropTypes.bool.isRequired,
  pendingDeletePublication: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancelConfirm: PropTypes.func.isRequired,
  showBlocked: PropTypes.bool.isRequired,
  blockedMessage: PropTypes.string,
  onCloseBlocked: PropTypes.func.isRequired,
  singleConfirmText: PropTypes.string,
};
