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

export function getPublicationDeleteBlockedMessage(errorMessage, fallback) {
  const message = (errorMessage || '').toLowerCase();
  if (message.includes('não é possível apagar publicação com processo vinculado')) {
    return 'Esta publicação não pode ser excluída porque está vinculada a um processo no sistema.';
  }

  return errorMessage || fallback;
}
