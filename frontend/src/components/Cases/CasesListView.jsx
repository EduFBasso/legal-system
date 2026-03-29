import CaseCard from '../CaseCard';

/**
 * CasesListView - Renders the cases list with loading, empty, and cards states.
 *
 * Props:
 *  shouldShowLoadingState  - bool: show spinner
 *  listCases               - array: cases to display
 *  isSelectDerivedMode     - bool: page is in "select derived" mode
 *  isSelectPrincipalMode   - bool: page is in "select principal" mode
 *  isSelectLinkMode        - bool: any link-selection mode is active
 *  linkedCasesById         - Map: caseId → linked cases array
 *  principalCaseId         - id of the principal being edited (select-derived mode)
 *  selectedCaseId          - id of the currently selected card
 *  openCaseDetail          - fn(caseItem): open detail for a case
 */
export default function CasesListView({
  shouldShowLoadingState,
  listCases,
  isSelectDerivedMode,
  isSelectPrincipalMode,
  isSelectLinkMode,
  linkedCasesById,
  principalCaseId,
  selectedCaseId,
  openCaseDetail,
}) {
  return (
    <div className="cases-list-container">
      {shouldShowLoadingState ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando processos...</p>
        </div>
      ) : listCases.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum processo encontrado</p>
          <p className="empty-state-hint">
            {isSelectDerivedMode
              ? 'Nenhum processo NEUTRO e ATIVO disponível para vínculo.'
              : isSelectPrincipalMode
                ? 'Nenhum processo PRINCIPAL ou NEUTRO disponível para ser selecionado como principal.'
              : 'Ajuste os filtros ou crie um novo processo'}
          </p>
        </div>
      ) : (
        <div className="cases-list">
          {listCases.map((caseItem) => {
            const isPrincipalReference =
              isSelectDerivedMode && Number(caseItem.id) === Number(principalCaseId);
            const isPrincipalCategory =
              isSelectDerivedMode &&
              !caseItem?.case_principal &&
              String(caseItem?.classificacao || '').trim().toUpperCase() === 'PRINCIPAL';

            const isDisabledInSelectDerived = isPrincipalReference || isPrincipalCategory;

            const disabledLabel = isPrincipalReference
              ? 'Processo principal'
              : isPrincipalCategory
                ? 'Principal indisponível'
                : '';

            return (
              <CaseCard
                key={caseItem.id}
                caseData={caseItem}
                linkedCases={linkedCasesById.get(caseItem.id) || []}
                onClick={() => openCaseDetail(caseItem)}
                isSelected={isSelectLinkMode && Number(selectedCaseId) === Number(caseItem.id)}
                isDisabled={isDisabledInSelectDerived}
                disabledLabel={disabledLabel}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
