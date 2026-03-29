export function getPublicationDeleteSuccessMessage({
  deleted = 1,
  notificationsDeleted = 0,
  historyDeleted = 0,
  single = false,
}) {
  const base = single
    ? '✅ Publicação removida da listagem'
    : `✅ ${deleted} publicação(ões) removida(s)`;

  const notifications = notificationsDeleted > 0
    ? ` (${notificationsDeleted} notificação(ões) removida(s))`
    : '';

  const history = historyDeleted > 0
    ? `, ${historyDeleted} histórico(s) removido(s)`
    : '';

  return `${base}${notifications}${history}.`;
}

export function getPublicationDeleteBlockedMessage(errorOrPayload, fallback) {
  const payload = typeof errorOrPayload === 'object' && errorOrPayload !== null
    ? errorOrPayload
    : null;

  const errorMessage =
    typeof errorOrPayload === 'string'
      ? errorOrPayload
      : (payload?.error || payload?.detail || '');

  const reasonCode = payload?.reason_code;

  if (reasonCode === 'PUBLICATION_HAS_MOVEMENTS') {
    return 'Esta publicação não pode ser excluída porque já foi integrada em uma movimentação. Para remover, delete o processo vinculado.';
  }

  const message = (errorMessage || '').toLowerCase();
  if (reasonCode === 'PUBLICATION_HAS_LINKED_CASE' || message.includes('processo vinculado')) {
    return 'Esta publicação não pode ser excluída porque está vinculada a um processo no sistema.';
  }

  return errorMessage || fallback;
}
