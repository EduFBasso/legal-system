import { truncateAtSentence } from '../../utils/movementUtils';
import { generateAllConsultaLinks, openConsultaWithCopy } from '../../utils/consultaLinksHelper';
import {
  movementDisplayStyles,
  getOriginBadgeStyle,
  movementDeadlineBadgeStyle,
} from './movementCardStyles';
import { caseTheme, getButtonHoverHandlers } from './caseTheme';

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR');
};

const formatLongDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const isHTML = (text) => {
  if (!text) return false;
  return /<[^>]+>/.test(text);
};

const sanitizeHTML = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/<\/br\s*>/gi, '<br/>');
};

export default function MovimentacaoDisplay({
  mov,
  tipoDisplay,
  manualDescricao,
  onEditClick,
}) {
  const isManual = mov?.origem === 'MANUAL';
  const hasPrazo = Number.isFinite(mov?.prazo) && mov.prazo > 0;
  const publicationData = mov?.publication_data || null;
  const hasOrgao = Boolean(mov?.orgao);
  const shouldShowPublicationHeader = !isManual && publicationData?.exists;
  const shouldShowOrgao = !shouldShowPublicationHeader && (!isManual || hasOrgao);
  const automaticDescription = publicationData?.texto_completo || mov?.descricao || '';
  const automaticDescriptionIsHTML = isHTML(automaticDescription);
  const consultaLinks = publicationData?.exists
    ? generateAllConsultaLinks({
        tribunal: publicationData?.tribunal,
        numero_processo: publicationData?.numero_processo,
        link_oficial: publicationData?.link_oficial,
      })
    : { linkOficial: null, linksAlternativos: [] };
  const consultaUrl = consultaLinks.linkOficial || consultaLinks.linksAlternativos?.[0]?.url || null;
  const canConsultar = !isManual && publicationData?.numero_processo && consultaUrl;
  const editButtonInteractions = getButtonHoverHandlers({
    base: caseTheme.button.primary,
    hover: caseTheme.button.primaryDark,
    shadow: '0 2px 8px rgba(22, 101, 52, 0.3)',
  });

  return (
    <>
      {isManual && (
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
            <span style={getOriginBadgeStyle(true)}>
              {mov?.origem_display || 'MANUAL'}
            </span>

            {hasPrazo && (
              <span style={movementDeadlineBadgeStyle}>
                Prazo: {mov.prazo}d
              </span>
            )}
          </div>
        </div>
      )}

      <div style={movementDisplayStyles.infoLine}>
        <strong style={movementDisplayStyles.infoLabel}>Tipo:</strong> {tipoDisplay || mov?.tipo || '-'}
      </div>

      {shouldShowPublicationHeader && (
        <div style={movementDisplayStyles.publicationHeader}>
          <div style={movementDisplayStyles.publicationHeaderItem}>
            <span style={movementDisplayStyles.publicationHeaderLabel}>Processo</span>
            {publicationData?.numero_processo || '-'}
          </div>
          <div style={movementDisplayStyles.publicationHeaderItem}>
            <span style={movementDisplayStyles.publicationHeaderLabel}>Data de Disponibilização</span>
            {formatLongDate(publicationData?.data_disponibilizacao)}
          </div>
          <div style={movementDisplayStyles.publicationHeaderItem}>
            <span style={movementDisplayStyles.publicationHeaderLabel}>Órgão</span>
            {publicationData?.orgao || mov?.orgao || '-'}
          </div>
          <div style={movementDisplayStyles.publicationHeaderItem}>
            <span style={movementDisplayStyles.publicationHeaderLabel}>Meio</span>
            {publicationData?.meio_display || '-'}
          </div>
        </div>
      )}

      {shouldShowOrgao && (
        <div style={{ ...movementDisplayStyles.infoLine, marginTop: '0.25rem' }}>
          <strong style={movementDisplayStyles.infoLabel}>Órgão:</strong> {mov.orgao || '-'}
        </div>
      )}

      {isManual ? (
        <p style={movementDisplayStyles.descriptionManual}>
          {truncateAtSentence(manualDescricao || mov?.descricao || '', 180, 260) || 'Sem descrição.'}
        </p>
      ) : automaticDescriptionIsHTML ? (
        <div
          style={movementDisplayStyles.descriptionAuto}
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(automaticDescription) }}
        />
      ) : (
        <p style={movementDisplayStyles.descriptionAuto}>
          {automaticDescription || 'Movimentação automática sem descrição detalhada.'}
        </p>
      )}

      {!isManual && (
        <div style={{ ...movementDisplayStyles.badgeRow, marginTop: '0.6rem' }}>
          <span style={getOriginBadgeStyle(false)}>
            {mov?.origem_display || 'AUTOMATICA'}
          </span>

          {hasPrazo && (
            <span style={movementDeadlineBadgeStyle}>
              Prazo: {mov.prazo}d
            </span>
          )}
        </div>
      )}

      {canConsultar && (
        <div style={movementDisplayStyles.publicationActionsRow}>
          <button
            type="button"
            style={movementDisplayStyles.consultaButton}
            onClick={(e) => {
              e.stopPropagation();
              openConsultaWithCopy(consultaUrl, publicationData.numero_processo, e.currentTarget);
            }}
            title="Copia o número do processo e abre o site oficial"
          >
            🔍 Consultar processo
          </button>
        </div>
      )}

      {isManual && (
        <div style={movementDisplayStyles.actionsRow}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            style={movementDisplayStyles.actionButtonEdit}
            {...editButtonInteractions}
          >
            Editar
          </button>
        </div>
      )}
    </>
  );
}
