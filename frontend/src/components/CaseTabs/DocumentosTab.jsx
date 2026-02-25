import { Plus, FileText } from 'lucide-react';

/**
 * DocumentosTab - Aba de Documentos do Processo
 * Exibe documentos anexados: petições, sentenças, contratos, etc.
 */
function DocumentosTab({ documentos = [], setDocumentos = () => {} }) {
  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">📄 Documentos do Processo</h2>
            <p className="section-subtitle">Petições, sentenças, contratos e outros documentos</p>
          </div>
          <button className="btn btn-primary">
            <Plus size={18} />
            Upload Documento
          </button>
        </div>
        
        {documentos.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.3 }} />
            <p>Nenhum documento anexado</p>
            <p className="empty-state-hint">
              Faça upload de petições, sentenças, contratos e outros documentos relacionados ao processo
            </p>
          </div>
        ) : (
          <div className="documentos-grid">
            {documentos.map(doc => (
              <div key={doc.id} className="documento-card">
                <div className="documento-icon">
                  {doc.tipo === 'pdf' ? '📕' : doc.tipo === 'doc' ? '📘' : '📄'}
                </div>
                <div className="documento-info">
                  <div className="documento-nome">{doc.nome}</div>
                  <div className="documento-meta">
                    {doc.tipo_documento && <span className="doc-tipo">{doc.tipo_documento}</span>}
                    <span className="doc-data">{doc.data_upload}</span>
                    {doc.tamanho && <span className="doc-tamanho">{(doc.tamanho / 1024).toFixed(0)} KB</span>}
                  </div>
                </div>
                <div className="documento-actions">
                  <button className="btn-icon-small" title="Baixar">⬇️</button>
                  <button className="btn-icon-small" title="Excluir">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentosTab;
