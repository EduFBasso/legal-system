import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DeadlinesContent from '../components/DeadlinesContent';
import contactTasksService from '../services/contactTasksService';

/**
 * Tarefas de Pessoas (Contato)
 *
 * Lista tarefas administrativas vinculadas a contatos, independente de processo.
 * Reusa o mesmo layout de prazos/urgência do DeadlinesContent, trocando apenas o service.
 */
export default function ContactTasksPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const readOnly = searchParams.get('readonly') === '1';

  const tasksQueryParams = useMemo(() => {
    const params = {};
    const teamMemberId = searchParams.get('team_member_id');
    const teamScope = searchParams.get('team_scope');
    const excludeOwnerSelf = searchParams.get('exclude_owner_self');
    const excludeOwnerless = searchParams.get('exclude_ownerless');

    if (teamMemberId) params.team_member_id = teamMemberId;
    if (teamScope) params.team_scope = teamScope;
    if (excludeOwnerSelf) params.exclude_owner_self = excludeOwnerSelf;
    if (excludeOwnerless) params.exclude_ownerless = excludeOwnerless;

    return params;
  }, [searchParams]);

  const scopeLabel = searchParams.get('scope_label') || '';

  const displayLabel = useMemo(() => {
    if (scopeLabel) return scopeLabel;
    if (!user) return '';
    const name = user.full_name_oab || user.first_name || user.username || '';
    const oab = user.oab_number || '';
    return oab ? `${name} ${oab}` : name;
  }, [scopeLabel, user]);

  return (
    <DeadlinesContent
      title="👤 Tarefas de Pessoas"
      service={contactTasksService}
      tasksQueryParams={tasksQueryParams}
      displayLabel={displayLabel}
      readOnly={readOnly}
      kind="contact"
    />
  );
}
