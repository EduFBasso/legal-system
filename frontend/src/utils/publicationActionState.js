export function formatNumeroProcessoShort(numeroProcesso, digits = 7) {
  if (!numeroProcesso) return null;
  const digitsOnly = String(numeroProcesso).replace(/\D/g, '');
  if (!digitsOnly) return null;
  return digitsOnly.slice(0, digits);
}

export function getPublicationActionState(publication, caseSuggestionParam = null) {
  const caseSuggestion = caseSuggestionParam ?? publication?.case_suggestion ?? null;
  const isIntegrated = publication?.integration_status === 'INTEGRATED' || Boolean(publication?.case_id);

  if (isIntegrated) {
    return {
      key: 'integrated',
      label: '✅ Caso já criado/vinculado',
      title: publication?.case_id
        ? `Clique para abrir o caso #${publication.case_id}`
        : 'Publicação já integrada',
      className: 'btn-integrate',
    };
  }

  if (caseSuggestion?.id) {
    const processoShort = formatNumeroProcessoShort(caseSuggestion.numero_processo);
    return {
      key: 'suggested',
      label: processoShort
        ? `🔗 Processo: ${processoShort}...`
        : `🔗 Vincular ao Caso #${caseSuggestion.id}`,
      title: caseSuggestion.numero_processo
        ? `Vincular ao processo ${caseSuggestion.numero_processo}`
        : `Vincular ao caso #${caseSuggestion.id}`,
      className: 'btn-integrate',
    };
  }

  return {
    key: 'create',
    label: '➕ Criar Caso',
    title: 'Criar novo caso para esta publicação',
    className: 'btn-create-case',
  };
}
