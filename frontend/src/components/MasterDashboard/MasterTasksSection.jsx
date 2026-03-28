import DeadlinesContent from '../DeadlinesContent';

export default function MasterTasksSection({ selectedLawyer, selectedLawyerLabel }) {
  return (
    <section className="master-admin-tasks-section" aria-label="Tarefas">
      <div className="master-admin-cases-header">
        <div>
          <h2 className="master-admin-cases-title">Tarefas</h2>
          <div>
            <span className="master-admin-contacts-view-link">👤 Tarefas de Pessoas</span>
          </div>
        </div>
      </div>

      {!selectedLawyer ? (
        <div className="master-admin-contacts-feedback">Selecione um Advogado para visualizar as tarefas.</div>
      ) : (
        <div className="master-admin-contacts-readonly">
          <DeadlinesContent
            tasksQueryParams={{ team_member_id: selectedLawyer }}
            displayLabel={selectedLawyerLabel}
            readOnly={true}
          />
        </div>
      )}
    </section>
  );
}
