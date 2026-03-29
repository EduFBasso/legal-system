import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, UserPlus } from 'lucide-react';
import './InformacaoTab.css';
import { formatDate, maskNumeroProcesso } from '../../utils/formatters';
import { generateAllConsultaLinks } from '../../utils/consultaLinksHelper';
import SearchableCreatableSelectField from '../FormFields/SearchableCreatableSelectField';
import EditableDetailField from '../EditableDetailField';
import { Button, SaveButton, CancelButton, DeleteButton, EditButton } from '../common/Button';
import PartyRoleBadge from '../common/PartyRoleBadge';
import { openCaseDetailWindow, openCreateDerivedCaseWindow } from '../../utils/publicationNavigation';

/**
 * InformacaoTab - Aba de Informações do Processo
 * Exibe e permite edição de dados do case: número, tribunal, partes, datas, etc.
 */
function InformacaoTab({
  id,
  formData: rawFormData = {},
  setFormData = () => {},
  isEditing = false,
  setIsEditing = () => {},
  readOnly = false,
  saving = false,
  onSave = () => {},
  onCancel = () => {},
  onDelete = () => {},
  setActiveSection = () => {},
  onOpenLatestMovimentacao = () => {},
  onOpenOrigemMovimentacao = null,
  onOpenOrigemPublicacao = null,
  onAddPartyClick,
  onOpenContactModal = null,
  parties = [],
  caseData = null,
  linkedCases = [],
  loadingLinkedCases = false,
  onPatchCase = null,
  formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },
  tribunalOptions = [],
  statusOptions = [],
  tipoAcaoOptions = [],
  onCreateTipoAcaoOption = null,
  onEditTipoAcaoOption = null,
  tituloOptions = [],
  onCreateTituloOption = null,
  onEditTituloOption = null,
  onSearchTituloOptions = null,
  vinculoTipoOptions = [],
  onCreateVinculoTipoOption = null,
  onEditVinculoTipoOption = null,
  onInputChange = () => {},
  validationErrors = {},
}) {
  const navigate = useNavigate();
    const openContact = (e, contactId) => {
      if (!onOpenContactModal) return;
      const parsed = Number(contactId);
      if (!parsed) return;
      e?.preventDefault?.();
      e?.stopPropagation?.();
      onOpenContactModal(parsed);
    };
  const formData = rawFormData || {};

  const vinculoInfo = (() => {
    const isDerived = Boolean(formData?.case_principal);
    const classificacao = String(formData?.classificacao || '').trim().toUpperCase();
    const isPrincipal = !isDerived && classificacao === 'PRINCIPAL';
    const label = isDerived ? 'DERIVADO' : (isPrincipal ? 'PRINCIPAL' : 'NEUTRO');
    const variant = isDerived ? 'derivado' : (isPrincipal ? 'principal' : 'neutro');
    return { isDerived, isPrincipal, label, variant };
  })();

  const vinculosListModel = (() => {
    const currentCaseId = Number(id) || null;
    const currentCasePartiesFallback = Array.isArray(parties)
      ? parties.map((p) => ({
          contact_id: p?.contact || null,
          name: p?.contact_name || '',
          role: p?.role || p?.role_display || '',
          role_display: p?.role_display || p?.role || '',
          is_client: Boolean(p?.is_client),
        }))
      : [];
    const currentCase = {
      id: currentCaseId,
      numero_processo: formData?.numero_processo || '',
      numero_processo_formatted: formData?.numero_processo_formatted || formData?.numero_processo || '',
      titulo: formData?.titulo || '',
      parties_summary: Array.isArray(formData?.parties_summary)
        ? formData.parties_summary
        : Array.isArray(caseData?.parties_summary)
          ? caseData.parties_summary
          : currentCasePartiesFallback,
      classificacao: formData?.classificacao,
      case_principal: formData?.case_principal || null,
      vinculo_tipo: formData?.vinculo_tipo || null,
      vinculo_tipo_display: formData?.vinculo_tipo_display || null,
      parties: Array.isArray(caseData?.parties) ? caseData.parties : [],
      representations: Array.isArray(caseData?.representations) ? caseData.representations : [],
      created_at: formData?.created_at || null,
    };

    const otherCases = Array.isArray(linkedCases) ? linkedCases : [];

    const getCreatedAt = (c) => {
      const raw = c?.created_at;
      const parsed = raw ? new Date(raw).getTime() : NaN;
      return Number.isFinite(parsed) ? parsed : null;
    };

    const principalId = vinculoInfo.isDerived
      ? Number(formData?.case_principal) || null
      : currentCaseId;

    const principalCase = principalId && Number(principalId) === Number(currentCaseId)
      ? currentCase
      : principalId
        ? otherCases.find((c) => Number(c?.id) === Number(principalId)) || null
        : null;

    const derivedFromPrincipal = principalId
      ? otherCases.filter((c) => Number(c?.case_principal) === Number(principalId))
      : [];

    const allDerived = vinculoInfo.isDerived
      ? [currentCase, ...derivedFromPrincipal]
      : derivedFromPrincipal;

    const uniqueDerived = allDerived.reduce((acc, item) => {
      const itemId = Number(item?.id) || null;
      if (!itemId) return acc;
      if (acc.some((x) => Number(x?.id) === itemId)) return acc;
      return [...acc, item];
    }, []);

    const sortedDerived = uniqueDerived.slice().sort((a, b) => {
      const ta = getCreatedAt(a);
      const tb = getCreatedAt(b);
      if (ta === null && tb === null) return 0;
      if (ta === null) return 1;
      if (tb === null) return -1;
      return ta - tb;
    });

    const showList = vinculoInfo.label !== 'NEUTRO' && !isEditing;
    const rows = [];

    if (!showList) {
      return { showList: false, rows: [] };
    }

    if (principalCase) {
      rows.push({
        ...principalCase,
        _rowKind: 'principal',
        _isCurrent: Number(principalCase?.id) === Number(currentCaseId),
      });
    } else if (vinculoInfo.isPrincipal) {
      rows.push({
        ...currentCase,
        _rowKind: 'principal',
        _isCurrent: true,
      });
    }

    sortedDerived.forEach((c) => {
      if (!c?.id) return;
      if (principalCase && Number(c.id) === Number(principalCase.id)) return;
      rows.push({
        ...c,
        _rowKind: 'derived',
        _isCurrent: Number(c?.id) === Number(currentCaseId),
      });
    });

    // Principal “órfão”: exibe só a linha principal quando != NEUTRO.
    if (rows.length === 0 && vinculoInfo.label !== 'NEUTRO') {
      rows.push({
        ...currentCase,
        _rowKind: 'principal',
        _isCurrent: true,
      });
    }

    return { showList: true, rows };
  })();

  const showVinculoActions = !readOnly && !isEditing && !!id;
  const showNeutralActionBar = showVinculoActions && vinculoInfo.label === 'NEUTRO';
  const showPrincipalInlineNeutralize = showVinculoActions && vinculoInfo.isPrincipal;
  const showNeutralInlineMarkPrincipal = showVinculoActions && vinculoInfo.label === 'NEUTRO';
  const linkedDerivedCount = vinculosListModel.rows.filter((row) => row?._rowKind === 'derived').length;
  const canMarkAsNeutral =
    showPrincipalInlineNeutralize &&
    typeof onPatchCase === 'function' &&
    linkedDerivedCount === 0;

  const canMarkAsPrincipal = showNeutralActionBar && typeof onPatchCase === 'function';
  const canLinkAsDerived = showNeutralActionBar && typeof onPatchCase === 'function';

  const handleCreateDerivedFromNeutral = async () => {
    if (typeof onPatchCase !== 'function') return;

    const vinculoTipo = String(
      window.prompt('Tipo de vínculo (ex: Apenso, Incidente, Recurso…)', '') || ''
    ).trim();

    if (!vinculoTipo) return;

    await onPatchCase({
      classificacao: 'PRINCIPAL',
      case_principal: null,
      vinculo_tipo: '',
    });

    openCreateDerivedCaseWindow(id, vinculoTipo);
  };

  const handleMarkAsPrincipal = async () => {
    if (typeof onPatchCase !== 'function') return;
    await onPatchCase({
      classificacao: 'PRINCIPAL',
      case_principal: null,
      vinculo_tipo: '',
    });
  };

  const handleMarkAsNeutral = async () => {
    if (!canMarkAsNeutral || typeof onPatchCase !== 'function') return;

    const confirmed = window.confirm(
      'Tornar este processo NEUTRO? Esta ação só é permitida quando não há processos derivados vinculados.'
    );
    if (!confirmed) return;

    await onPatchCase({
      classificacao: 'NEUTRO',
      case_principal: null,
      vinculo_tipo: '',
    });
  };

  const handleAddDerivedCase = () => {
    const parsedId = Number(id) || 0;
    if (!parsedId) return;
    const params = new URLSearchParams();
    params.set('action', 'select-derived');
    params.set('principalCaseId', String(parsedId));
    params.set('autoclose', '1');
    window.open(`/cases?${params.toString()}`, '_blank');
  };

  const handleLinkAsDerived = () => {
    if (vinculoInfo.isPrincipal) {
      handleAddDerivedCase();
      return;
    }
    handleCreateDerivedFromNeutral();
  };

  const canManageLinkedRows = !readOnly && typeof onPatchCase === 'function';

  const handleEditLinkedCaseVinculoTipo = (row) => {
    if (!canManageLinkedRows || !row?.id || row?._rowKind !== 'derived') return;

    const principalId = vinculoInfo.isPrincipal
      ? Number(id)
      : (Number(formData.case_principal) || null);
    if (!principalId) return;

    const rawVinculoTipo = String(row?.vinculo_tipo || row?.vinculo_tipo_display || '').trim();

    const params = new URLSearchParams();
    params.set('action', 'select-derived');
    params.set('principalCaseId', String(principalId));
    params.set('editDerivedCaseId', String(Number(row.id)));
    if (rawVinculoTipo) params.set('vinculoTipo', rawVinculoTipo);
    navigate(`/cases?${params.toString()}`);
  };

  const handleUnlinkLinkedCase = async (row) => {
    if (!canManageLinkedRows || !row?.id || row?._rowKind !== 'derived') return;

    const numeroProcesso = row?.numero_processo_formatted || row?.numero_processo || `#${row.id}`;
    const confirmed = window.confirm(
      `Desvincular o processo ${numeroProcesso} deste principal?`
    );
    if (!confirmed) return;

    await onPatchCase({
      caseId: Number(row.id),
      patch: {
        case_principal: null,
        vinculo_tipo: '',
      },
    });
  };
  const representations = Array.isArray(formData.representations)
    ? formData.representations
    : Array.isArray(caseData?.representations)
      ? caseData.representations
      : [];

  const normalizeBadgeKey = (value) => {
    if (!value) return '';
    return String(value)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const getTipoAcaoBadgeVariant = (tipoAcaoValue) => {
    const normalized = normalizeBadgeKey(tipoAcaoValue);
    const variants = new Set([
      'consumidor',
      'civel',
      'criminal',
      'trabalhista',
      'tributaria',
      'familia',
      'outros',
    ]);
    return variants.has(normalized) ? normalized : 'custom';
  };

  const sanitizeHTML = (html) => {
    if (!html) return '';
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  const hasPublicationOrigin = Boolean(formData.publicacao_origem && (formData.publicacao_origem_tipo || formData.publicacao_origem_data));

  const handleOpenOrigemPublicationDetails = () => {
    if (typeof onOpenOrigemPublicacao === 'function') {
      onOpenOrigemPublicacao();
      return;
    }

    if (typeof onOpenOrigemMovimentacao === 'function') {
      onOpenOrigemMovimentacao();
      return;
    }

    const movementUrl = `${window.location.pathname}?tab=movements`;
    window.open(movementUrl, '_blank', 'noopener,noreferrer,width=1400,height=900,left=100,top=100');
  };

  const renderLinkedCasePartiesSummary = (c) => {
    const firstName = (value) => String(value || '').trim().split(/\s+/).filter(Boolean)[0] || '';

    const partiesFromSummary = Array.isArray(c?.parties_summary)
      ? c.parties_summary.map((p) => ({
          contact_id: p?.contact_id || null,
          name: p?.name || '',
          role: p?.role || p?.role_display || '',
          is_client: Boolean(p?.is_client),
        }))
      : [];

    const partiesFromDetail = Array.isArray(c?.parties)
      ? c.parties.map((p) => ({
          contact_id: p?.contact || p?.contact_id || null,
          name: p?.contact_name || p?.name || '',
          role: p?.role || p?.role_display || '',
          is_client: Boolean(p?.is_client),
        }))
      : [];

    const parties = partiesFromSummary.length > 0 ? partiesFromSummary : partiesFromDetail;
    if (parties.length === 0) return '—';

    const normalize = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const representativesByClient = new Map();
    const reps = Array.isArray(c?.representations) ? c.representations : [];
    reps.forEach((r) => {
      const representedId = Number(r?.represented_contact) || null;
      const representativeName = String(r?.representative_contact_name || '').trim();
      const representativeId = Number(r?.representative_contact) || null;
      if (!representedId || !representativeName) return;

      if (!representativesByClient.has(representedId)) {
        representativesByClient.set(representedId, []);
      }

      representativesByClient.get(representedId).push({
        id: representativeId,
        name: representativeName,
      });
    });

    const clientParties = parties.filter((p) => Boolean(p?.is_client));
    const primaryClient = clientParties[0] || null;

    const representativeRoleMatches = (role) => {
      const r = normalize(role);
      return (
        r.includes('advog') ||
        r.includes('procur') ||
        r.includes('represent') ||
        r.includes('patrono') ||
        r.includes('defensor')
      );
    };

    const clientName = firstName(primaryClient?.name || '');

    // 2) Representante do cliente (prioriza representações explícitas)
    let representativeName = '';
    const representedId = Number(primaryClient?.contact_id) || null;
    if (representedId) {
      const repsForClient = representativesByClient.get(representedId) || [];
      representativeName = firstName(repsForClient[0]?.name || '');
    }

    // Fallback: inferir por role de representante
    if (!representativeName) {
      const representativeParty = parties.find(
        (p) => !p?.is_client && representativeRoleMatches(p?.role)
      );
      representativeName = firstName(representativeParty?.name || '');
    }

    if (clientName && representativeName) {
      return `(Cliente: ${clientName}) (Repr.: ${representativeName})`;
    }

    if (clientName) return `(Cliente: ${clientName})`;
    if (representativeName) return `(Repr.: ${representativeName})`;
    return '—';
  };

  const getRowVinculoVariant = (row) => {
    if (row?._rowKind === 'principal') return 'principal';
    return 'derivado';
  };

  const renderVinculoTipo = (row) => {
    if (row?._rowKind !== 'derived') return '';
    const raw = String(row?.vinculo_tipo_display || row?.vinculo_tipo || '').trim();
    if (!raw) return '--';
    if (raw.toUpperCase() === 'DERIVADO') return '--';
    return raw;
  };

  // Handler para mudanças em inputs
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    if (onInputChange) {
      onInputChange(field, value);
    }
  };

  // Renderizar botões de consulta processual
  const renderProcessConsultaButtons = ({ wrap = true } = {}) => {
    if (readOnly) return null;
    if (!formData.publicacao_origem) return null;

    // Simular objeto publication a partir dos dados de case
    const simulatedPublication = {
      tribunal: formData.tribunal,
      numero_processo: formData.numero_processo,
      link_oficial: null, // Será construído dinamicamente
    };

    const consultaLinks = generateAllConsultaLinks(simulatedPublication);

    const handleConsultarProcesso = (url) => {
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      if (!formData.numero_processo || !navigator.clipboard?.writeText) return;

      navigator.clipboard.writeText(formData.numero_processo).catch(err => {
        console.error('Erro ao copiar:', err);
      });
    };

    return (
      <div className={`publication-buttons-group ${wrap ? 'is-wrap' : 'is-nowrap'}`}>
        {/* Link oficial (ESAJ ou principal) */}
        {consultaLinks.linkOficial && (
          <Button
            variant="primary-soft"
            size="sm"
            onClick={() => handleConsultarProcesso(consultaLinks.linkOficial)}
            title="Copia o número e abre o portal do tribunal"
          >
            {formData.tribunal || 'Consultar'}
          </Button>
        )}
        
        {/* Links alternativos (eProc, TRF3, TRT15, etc.) */}
        {consultaLinks.linksAlternativos.map((system, index) => (
          <Button
            key={index}
            variant={system.shortName === 'eProc' ? 'secondary-soft' : 'success'}
            size="sm"
            onClick={() => handleConsultarProcesso(system.url)}
            title={system.description}
          >
            {system.icon} {system.shortName}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="case-section">
      {/* Detalhes do Processo */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">
            {isEditing ? '✏️ Editando Informações' : '📋 Detalhes do Processo'}
          </h2>
          <div className="section-header-actions">
            {!isEditing && formData.owner_name && (
              <span className="section-owner-label">
                {formData.owner_name}{formData.owner_oab ? ` ${formData.owner_oab}` : ''}
              </span>
            )}
            {!isEditing && !readOnly && (
              <>
                <EditButton onClick={() => {
                  setActiveSection('info');
                  setIsEditing(true);
                }} />
                <DeleteButton onClick={() => {
                  setActiveSection('info');
                  onDelete();
                }} />
              </>
            )}
          </div>
        </div>
        
        {/* MODO MISTO - Visualização com Edição Inline no grupo Identificação */}
        <div className="details-readonly">
          {/* Identificação do Processo - EDIÇÃO INLINE */}
          <div className="details-group" data-inline-editing={isEditing}>
            <h3 className="details-group-title">
              🔖 Identificação
              {isEditing && <span className="editing-indicator"> EDITANDO</span>}
            </h3>
            <div className="details-content">
              {/* Número do Processo e Título - Row especial */}
              <div className="detail-item-row" data-editing={isEditing}>
                <div className="detail-item-col">
                  {!isEditing ? (
                    <>
                      <span className="detail-label">PROCESSO Nº</span>
                      <span className="detail-value-large">{formData.numero_processo_formatted || formData.numero_processo}</span>
                    </>
                  ) : (
                    <>
                      <span className="detail-label">
                        <span style={{ whiteSpace: 'nowrap' }}>
                          PROCESSO Nº <span style={{ color: '#ef4444' }}>*</span>
                        </span>
                      </span>
                      <input
                        type="text"
                        value={formData.numero_processo || ''}
                        onChange={(e) => handleInputChange('numero_processo', maskNumeroProcesso(e.target.value))}
                        placeholder="0000000-00.0000.0.00.0000"
                        className={`detail-input detail-input-large ${validationErrors?.numero_processo ? 'is-invalid' : ''}`}
                        maxLength={25}
                      />
                    </>
                  )}
                </div>
                <div className="detail-item-col right">
                  {!isEditing ? (
                    <>
                      <span className="detail-label">TÍTULO</span>
                      <span className="detail-value-medium">{formData.titulo || '—'}</span>
                    </>
                  ) : (
                    <>
                      <span className="detail-label">TÍTULO</span>
                      <div className="detail-select-wrapper">
                        <SearchableCreatableSelectField
                          value={formData.titulo || ''}
                          onChange={(v) => handleInputChange('titulo', v)}
                          options={tituloOptions}
                          placeholder="Pesquisar ou digitar..."
                          allowCreate={true}
                          allowCreateWhenExactMatchIsNotPersisted={true}
                          onSearchOptions={onSearchTituloOptions || null}
                          remoteSearchDebounceMs={400}
                          remoteSearchMinChars={2}
                          onCreateOption={onCreateTituloOption || null}
                          onEditOption={onEditTituloOption || null}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Tipo, Status, Tribunal - apenas no modo edição para evitar duplicidade */}
              {isEditing && (
                <div className="detail-grid-3">
                  <EditableDetailField
                    label="Tipo de Ação"
                    value={formData.tipo_acao}
                    isEditing={isEditing}
                    type="searchable-select"
                    options={tipoAcaoOptions}
                    onChange={(value) => handleInputChange('tipo_acao', value)}
                    formatDisplay={(v) => formData.tipo_acao_display || v}
                    placeholder="Selecione..."
                    selectProps={{
                      allowCreate: true,
                      onCreateOption: onCreateTipoAcaoOption || null,
                      onEditOption: onEditTipoAcaoOption || null,
                      placeholder: 'Pesquisar ou cadastrar...'
                    }}
                  />

                  <EditableDetailField
                    label="Status"
                    value={formData.status || 'ATIVO'}
                    isEditing={isEditing}
                    type="select"
                    options={statusOptions}
                    onChange={(value) => handleInputChange('status', value)}
                    formatDisplay={(v) => formData.status_display || v}
                  />

                  <EditableDetailField
                    label="Tribunal"
                    value={formData.tribunal}
                    isEditing={isEditing}
                    type="select"
                    className={validationErrors?.tribunal ? 'is-invalid' : ''}
                    options={tribunalOptions}
                    onChange={(value) => handleInputChange('tribunal', value)}
                    formatDisplay={(v) => formData.tribunal_display || v}
                    placeholder="Selecione..."
                    required={true}
                    selectProps={{ placeholder: 'Selecione...' }}
                  />

                  {Boolean(formData?.case_principal) && (
                    <EditableDetailField
                      label="Tipo de Vínculo"
                      value={formData.vinculo_tipo || ''}
                      isEditing={isEditing}
                      type="searchable-select"
                      className={validationErrors?.vinculo_tipo ? 'is-invalid' : ''}
                      options={vinculoTipoOptions}
                      onChange={(value) => handleInputChange('vinculo_tipo', value)}
                      formatDisplay={(v) => formData.vinculo_tipo_display || v}
                      placeholder="Selecione..."
                      required={true}
                      selectProps={{
                        allowCreate: true,
                        onCreateOption: onCreateVinculoTipoOption || null,
                        onEditOption: onEditVinculoTipoOption || null,
                        placeholder: 'Pesquisar ou cadastrar...'
                      }}
                    />
                  )}
                </div>
              )}
              
              {/* Badges - Apenas quando NÃO está editando */}
              {!isEditing && (
                <div className="detail-badges-row">
                  <div className="detail-badge-item">
                    <span className="detail-label-small">Status</span>
                    <span className={`info-badge status status-${formData.status?.toLowerCase()}`}>
                      {formData.status_display || formData.status}
                    </span>
                  </div>
                  <div className="detail-badge-item">
                    <span className="detail-label-small">Tribunal</span>
                    <span className="info-badge tribunal">
                      {formData.tribunal_display || formData.tribunal}
                    </span>
                  </div>
                  {formData.tipo_acao && (
                    <div className="detail-badge-item">
                      <span className="detail-label-small">Tipo</span>
                      <span className={`process-tipo-badge tipo-${getTipoAcaoBadgeVariant(formData.tipo_acao)}`}>
                        {formData.tipo_acao_display || formData.tipo_acao}
                      </span>
                    </div>
                  )}
                  <div className="detail-badge-item">
                    <span className="detail-label-small">Vínculo</span>
                    <div className="vinculo-badge-inline-actions">
                      <span className={`info-badge vinculo-badge vinculo-${vinculoInfo.variant}`}>
                        {vinculoInfo.label}
                      </span>
                      {showNeutralInlineMarkPrincipal && (
                        <Button
                          variant="success"
                          size="sm"
                          className="vinculos-identificacao__badge-action-button"
                          onClick={handleMarkAsPrincipal}
                          disabled={!canMarkAsPrincipal}
                          title={canMarkAsPrincipal
                            ? 'Definir este processo como principal'
                            : 'Disponível apenas para processo neutro'}
                        >
                          Tornar principal
                        </Button>
                      )}
                      {showPrincipalInlineNeutralize && (
                        <Button
                          variant="warning"
                          size="sm"
                          className="vinculos-identificacao__badge-action-button vinculos-identificacao__badge-action-button--neutralize"
                          onClick={handleMarkAsNeutral}
                          disabled={!canMarkAsNeutral}
                          title={canMarkAsNeutral
                            ? 'Desfazer classificação de principal (tornar neutro)'
                            : 'Remova os processos derivados vinculados antes de tornar neutro'}
                        >
                          Tornar neutro
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showNeutralActionBar && (
                <div className="vinculos-identificacao__actions">
                  <Button
                    variant="success"
                    size="sm"
                    className="vinculos-identificacao__action-button vinculos-identificacao__action-button--derived"
                    onClick={handleLinkAsDerived}
                    disabled={!canLinkAsDerived}
                    title={canLinkAsDerived
                      ? 'Vincular um processo como derivado'
                      : 'Ação indisponível para o estado atual'}
                  >
                    Vincular como derivado
                  </Button>
                </div>
              )}

              {!isEditing && vinculosListModel.showList && (
                <div className="detail-item full vinculos-identificacao">
                  <div className="section-header">
                    <h3 className="section-title">🔗 PROCESSOS VINCULADOS</h3>
                    <div className="section-header-actions">
                      {showVinculoActions && vinculoInfo.isPrincipal && (
                        <Button
                          variant="success"
                          size="sm"
                          className="vinculos-identificacao__badge-action-button vinculos-identificacao__badge-action-button--header-link"
                          onClick={handleAddDerivedCase}
                          title="Selecionar um processo existente para vincular a este principal"
                        >
                          + Vincular
                        </Button>
                      )}
                      {loadingLinkedCases && (
                        <span className="vinculos-identificacao__loading">Carregando…</span>
                      )}
                    </div>
                  </div>

                  <div className="vinculos-identificacao__list" role="list">
                    {vinculosListModel.rows.reduce((acc, row, index, arr) => {
                      const numero = row?.numero_processo_formatted || row?.numero_processo || '—';
                      const titulo = String(row?.titulo || '').trim() || '—';
                      const partiesText = renderLinkedCasePartiesSummary(row);
                      const rowVariant = getRowVinculoVariant(row);
                      const vinculoTipo = renderVinculoTipo(row);
                      const isPrincipalRow = row?._rowKind === 'principal';
                      const isFirstDerivedAfterPrincipal =
                        row?._rowKind === 'derived' && index > 0 && arr[index - 1]?._rowKind === 'principal';

                      if (isFirstDerivedAfterPrincipal) {
                        acc.push(
                          <div key="vinculos-subtitle" className="vinculos-identificacao__subtitle">
                            Processos derivados
                          </div>
                        );
                      }

                      acc.push(
                        <div
                          key={String(row?.id)}
                          className={`vinculos-identificacao__row ${isPrincipalRow ? 'is-principal' : 'is-derived'}`}
                          role="listitem"
                        >
                          <div className="vinculos-identificacao__marker">
                            {row?._isCurrent ? '➜' : ''}
                          </div>

                          <a
                            href={`/cases/${row?.id}`}
                            className={`info-badge vinculo-link vinculo-${rowVariant} ${isPrincipalRow ? 'is-principal-number' : 'is-derived-number'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              openCaseDetailWindow(row?.id);
                            }}
                            title="Abrir detalhes do processo"
                          >
                            {numero}
                          </a>

                          <div className="vinculos-identificacao__title" title={titulo}>{titulo}</div>
                          <div className="vinculos-identificacao__parties" title={partiesText}>{partiesText}</div>

                          <div className="vinculos-identificacao__tipo">
                            {vinculoTipo ? (
                              vinculoTipo === '--' ? (
                                <span className="vinculos-identificacao__tipo-placeholder">--</span>
                              ) : (
                                <span className="info-badge vinculo-tipo-badge">{vinculoTipo}</span>
                              )
                            ) : null}
                          </div>

                          <div className="vinculos-identificacao__row-actions">
                            {canManageLinkedRows && !isPrincipalRow && (
                              <>
                                <button
                                  type="button"
                                  className="vinculos-identificacao__icon-button"
                                  onClick={() => handleEditLinkedCaseVinculoTipo(row)}
                                  title="Editar tipo de vínculo"
                                  aria-label="Editar vínculo"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="vinculos-identificacao__icon-button vinculos-identificacao__icon-button--danger"
                                  onClick={() => handleUnlinkLinkedCase(row)}
                                  title="Desvincular processo"
                                  aria-label="Desvincular processo"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );

                      return acc;
                    }, [])}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Partes e Financeiro */}
          <div className="details-group">
            <h3 className="details-group-title">👥 Partes e Financeiro</h3>
              <div className="details-content">
                <div className="detail-partes-row">
                  <div className="detail-partes-col">
                    {(() => {
                      const clientParty = parties.find(p => p.is_client);
                      const clientRep = clientParty
                        ? representations.find((r) => Number(r?.represented_contact) === Number(clientParty.contact))
                        : null;
                      const clientRepTypeLabel = (clientRep?.representation_type || '').trim();
                      const otherReps = representations
                        .filter((r) => {
                          const representedId = Number(r?.represented_contact);
                          if (!representedId) return false;
                          if (clientParty && representedId === Number(clientParty.contact)) return false;
                          return parties.some((p) => Number(p?.contact) === representedId);
                        });
                      const dynamicLabel = 'CLIENTE/REPRESENTADO DA AÇÃO';
                      
                      return (
                        <>
                          <span className="detail-label">{dynamicLabel}</span>
                          {clientParty ? (
                            <div className="detail-client-block">
                              <div className="detail-client-row">
                                <Link
                                  to={`/contacts?open=${clientParty.contact}`}
                                  className="party-contact-link detail-client-link"
                                  title="Ver detalhes, selecionar ou criar outro processo com vínculo"
                                  onClick={(e) => openContact(e, clientParty.contact)}
                                >
                                  <span className="detail-client-name">{clientParty.contact_name}</span> ↗
                                </Link>
                                <PartyRoleBadge label="CLIENTE" isClient={true} showCheck={true} size="md" />
                              </div>

                              {clientRep && (
                                <div className="detail-representative-block">
                                  <span className="detail-label detail-representative-title">REPRESENTADO POR</span>
                                  <div className="detail-representative-row">
                                    <Link
                                      to={`/contacts?open=${clientRep?.representative_contact}`}
                                      className="party-contact-link detail-representative-link"
                                      title="Abrir representante em nova aba"
                                      onClick={(e) => openContact(e, clientRep?.representative_contact)}
                                    >
                                      <span className="detail-representative-name">{clientRep?.representative_contact_name}</span> ↗
                                    </Link>
                                    {clientRepTypeLabel && (
                                      <PartyRoleBadge label={clientRepTypeLabel} size="md" />
                                    )}
                                  </div>
                                </div>
                              )}

                              {otherReps.length > 0 && (
                                <div className="detail-representative-block">
                                  <span className="detail-label detail-representative-title">OUTROS REPRESENTADOS</span>
                                  <div className="detail-partes-list" style={{ marginTop: '0.5rem' }}>
                                    {otherReps.map((rep) => {
                                      const repTypeLabel = (rep?.representation_type || '').trim();
                                      return (
                                        <div key={`${rep?.represented_contact}-${rep?.representative_contact}`} className="detail-partes-item">
                                          <Link
                                            to={`/contacts?open=${rep?.represented_contact}`}
                                            className="party-contact-link"
                                            title="Abrir representado em nova aba"
                                            onClick={(e) => openContact(e, rep?.represented_contact)}
                                          >
                                            <strong>{rep?.represented_contact_name}</strong> ↗
                                          </Link>
                                          <span className="detail-value-sub"> → </span>
                                          <Link
                                            to={`/contacts?open=${rep?.representative_contact}`}
                                            className="party-contact-link"
                                            title="Abrir representante em nova aba"
                                            onClick={(e) => openContact(e, rep?.representative_contact)}
                                          >
                                            <strong>{rep?.representative_contact_name}</strong> ↗
                                          </Link>
                                          {repTypeLabel && (
                                            <span style={{ marginLeft: '0.5rem' }}>
                                              <PartyRoleBadge label={repTypeLabel} size="sm" />
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="detail-client-block">
                              <span className="detail-value empty">Nenhum cliente vinculado</span>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  if (onAddPartyClick) {
                                    onAddPartyClick();
                                  }
                                }}
                                style={{marginTop: '0.5rem'}}
                              >
                                  <UserPlus size={16} />
                                  Selecionar Contato
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <button
                      className="btn-link detail-partes-hint"
                      onClick={() => setActiveSection('parties')}
                    >ℹ️ Use a aba "Partes" para gerenciar detalhadamente</button>
                  </div>
                  <div className="detail-partes-col">
                    <span className="detail-label">Partes</span>
                    {(() => {
                      const otherParties = parties.filter(p => !p.is_client);
                      if (otherParties.length > 0) {
                        return (
                          <div className="detail-partes-list">
                            {otherParties.map(party => (
                              <div key={party.id} className="detail-partes-item">
                                <Link
                                  to={`/contacts?open=${party.contact}`}
                                  className="party-contact-link"
                                  title="Ver detalhes, selecionar ou criar outro processo com vínculo"
                                  onClick={(e) => openContact(e, party.contact)}
                                >
                                  <strong>{party.contact_name}</strong> ↗
                                </Link>
                                <span className="detail-value-sub">({party.role_display})</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <span className="detail-value empty">Nenhuma outra parte cadastrada</span>
                      );
                    })()}
                  </div>
                </div>

                {!isEditing ? (
                  <div className="detail-financeiro-row">
                    <div className="detail-financeiro-item">
                      <span className="detail-label">💰 Valor da Causa</span>
                      <EditableDetailField
                        label=""
                        value={formData.valor_causa}
                        isEditing={false}
                        type="currency"
                        onChange={(value) => handleInputChange('valor_causa', value)}
                        formatDisplay={(v) => formatCurrency(v)}
                      />
                    </div>
                    <div className="detail-financeiro-actions">
                      <button
                        className="btn-link detail-financeiro-hint"
                        onClick={() => setActiveSection('financeiro')}
                      >💰 Use a aba "Financeiro" para controlar recebimentos e despesas</button>
                    </div>
                  </div>
                ) : (
                  <EditableDetailField
                    label="Valor da Causa"
                    value={formData.valor_causa}
                    isEditing={isEditing}
                    type="currency"
                    onChange={(value) => handleInputChange('valor_causa', value)}
                  />
                )}
              </div>
            </div>

            {/* Cronologia */}
            <div className="details-group">
              <h3 className="details-group-title">📅 Cronologia e Localização</h3>
              <div className="details-content">
                {!isEditing ? (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Data de Distribuição</span>
                      <span className="detail-value"><strong>{formatDate(formData.data_distribuicao)}</strong></span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Última Movimentação</span>
                      {formData.data_ultima_movimentacao ? (
                        <div className="detail-value-stacked">
                          <strong>{formatDate(formData.data_ultima_movimentacao)}</strong>
                          {(() => {
                            const days = caseData?.dias_sem_movimentacao ?? formData?.dias_sem_movimentacao;
                            if (days === null || days === undefined) return null;
                            const parsed = Number(days);
                            if (!Number.isFinite(parsed) || parsed < 0) return null;

                            return (
                              <div className="detail-value-sub">
                                {parsed === 0 ? 'Movimentação de hoje' : `${parsed} dia(s) sem movimentação`}
                              </div>
                            );
                          })()}
                          {formData.ultima_movimentacao_resumo && (
                            <div
                              className="detail-value-sub"
                              dangerouslySetInnerHTML={{ __html: sanitizeHTML(formData.ultima_movimentacao_resumo) }}
                            />
                          )}
                          <button
                            className="btn-link detail-partes-hint"
                            style={{ marginTop: '0.35rem', alignSelf: 'flex-start' }}
                            onClick={onOpenLatestMovimentacao}
                          >
                            🔎 Ver movimentação destacada
                          </button>
                        </div>
                      ) : (
                        <span className="detail-value empty">Nenhuma movimentação cadastrada</span>
                      )}
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Comarca / Foro / Vara</span>
                      <span className="detail-value">{formData.vara || '-'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <EditableDetailField
                      label="Data de Distribuição"
                      value={formData.data_distribuicao}
                      isEditing={isEditing}
                      type="date"
                      onChange={(value) => handleInputChange('data_distribuicao', value)}
                    />
                    <EditableDetailField
                      label="Comarca / Foro / Vara"
                      value={formData.vara}
                      isEditing={isEditing}
                      type="text"
                      onChange={(value) => handleInputChange('vara', value)}
                      placeholder="Ex: Foro de Americana - 4ª Vara Cível"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Observações */}
            <div className="details-group">
              <h3 className="details-group-title">📝 Observações</h3>
              <div className="details-content">
                {!readOnly && hasPublicationOrigin && (
                  <div className="observacoes-origem-box">
                    <div className="observacoes-origem-row">
                      <button
                        type="button"
                        className="observacoes-origem-link"
                        onClick={handleOpenOrigemPublicationDetails}
                        title="Abrir detalhes da publicação de origem em nova janela"
                      >
                        🔗 Origem: {formData.publicacao_origem_tipo || 'Publicação'} • {formatDate(formData.publicacao_origem_data) || '-'}
                      </button>
                      <div className="observacoes-origem-actions">
                        {/* Botões de Consulta */}
                        {renderProcessConsultaButtons({ wrap: false })}
                      </div>
                    </div>
                  </div>
                )}

                {!isEditing ? (
                  <div className="detail-item full">
                    <p className="detail-value detail-value-prewrap">{formData.observacoes || '-'}</p>
                  </div>
                ) : (
                  <EditableDetailField
                    label="Observações"
                    value={formData.observacoes}
                    isEditing={isEditing}
                    type="textarea"
                    onChange={(value) => handleInputChange('observacoes', value)}
                    placeholder="Observações sobre o processo..."
                    rows={4}
                  />
                )}
              </div>
            </div>
        </div>
        
        {/* Botões de Ação - Modo Edição */}
        {isEditing && !readOnly && (
          <div className="form-actions" style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <CancelButton className="case-info-btn-cancel" onClick={onCancel} disabled={saving} />
            <SaveButton onClick={onSave} disabled={saving}>
              {saving ? '⏳ Salvando...' : '💾 Salvar'}
            </SaveButton>
          </div>
        )}
      </div>

    </div>
  );
}

export default InformacaoTab;
