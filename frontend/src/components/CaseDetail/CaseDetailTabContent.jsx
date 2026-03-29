import {
  InformacaoTab,
  PartiesTab,
  MovimentacoesTab,
  FinanceiroTab,
  PublicacoesTab,
  TasksTab,
} from '../CaseTabs';

import './CaseDetailSections.css';
import './CaseDetailTabContent.css';

export default function CaseDetailTabContent({
  caseDetail,

  onSaveCaseWithParties,
  onDeleteCase,

  onOpenLatestMovimentacao,
  onOpenOrigemMovimentacao,
  onOpenOrigemPublicacao,
  onPatchCase,
  onAddPartyClick,

  onOpenContactModal = null,

  onRemoveParty,
}) {
  const {
    activeSection,
    id,
    isReadOnly,

    navigation,
    caseCore,
    parties,
    movements,
    publications,
    financial,

    formatDate,
    formatCurrency,

    autoSavingFinancial,
    systemSettings,
    showPublicacoesTab,

    currentCaseCnj,

    linkedCases,
    loadingLinkedCases,
  } = caseDetail;

  return (
    <main className="case-content">
      {activeSection === 'info' && (
        <InformacaoTab
          id={id}
          formData={caseCore.formData}
          setFormData={caseCore.setFormData}
          isEditing={caseCore.isEditing}
          setIsEditing={isReadOnly ? () => {} : caseCore.setIsEditing}
          saving={caseCore.saving}
          onSave={isReadOnly ? () => {} : onSaveCaseWithParties}
          onCancel={isReadOnly ? () => {} : caseCore.handleCancel}
          onDelete={isReadOnly ? () => {} : onDeleteCase}
          setActiveSection={navigation.setActiveSection}
          onOpenLatestMovimentacao={onOpenLatestMovimentacao}
          onOpenOrigemMovimentacao={onOpenOrigemMovimentacao}
          onOpenOrigemPublicacao={onOpenOrigemPublicacao}
          onAddPartyClick={onAddPartyClick}
          parties={parties.parties}
          caseData={caseCore.caseData}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          tribunalOptions={caseCore.tribunalOptions}
          statusOptions={caseCore.statusOptions}
          tipoAcaoOptions={caseCore.tipoAcaoOptions}
          onCreateTipoAcaoOption={caseCore.createTipoAcaoOption}
          onEditTipoAcaoOption={caseCore.updateTipoAcaoOption}
          tituloOptions={caseCore.tituloOptions}
          onCreateTituloOption={caseCore.createTituloOption}
          onEditTituloOption={caseCore.updateTituloOption}
          onSearchTituloOptions={caseCore.searchTituloOptions}
          vinculoTipoOptions={caseCore.vinculoTipoOptions}
          onCreateVinculoTipoOption={caseCore.createVinculoTipoOption}
          onEditVinculoTipoOption={caseCore.updateVinculoTipoOption}
          onInputChange={caseCore.handleInputChange}
          validationErrors={caseCore.fieldValidationErrors}
          readOnly={isReadOnly}
          onOpenContactModal={onOpenContactModal}
          linkedCases={linkedCases}
          loadingLinkedCases={loadingLinkedCases}
          onPatchCase={onPatchCase}
        />
      )}

      {activeSection === 'movimentacoes' && (
        <MovimentacoesTab
          id={id}
          movimentacoes={movements.movimentacoes}
          numeroProcesso={caseCore.caseData?.numero_processo}
          excludeCnj={currentCaseCnj}
          tasks={movements.tasks}
          highlightedMovimentacaoId={navigation.highlightedMovimentacaoId}
          highlightedTaskId={navigation.highlightedTaskId}
          formatDate={formatDate}
          onDelete={movements.handleDeleteMovimentacao}
          onRefreshTasks={movements.loadTasks}
          onMentionProcess={movements.onMentionProcess}
          onRefreshMovements={movements.loadMovimentacoes}
          readOnly={isReadOnly}
        />
      )}

      {activeSection === 'publicacoes' && showPublicacoesTab && (
        <PublicacoesTab
          caseId={id}
          publicacoes={publications.publicacoes}
          loading={publications.loadingPublicacoes}
          systemSettings={systemSettings}
          onVincularPublicacao={(publicacao) => {
            console.log('Vincular publicação:', publicacao);
          }}
          onDesvincularPublicacao={(publicacaoId) => {
            publications.setPublicacoes((prev) => prev.filter((p) => p.id !== publicacaoId));
          }}
          onCreateMovement={movements.handleCreateMovementFromPublication}
          onRefresh={publications.loadPublicacoes}
        />
      )}

      {activeSection === 'tasks' && (
        <TasksTab
          caseId={id}
          tasks={movements.tasks}
          loadingTasks={movements.loadingTasks}
          formatDate={formatDate}
          onRefreshTasks={movements.loadTasks}
          readOnly={isReadOnly}
        />
      )}

      {activeSection === 'financeiro' && (
        <FinanceiroTab
          id={id}
          formData={caseCore.formData}
          setFormData={caseCore.setFormData}
          recebimentos={financial.recebimentos}
          despesas={financial.despesas}
          participacaoTipo={financial.participacaoTipo}
          participacaoPercentual={financial.participacaoPercentual}
          participacaoValorFixo={financial.participacaoValorFixo}
          pagaMedianteGanho={financial.pagaMedianteGanho}
          recebimentoForm={financial.recebimentoForm}
          despesaForm={financial.despesaForm}
          onInputChange={caseCore.handleInputChange}
          setRecebimentoForm={financial.setRecebimentoForm}
          setDespesaForm={financial.setDespesaForm}
          setParticipacaoTipo={financial.setParticipacaoTipo}
          setParticipacaoPercentual={financial.setParticipacaoPercentual}
          setParticipacaoValorFixo={financial.setParticipacaoValorFixo}
          setPagaMedianteGanho={financial.setPagaMedianteGanho}
          onAddRecebimento={financial.handleAdicionarRecebimento}
          onRemoveRecebimento={financial.handleRemoverRecebimento}
          onAddDespesa={financial.handleAdicionarDespesa}
          onRemoveDespesa={financial.handleRemoverDespesa}
          autoSavingObservations={autoSavingFinancial}
          readOnly={isReadOnly}
        />
      )}

      {activeSection === 'parties' && (
        <PartiesTab
          id={id}
          parties={parties.parties}
          loadingParties={parties.loadingParties}
          caseData={caseCore.caseData}
          onAddPartyClick={isReadOnly ? () => {} : onAddPartyClick}
          onRemoveParty={isReadOnly ? () => {} : onRemoveParty}
          onEditParty={
            isReadOnly
              ? () => {}
              : (party) => parties.handleEditParty(party, caseCore.caseData?.representations)
          }
          readOnly={isReadOnly}
        />
      )}
    </main>
  );
}
