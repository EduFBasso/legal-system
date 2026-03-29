import SearchableCreatableSelectField from '../FormFields/SearchableCreatableSelectField';

function CasesPageHeader({
  isSelectLinkMode,
  isSelectDerivedMode,
  isEditDerivedMode,
  principalCaseNumber,
  principalCaseId,
  selectedVinculoTipo,
  setSelectedVinculoTipo,
  vinculoTipoOptions,
  onCreateVinculoTipoOption,
  onCreateNewFromSelectDerived,
  onCancelSelectLinkMode,
  linkingVinculo,
  selectedCaseId,
  onSaveSelectDerived,
  isSelectPrincipalMode,
  targetCaseNumber,
  targetCaseId,
  onSaveSelectPrincipal,
  onOpenNewCase,
}) {
  return (
    <div className={`cases-header ${isSelectLinkMode ? 'cases-header--select' : ''}`}>
      {isSelectDerivedMode ? (
        <div className="cases-select-header">
          <h1>
            {isEditDerivedMode
              ? `Editar vínculo derivado do Principal: ${principalCaseNumber || `#${principalCaseId}`}`
              : `Escolha um processo para vincular ao Principal: ${principalCaseNumber || `#${principalCaseId}`}`}
          </h1>

          <div className="cases-select-vinculo-field">
            <SearchableCreatableSelectField
              label="Tipo de vínculo"
              value={selectedVinculoTipo}
              onChange={setSelectedVinculoTipo}
              options={vinculoTipoOptions}
              placeholder="Selecione ou cadastre..."
              allowCreate={true}
              onCreateOption={onCreateVinculoTipoOption}
            />
          </div>

          <div className="cases-select-actions">
            <button
              className="btn btn-primary"
              onClick={onCreateNewFromSelectDerived}
              disabled={linkingVinculo}
            >
              + Novo Processo
            </button>

            <button
              className="btn btn-secondary"
              onClick={onCancelSelectLinkMode}
              disabled={linkingVinculo}
            >
              Cancelar
            </button>

            {Boolean(selectedCaseId) && (
              <button
                className="btn btn-primary"
                onClick={onSaveSelectDerived}
                disabled={linkingVinculo}
              >
                Salvar
              </button>
            )}
          </div>
        </div>
      ) : isSelectPrincipalMode ? (
        <div className="cases-select-header">
          <h1>
            Você está vinculando {targetCaseNumber || `#${targetCaseId}`} como DERIVADO
          </h1>
          <p className="cases-select-description">
            Escolha um processo PRINCIPAL ou NEUTRO para criar o vínculo.
          </p>

          <div className="cases-select-vinculo-field">
            <SearchableCreatableSelectField
              label="Tipo de vínculo"
              value={selectedVinculoTipo}
              onChange={setSelectedVinculoTipo}
              options={vinculoTipoOptions}
              placeholder="Selecione ou cadastre..."
              allowCreate={true}
              onCreateOption={onCreateVinculoTipoOption}
            />
          </div>

          <div className="cases-select-actions">
            <button
              className="btn btn-secondary"
              onClick={onCancelSelectLinkMode}
              disabled={linkingVinculo}
            >
              Cancelar
            </button>

            {Boolean(selectedCaseId) && (
              <button
                className="btn btn-primary"
                onClick={onSaveSelectPrincipal}
                disabled={linkingVinculo}
              >
                Salvar
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <h1>Processos</h1>
          <button className="btn btn-primary" onClick={onOpenNewCase}>
            + Novo Processo
          </button>
        </>
      )}
    </div>
  );
}

export default CasesPageHeader;
