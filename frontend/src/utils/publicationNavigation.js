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

export function openCaseDetailWindow(
  caseId,
  {
    tab = null,
    focusMovement = null,
    focusTask = null,
    action = null,
    contactId = null,
    teamMemberId = null,
    readOnly = false,
    openVinculo = false,
  } = {}
) {
  if (!caseId) return;

  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (focusMovement) params.set('focusMovement', String(focusMovement));
  if (focusTask) params.set('focusTask', String(focusTask));
  if (action) params.set('action', action);
  if (contactId) params.set('contactId', String(contactId));
  if (teamMemberId) params.set('team_member_id', String(teamMemberId));
  if (readOnly) params.set('readonly', '1');
  if (openVinculo) params.set('openVinculo', '1');

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

export function openCreateDerivedCaseWindow(principalCaseId, vinculoTipo = '') {
  const parsed = Number(principalCaseId) || 0;
  if (!parsed) return;
  const params = new URLSearchParams();
  params.set('case_principal', String(parsed));
  if (String(vinculoTipo || '').trim()) {
    params.set('vinculo_tipo', String(vinculoTipo).trim());
  }
  window.open(`/cases/new?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

