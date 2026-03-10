import { truncateAtSentence } from '../../utils/movementUtils';

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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {formatDate(mov?.data)}
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>
            {mov?.titulo || tipoDisplay || 'Movimentação'}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '999px',
              padding: '0.2rem 0.55rem',
              background: isManual ? '#fef3c7' : '#dbeafe',
              color: isManual ? '#92400e' : '#1e40af',
            }}
          >
            {mov?.origem_display || (isManual ? 'MANUAL' : 'AUTOMATICA')}
          </span>

          {hasPrazo && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '999px',
                padding: '0.2rem 0.55rem',
                background: '#fee2e2',
                color: '#991b1b',
              }}
            >
              Prazo: {mov.prazo}d
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
        <strong style={{ color: '#111827' }}>Tipo:</strong> {tipoDisplay || mov?.tipo || '-'}
      </div>

      <div style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#374151' }}>
        <strong style={{ color: '#111827' }}>Orgão:</strong> {mov?.orgao_julgador || '-'}
      </div>

      {isManual ? (
        <p style={{ margin: '0.6rem 0 0', fontSize: '0.9rem', color: '#1f2937', lineHeight: 1.5 }}>
          {truncateAtSentence(manualDescricao || mov?.descricao || '', 180, 260) || 'Sem descrição.'}
        </p>
      ) : (
        <p style={{ margin: '0.6rem 0 0', fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>
          {truncateAtSentence(mov?.descricao || '', 180, 260) || 'Movimentação automática sem descrição detalhada.'}
        </p>
      )}

      {isManual && (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            style={{
              border: '1px solid #6b21a8',
              background: '#fff',
              color: '#6b21a8',
              borderRadius: '6px',
              padding: '0.3rem 0.7rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            style={{
              border: '1px solid #dc2626',
              background: '#fff',
              color: '#dc2626',
              borderRadius: '6px',
              padding: '0.3rem 0.7rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Excluir
          </button>
        </div>
      )}
    </>
  );
}
