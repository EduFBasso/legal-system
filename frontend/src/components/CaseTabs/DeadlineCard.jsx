import { formatDate } from '../../utils/formatters';
import PrazoRow from './PrazoRow';
import TasksSection from './TasksSection';
import './DeadlineCard.css';

/**
 * DeadlineCard - Display a single movement with its deadlines and tasks
 * Shows movement header (date + órgão) followed by multiple prazos and their tasks
 */
function DeadlineCard({ 
  movimentacao,
  tasks = [],
  onTogglePrazoCompleted = () => {},
  onAddTask = () => {},
  onDeleteTask = () => {},
  onToggleTaskCompleted = () => {},
}) {
  // Sort prazos by data_limite
  const prazos = (movimentacao.prazos || []).sort(
    (a, b) => new Date(a.data_limite) - new Date(b.data_limite)
  );

  if (prazos.length === 0) return null; // Don't render if no prazos

  return (
    <div className="deadline-card">
      {/* Movement Header */}
      <div className="movement-header">
        <div className="movement-date">
          📅 {formatDate(movimentacao.data)}
        </div>
        <div className="movement-orgao">
          🏛️ {movimentacao.orgao || 'Órgão não informado'}
        </div>
      </div>

      <div className="prazos-separator" />

      {/* Prazos List */}
      <div className="prazos-list">
        {prazos.map(prazo => (
          <div key={prazo.id} className="prazo-group">
            <PrazoRow
              prazo={prazo}
              onToggleCompleted={onTogglePrazoCompleted}
              movimentacaoData={movimentacao.data}
            />
            
            <TasksSection
              tasks={tasks}
              prazo={prazo}
              movimentacao={movimentacao}
              onAddTask={onAddTask}
              onDeleteTask={onDeleteTask}
              onToggleTaskCompleted={onToggleTaskCompleted}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeadlineCard;
