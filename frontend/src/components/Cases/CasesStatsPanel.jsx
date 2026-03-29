function CasesStatsPanel({
  loadingStats,
  hasActiveFilters,
  clearFilters,
  filters,
  stats,
  toggleStatusFilter,
  selectedVinculos,
  showVinculoBreakdown,
  onToggleVinculoBreakdown,
  vinculoTypeBreakdown,
  toggleVinculoType,
  tribunalBreakdown,
  selectedTribunals,
  showTribunalBreakdown,
  onToggleTribunalBreakdown,
  toggleTribunal,
}) {
  return (
    <div className="cases-stats" aria-busy={loadingStats ? 'true' : 'false'}>
      <div
        className={`stat-card stat-clickable ${!hasActiveFilters ? 'stat-selected' : ''}`}
        onClick={clearFilters}
        title="Ver todos os processos"
      >
        <div className="stat-value">{stats?.total || 0}</div>
        <div className="stat-label">Total</div>
      </div>
      <div
        className={`stat-card stat-active stat-clickable ${filters.status === 'ATIVO' ? 'stat-selected' : ''}`}
        onClick={() => toggleStatusFilter('ATIVO')}
        title="Processos ativos (movimentação < 90 dias)"
      >
        <div className="stat-value">{stats?.ativos || 0}</div>
        <div className="stat-label">Ativos</div>
      </div>
      <div
        className={`stat-card stat-inactive stat-clickable ${filters.status === 'INATIVO' ? 'stat-selected' : ''}`}
        onClick={() => toggleStatusFilter('INATIVO')}
        title="Processos inativos (sem movimentação > 90 dias)"
      >
        <div className="stat-value">{stats?.inativos || 0}</div>
        <div className="stat-label">Inativos</div>
      </div>
      <div
        className={`stat-card stat-clickable stat-vinculo ${selectedVinculos.length > 0 ? 'stat-selected' : ''}`}
        onClick={onToggleVinculoBreakdown}
        title="Clique para filtrar por tipo de vínculo"
      >
        <div className="stat-value">{vinculoTypeBreakdown.derivado}</div>
        <div className="stat-label">Derivados {showVinculoBreakdown ? '▲' : '▼'}</div>

        {showVinculoBreakdown && (
          <div className="vinculo-breakdown" onClick={(e) => e.stopPropagation()}>
            <div className="vinculo-breakdown-item" onClick={() => toggleVinculoType('NEUTRO')}>
              <div className="vinculo-checkbox-group">
                <input
                  type="checkbox"
                  className="vinculo-filter-checkbox"
                  checked={selectedVinculos.includes('NEUTRO')}
                  onChange={() => toggleVinculoType('NEUTRO')}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Filtrar por vínculo Neutro"
                />
                <span className="vinculo-breakdown-name">Neutro</span>
              </div>
              <span className="vinculo-breakdown-count">{vinculoTypeBreakdown.neutro}</span>
            </div>

            <div className="vinculo-breakdown-item" onClick={() => toggleVinculoType('PRINCIPAL')}>
              <div className="vinculo-checkbox-group">
                <input
                  type="checkbox"
                  className="vinculo-filter-checkbox"
                  checked={selectedVinculos.includes('PRINCIPAL')}
                  onChange={() => toggleVinculoType('PRINCIPAL')}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Filtrar por vínculo Principal"
                />
                <span className="vinculo-breakdown-name">Principal</span>
              </div>
              <span className="vinculo-breakdown-count">{vinculoTypeBreakdown.principal}</span>
            </div>

            <div className="vinculo-breakdown-item" onClick={() => toggleVinculoType('DERIVADO')}>
              <div className="vinculo-checkbox-group">
                <input
                  type="checkbox"
                  className="vinculo-filter-checkbox"
                  checked={selectedVinculos.includes('DERIVADO')}
                  onChange={() => toggleVinculoType('DERIVADO')}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Filtrar por vínculo Derivado"
                />
                <span className="vinculo-breakdown-name">Derivado</span>
              </div>
              <span className="vinculo-breakdown-count">{vinculoTypeBreakdown.derivado}</span>
            </div>
          </div>
        )}
      </div>
      {tribunalBreakdown && Object.keys(tribunalBreakdown).length > 0 && (
        <div
          className={`stat-card stat-clickable stat-tribunal ${selectedTribunals.length > 0 ? 'stat-selected' : ''}`}
          onClick={onToggleTribunalBreakdown}
          title="Clique para expandir lista de tribunais"
        >
          <div className="stat-value">{Object.keys(tribunalBreakdown).length}</div>
          <div className="stat-label">Tribunais {showTribunalBreakdown ? '▲' : '▼'}</div>

          {showTribunalBreakdown && (
            <div className="tribunal-breakdown" onClick={(e) => e.stopPropagation()}>
              {Object.entries(tribunalBreakdown).map(([tribunal, count]) => (
                <div
                  key={tribunal}
                  className="tribunal-item"
                  onClick={() => toggleTribunal(tribunal)}
                  title={tribunal}
                >
                  <div className="tribunal-checkbox-group">
                    <input
                      type="checkbox"
                      className="tribunal-filter-checkbox"
                      checked={selectedTribunals.includes(tribunal)}
                      onChange={() => toggleTribunal(tribunal)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Filtrar por tribunal ${tribunal}`}
                    />
                    <span className="tribunal-name">{tribunal}</span>
                  </div>
                  <span className="tribunal-count">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CasesStatsPanel;
