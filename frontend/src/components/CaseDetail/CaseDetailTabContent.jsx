import {
  InformacaoTab,
  PartiesTab,
  MovimentacoesTab,
  DocumentosTab,
  FinanceiroTab,
  PublicacoesTab,
  TasksTab,
  VinculosTab,
} from '../CaseTabs';

export default function CaseDetailTabContent({
  activeSection,
  id,
  isReadOnly,

  navigation,
  caseCore,
  parties,
  movements,
  publications,
  financial,

  documentos,
  loadingDocumentos,
  uploadingDocumento,
  onUploadDocument,
  onDeleteDocument,

  formatDate,
  formatCurrency,

  autoSavingFinancial,
  systemSettings,
  showPublicacoesTab,

  currentCaseCnj,

  linkedCases,
  loadingLinkedCases,
  mentionedProcessLinks,
  onMentionedProcessRoleChange,
  onRemoveMentionedProcess,

  onSaveCaseWithParties,
  onDeleteCase,

  onOpenLatestMovimentacao,
  onOpenOrigemMovimentacao,
  onOpenOrigemPublicacao,
  onAddPartyClick,

  onRemoveParty,
}) {
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
          onInputChange={caseCore.handleInputChange}
          readOnly={isReadOnly}
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

      {activeSection === 'documentos' && (
        <DocumentosTab
          caseId={id}
          documentos={documentos}
          loading={loadingDocumentos}
          uploading={uploadingDocumento}
          onUploadDocument={onUploadDocument}
          onDeleteDocument={onDeleteDocument}
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
          caseData={caseCore.caseData}
          tasks={movements.tasks}
          setTasks={movements.setTasks}
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

      {activeSection === 'vinculos' && (
        <VinculosTab
          caseData={caseCore.caseData}
          linkedCases={linkedCases}
          loading={loadingLinkedCases}
          parties={parties.parties}
          mentionedProcessLinks={mentionedProcessLinks}
          onMentionedProcessRoleChange={onMentionedProcessRoleChange}
          onRemoveMentionedProcess={onRemoveMentionedProcess}
          readOnly={isReadOnly}
        />
      )}

      {activeSection === 'parties' && (
        <PartiesTab
          id={id}
          parties={parties.parties}
          loadingParties={parties.loadingParties}
          onAddPartyClick={isReadOnly ? () => {} : onAddPartyClick}
          onRemoveParty={isReadOnly ? () => {} : onRemoveParty}
          onEditParty={isReadOnly ? () => {} : parties.handleEditParty}
          readOnly={isReadOnly}
        />
      )}
    </main>
  );
}
