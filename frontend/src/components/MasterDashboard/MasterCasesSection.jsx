import { openCaseDetailWindow } from '../../utils/publicationNavigation';

function formatBRL(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '—';
  return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getOfficeParticipationLabel(c) {
  const valorCausa = Number(c?.valor_causa);
  const fixed = Number(c?.participation_fixed_value);
  const perc = Number(c?.participation_percentage);
  const feeAmount = Number(c?.attorney_fee_amount);
  const installments = Number(c?.attorney_fee_installments);

  const fixedTotal = Number.isFinite(fixed) && fixed > 0 ? fixed : 0;

  const percTotal = (
    Number.isFinite(valorCausa)
    && valorCausa > 0
    && Number.isFinite(perc)
    && perc > 0
  )
    ? (valorCausa * perc) / 100
    : 0;

  const feeInstallments = Number.isFinite(installments) && installments > 0 ? installments : 1;
  const feeTotal = Number.isFinite(feeAmount) && feeAmount > 0 ? feeAmount * feeInstallments : 0;

  const totalParticipation = fixedTotal + percTotal + feeTotal;
  if (totalParticipation > 0) {
    return formatBRL(totalParticipation);
  }

  // Fallbacks when total can't be computed (e.g., missing valor_causa).
  if (Number.isFinite(perc) && perc > 0) {
    return `${perc.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  }

  if (Number.isFinite(fixed) && fixed > 0) {
    return formatBRL(fixed);
  }

  return '—';
}

export default function MasterCasesSection({
  selectedLawyer,
  selectedLawyerOptionLabel,
  casesSearch,
  onCasesSearchChange,
  casesError,
  casesLoading,
  casesData,
}) {
  return (
    <section className="master-admin-cases-section" aria-label="Processos">
      <div className="master-admin-cases-header">
        <div>
          <h2 className="master-admin-cases-title">Processos</h2>
          <p className="master-admin-cases-subtitle">
            {selectedLawyer && `Processos de ${selectedLawyerOptionLabel}`}
          </p>
        </div>
        <div className="master-admin-contacts-search-wrap">
          <span className="master-admin-contacts-search-icon">🔍</span>
          <input
            type="text"
            className="master-admin-contacts-search"
            placeholder="Buscar por número, cliente, título..."
            value={casesSearch}
            onChange={onCasesSearchChange}
          />
        </div>
      </div>

      {casesError ? (
        <div className="master-admin-contacts-feedback master-admin-contacts-feedback--error">{casesError}</div>
      ) : casesLoading ? (
        <div className="master-admin-contacts-feedback">Carregando processos...</div>
      ) : casesData.length === 0 ? (
        <div className="master-admin-contacts-feedback">Nenhum processo encontrado para o filtro aplicado.</div>
      ) : (
        <div className="master-admin-cases-table-wrap">
          <table className="master-admin-cases-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Título / Tipo</th>
                <th>Tribunal</th>
                <th>Cliente</th>
                <th>Valor da causa</th>
                <th>Participação escritório</th>
                <th>Total recebido</th>
                <th>Última movimentação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {casesData.map((c) => (
                <tr
                  key={c.id}
                  className="master-admin-cases-row"
                  onClick={() => openCaseDetailWindow(c.id, { teamMemberId: selectedLawyer, readOnly: true })}
                  title="Abrir processo em nova aba"
                >
                  <td className="master-admin-cases-cell--numero">
                    {c.numero_processo_formatted || c.numero_processo || '—'}
                  </td>
                  <td className="master-admin-cases-cell--titulo">
                    {c.titulo || c.tipo_acao_display || '—'}
                  </td>
                  <td>{c.tribunal_display || c.tribunal || '—'}</td>
                  <td>
                    {c.cliente_nome
                      || c.parties_summary?.find((party) => party.is_client)?.name
                      || c.parties_summary?.[0]?.name
                      || '—'}
                  </td>
                  <td>{formatBRL(c.valor_causa)}</td>
                  <td>{getOfficeParticipationLabel(c)}</td>
                  <td>{formatBRL(c.total_payments)}</td>
                  <td>
                    {c.data_ultima_movimentacao
                      ? new Date(c.data_ultima_movimentacao + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="master-admin-cases-finance-link"
                      title="Abrir aba Financeiro (somente leitura)"
                      aria-label="Abrir financeiro do processo"
                      onClick={(event) => {
                        event.stopPropagation();
                        openCaseDetailWindow(c.id, {
                          teamMemberId: selectedLawyer,
                          readOnly: true,
                          tab: 'financeiro',
                        });
                      }}
                    >
                      💰
                    </button>
                    <span className="master-admin-cases-status" data-status={c.status}>
                      {c.status_display || c.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
