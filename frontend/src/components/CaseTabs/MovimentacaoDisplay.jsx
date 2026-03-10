import { truncateAtSentence } from '../../utils/movementUtils';
import {
  movementDisplayStyles,
  getOriginBadgeStyle,
  movementDeadlineBadgeStyle,
} from './movementCardStyles';

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

export default function MovimentacaoDisplay({
  mov,
  tipoDisplay,
  manualDescricao,
  onEditClick,
  onDeleteClick,
}) {
  const isManual = mov?.origem === 'MANUAL';
  const hasPrazo = Number.isFinite(mov?.prazo) && mov.prazo > 0;

  return (
    <>
      <div style={movementDisplayStyles.headerRow}>
        <div>
          <div style={movementDisplayStyles.date}>
            {formatDate(mov?.data)}
          </div>
          <h4 style={movementDisplayStyles.title}>
            {mov?.titulo || tipoDisplay || 'Movimentação'}
          </h4>
        </div>

        <div style={movementDisplayStyles.badgeRow}>
          <span style={getOriginBadgeStyle(isManual)}>
            {mov?.origem_display || (isManual ? 'MANUAL' : 'AUTOMATICA')}
          </span>

          {hasPrazo && (
            <span style={movementDeadlineBadgeStyle}>
              Prazo: {mov.prazo}d
            </span>
          )}
        </div>
      </div>

      <div style={movementDisplayStyles.infoLine}>
        <strong style={movementDisplayStyles.infoLabel}>Tipo:</strong> {tipoDisplay || mov?.tipo || '-'}
      </div>

      <div style={{ ...movementDisplayStyles.infoLine, marginTop: '0.25rem' }}>
        <strong style={movementDisplayStyles.infoLabel}>Orgão:</strong> {mov?.orgao_julgador || '-'}
      </div>

      {isManual ? (
        <p style={movementDisplayStyles.descriptionManual}>
          {truncateAtSentence(manualDescricao || mov?.descricao || '', 180, 260) || 'Sem descrição.'}
        </p>
      ) : (
        <p style={movementDisplayStyles.descriptionAuto}>
          {truncateAtSentence(mov?.descricao || '', 180, 260) || 'Movimentação automática sem descrição detalhada.'}
        </p>
      )}

      {isManual && (
        <div style={movementDisplayStyles.actionsRow}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            style={movementDisplayStyles.actionButtonEdit}
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            style={movementDisplayStyles.actionButtonDelete}
          >
            Excluir
          </button>
        </div>
      )}
    </>
  );
}
