import { truncateAtSentence } from '../../utils/movementUtils';
import { generateAllConsultaLinks, openConsultaWithCopy } from '../../utils/consultaLinksHelper';
import { extractCnjs, stripHtmlToText, tokenizeTextWithCnjs } from '../../utils/cnj';
import {
  movementDisplayStyles,
  getOriginBadgeStyle,
  movementDeadlineBadgeStyle,
} from './movementCardStyles';
import { caseTheme, getButtonHoverHandlers } from './caseTheme';
import { useMemo } from 'react';

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
  onMentionProcess,
  excludeCnj,
  readOnly = false,
}) {
  const isManual = mov?.origem === 'MANUAL';
  const hasPrazo = Number.isFinite(mov?.prazo) && mov.prazo > 0;
  const publicationData = mov?.publication_data || null;
  const hasOrgao = Boolean(mov?.orgao);
  const shouldShowPublicationHeader = !isManual && publicationData?.exists;
  const shouldShowOrgao = !shouldShowPublicationHeader && (!isManual || hasOrgao);
  const automaticDescription = publicationData?.texto_completo || mov?.descricao || '';
  const automaticDescriptionIsHTML = isHTML(automaticDescription);
  const sanitizedAutomaticHtml = useMemo(() => {
    if (!automaticDescriptionIsHTML) return '';
    return sanitizeHTML(automaticDescription);
  }, [automaticDescriptionIsHTML, automaticDescription]);

  const mentionedCnjs = useMemo(() => {
    if (!automaticDescription) return [];
    if (automaticDescriptionIsHTML) {
      return extractCnjs(stripHtmlToText(sanitizedAutomaticHtml));
    }
    return extractCnjs(automaticDescription);
  }, [automaticDescription, automaticDescriptionIsHTML, sanitizedAutomaticHtml]);

  const filteredMentionedCnjs = useMemo(() => {
    if (!excludeCnj) return mentionedCnjs;
    return mentionedCnjs.filter((cnj) => cnj !== excludeCnj);
  }, [mentionedCnjs, excludeCnj]);

  const automaticDescriptionTokens = useMemo(() => {
    if (automaticDescriptionIsHTML) return [];
    return tokenizeTextWithCnjs(automaticDescription);
  }, [automaticDescription, automaticDescriptionIsHTML]);
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

  const handleMentionCnj = (e, cnj) => {
    e?.stopPropagation?.();
    if (!cnj) return;
    if (excludeCnj && cnj === excludeCnj) return;
    onMentionProcess?.({
      cnj,
      sourceMovimentacaoId: mov?.id,
    });
  };

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
        <>
          <div
            style={movementDisplayStyles.descriptionAuto}
            dangerouslySetInnerHTML={{ __html: sanitizedAutomaticHtml }}
          />

          {filteredMentionedCnjs.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: caseTheme.darkTextSecondary }}>
                Processos mencionados
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {filteredMentionedCnjs.map((cnj) => (
                  <button
                    key={cnj}
                    type="button"
                    onClick={(e) => handleMentionCnj(e, cnj)}
                    title="Adicionar em Vínculos por processo"
                    style={{
                      background: caseTheme.button.secondary,
                      border: `1px solid ${caseTheme.darkBorder}`,
                      color: caseTheme.darkText,
                      padding: '0.3rem 0.55rem',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                    }}
                  >
                    {cnj}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p style={movementDisplayStyles.descriptionAuto}>
          {automaticDescriptionTokens.length > 0
            ? automaticDescriptionTokens.map((token, index) => {
                if (token.type !== 'cnj') {
                  return <span key={`t-${index}`}>{token.value}</span>;
                }

                if (excludeCnj && token.value === excludeCnj) {
                  return <span key={`cnj-self-${index}`}>{token.raw || token.value}</span>;
                }

                return (
                  <span
                    key={`cnj-${token.value}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleMentionCnj(e, token.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleMentionCnj(e, token.value);
                      }
                    }}
                    title="Adicionar em Vínculos por processo"
                    style={{
                      fontWeight: 800,
                      color: caseTheme.accentGreenDark,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {token.value}
                  </span>
                );
              })
            : (automaticDescription || 'Movimentação automática sem descrição detalhada.')}
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
            style={{
              ...movementDisplayStyles.consultaButton,
              ...(readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (readOnly) return;
              openConsultaWithCopy(consultaUrl, publicationData.numero_processo, e.currentTarget);
            }}
            disabled={readOnly}
            aria-disabled={readOnly ? 'true' : undefined}
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
              if (readOnly) return;
              onEditClick();
            }}
            style={{
              ...movementDisplayStyles.actionButtonEdit,
              ...(readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
            disabled={readOnly}
            aria-disabled={readOnly ? 'true' : undefined}
            {...(readOnly ? {} : editButtonInteractions)}
          >
            Editar
          </button>
        </div>
      )}
    </>
  );
}
