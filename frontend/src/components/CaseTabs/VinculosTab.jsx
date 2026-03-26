import { useCallback, useMemo, useState } from 'react';

import './VinculosTab.css';

function VinculosTab({
  readOnly = false,
}) {
  const [rows, setRows] = useState(() => [
    { id: 1, categoria: '', origem: '', destino: '', tipo: '', observacoes: '' },
  ]);

  const nextId = useMemo(() => {
    const maxId = rows.reduce((max, row) => Math.max(max, Number(row?.id) || 0), 0);
    return maxId + 1;
  }, [rows]);

  const addRow = useCallback(() => {
    if (readOnly) return;
    setRows((prev) => [
      ...prev,
      { id: nextId, categoria: '', origem: '', destino: '', tipo: '', observacoes: '' },
    ]);
  }, [nextId, readOnly]);

  const removeRow = useCallback((id) => {
    if (readOnly) return;
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== id);
      return next.length > 0 ? next : [{ id: 1, categoria: '', origem: '', destino: '', tipo: '', observacoes: '' }];
    });
  }, [readOnly]);

  const updateRow = useCallback((id, field, value) => {
    if (readOnly) return;
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }, [readOnly]);

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">🔗 Vínculos</h2>
        </div>
        <div className="vinculos-lab">
          <div className="vinculos-lab__header">
            <div className="vinculos-lab__title">Laboratório de vínculos</div>
            <div className="vinculos-lab__subtitle">
              Insira linhas manualmente para organizar relações (cliente × processos, representante × cliente principal etc.).
            </div>
          </div>

          <div className="vinculos-lab__actions">
            <button type="button" className="btn btn-secondary btn-md" onClick={addRow} disabled={readOnly}>
              + Adicionar linha
            </button>
          </div>

          <div className="vinculos-lab__table" role="table" aria-label="Tabela de vínculos">
            <div className="vinculos-lab__row vinculos-lab__row--header" role="row">
              <div role="columnheader">Categoria</div>
              <div role="columnheader">Origem</div>
              <div role="columnheader">Destino</div>
              <div role="columnheader">Tipo</div>
              <div role="columnheader">Observações</div>
              <div role="columnheader">Ações</div>
            </div>

            {rows.map((row) => (
              <div key={row.id} className="vinculos-lab__row" role="row">
                <div role="cell">
                  <input
                    className="vinculos-lab__input"
                    value={row.categoria}
                    onChange={(e) => updateRow(row.id, 'categoria', e.target.value)}
                    placeholder="Ex: Cliente principal"
                    disabled={readOnly}
                  />
                </div>
                <div role="cell">
                  <input
                    className="vinculos-lab__input"
                    value={row.origem}
                    onChange={(e) => updateRow(row.id, 'origem', e.target.value)}
                    placeholder="Ex: João (cliente)"
                    disabled={readOnly}
                  />
                </div>
                <div role="cell">
                  <input
                    className="vinculos-lab__input"
                    value={row.destino}
                    onChange={(e) => updateRow(row.id, 'destino', e.target.value)}
                    placeholder="Ex: Processo 000..."
                    disabled={readOnly}
                  />
                </div>
                <div role="cell">
                  <input
                    className="vinculos-lab__input"
                    value={row.tipo}
                    onChange={(e) => updateRow(row.id, 'tipo', e.target.value)}
                    placeholder="Ex: Representante"
                    disabled={readOnly}
                  />
                </div>
                <div role="cell">
                  <input
                    className="vinculos-lab__input"
                    value={row.observacoes}
                    onChange={(e) => updateRow(row.id, 'observacoes', e.target.value)}
                    placeholder="Notas rápidas"
                    disabled={readOnly}
                  />
                </div>
                <div role="cell">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => removeRow(row.id)}
                    disabled={readOnly}
                    title="Remover linha"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VinculosTab;
