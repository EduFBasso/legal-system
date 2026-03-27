import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import ContactTaskModal from '@/components/ContactTaskModal';
import DeadlinesContent from '@/components/DeadlinesContent';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/contexts/AuthContext';
import contactTasksService from '@/services/contactTasksService';

export default function ContactTasksPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const readOnly = searchParams.get('readonly') === '1';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const contactIdParam = searchParams.get('contact_id');
  const [createInitialData, setCreateInitialData] = useState(null);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

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

  useEffect(() => {
    if (!contactIdParam || readOnly) return;
    const contactId = Number(contactIdParam);
    if (!Number.isFinite(contactId)) return;

    // Prefill contact id; name will be resolved when user opens selector if needed
    setCreateInitialData({ contact: contactId, contact_name: '' });
    setIsCreateOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactIdParam, readOnly]);

  return (
    <>
      <DeadlinesContent
        key={refreshKey}
        title="👤 Tarefas de Pessoas"
        service={contactTasksService}
        tasksQueryParams={tasksQueryParams}
        displayLabel={displayLabel}
        readOnly={readOnly}
        kind="contact"
        headerActions={
          !readOnly ? (
            <Button variant="success" size="md" type="button" onClick={() => setIsCreateOpen(true)}>
              + Nova tarefa
            </Button>
          ) : null
        }
        onEditTask={
          !readOnly
            ? (task) => {
                setEditingTask(task);
                setIsEditOpen(true);
              }
            : null
        }
        onDeleteTask={
          !readOnly
            ? async (task) => {
                // eslint-disable-next-line no-alert
                const ok = window.confirm(`Excluir a tarefa "${task.titulo}"?`);
                if (!ok) return;
                await contactTasksService.deleteTask(task.id);
                handleRefresh();
              }
            : null
        }
      />

      <ContactTaskModal
        isOpen={isCreateOpen}
        mode="create"
        initialData={createInitialData}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (payload) => {
          await contactTasksService.createTask(payload);
          setIsCreateOpen(false);
          setCreateInitialData(null);
          handleRefresh();
        }}
      />

      <ContactTaskModal
        isOpen={isEditOpen}
        mode="edit"
        initialData={editingTask}
        onClose={() => {
          setIsEditOpen(false);
          setEditingTask(null);
        }}
        onSubmit={async (payload) => {
          if (!editingTask?.id) return;
          await contactTasksService.patchTask(editingTask.id, payload);
          setIsEditOpen(false);
          setEditingTask(null);
          handleRefresh();
        }}
      />
    </>
  );
}
