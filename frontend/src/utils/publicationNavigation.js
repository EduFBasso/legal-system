export function openPublicationDetailsWindow(idApi) {
  if (!idApi) return;
  window.open(
    `/publications/${idApi}/details`,
    '_blank',
    'width=1200,height=800,resizable=yes,scrollbars=yes'
  );
}

export function openCreateCaseFromPublicationWindow(idApi) {
  if (!idApi) return;
  window.open(`/cases/new?pub_id=${idApi}`, '_blank', 'noopener,noreferrer');
}

export function openCaseDetailWindow(caseId, { tab = null, focusMovement = null, focusTask = null, action = null, contactId = null } = {}) {
  if (!caseId) return;

  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (focusMovement) params.set('focusMovement', String(focusMovement));
  if (focusTask) params.set('focusTask', String(focusTask));
  if (action) params.set('action', action);
  if (contactId) params.set('contactId', String(contactId));

  const query = params.toString();
  const url = query ? `/cases/${caseId}?${query}` : `/cases/${caseId}`;
  window.open(url, '_blank');
}

export function openCaseMovementsWindow(caseId, focusMovement = null) {
  openCaseDetailWindow(caseId, { tab: 'movements', focusMovement });
}

export function openCreateCaseWindow() {
  window.open('/cases/new', '_blank');
}
