import { useMemo, useRef, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { Button } from '../common/Button';

/**
 * DocumentosTab - Aba de Documentos do Processo
 * Exibe documentos anexados: petições, sentenças, contratos, etc.
 */
function DocumentosTab({
  caseId,
  documentos = [],
  loading = false,
  uploading = false,
  onUploadDocument = () => {},
  onDeleteDocument = () => {},
}) {
  const fileInputRef = useRef(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  const documentsSafe = useMemo(() => (Array.isArray(documentos) ? documentos : []), [documentos]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatUploadDate = (dateValue) => {
    if (!dateValue) return '-';
    return new Date(dateValue).toLocaleDateString('pt-BR');
  };

  const handleOpenFilePicker = () => {
    if (!caseId || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    await onUploadDocument(file);
  };

  const handleDeleteDocument = async (docId, docName) => {
    const confirmed = window.confirm(`Deseja excluir o documento "${docName}"?`);
    if (!confirmed) return;

    setDeletingDocumentId(docId);
    try {
      await onDeleteDocument(docId);
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const openInSystemDefault = (doc) => {
    if (!doc?.file_url) return;

    // Open in separate tab to avoid disrupting current workflow.
    window.open(doc.file_url, '_blank', 'noopener,noreferrer');
  };

  const downloadDocument = async (doc) => {
    if (!doc?.file_url) return;

    try {
      const response = await fetch(doc.file_url, { credentials: 'include' });
      if (!response.ok) throw new Error('Falha ao baixar arquivo');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = doc.original_name || 'documento';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      URL.revokeObjectURL(objectUrl);
    } catch {
      const anchor = document.createElement('a');
      anchor.href = doc.file_url;
      anchor.download = doc.original_name || 'documento';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  };

  return (
    <div className="case-section">
      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">📄 Documentos do Processo</h2>
            <p className="section-subtitle">Petições, sentenças, contratos e outros documentos</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenFilePicker}
            disabled={!caseId || uploading}
            title={!caseId ? 'Salve o processo antes de anexar documentos' : 'Anexar documento'}
          >
            <Plus size={18} />
            {uploading ? 'Enviando...' : 'Upload Documento'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.xls,.xlsx,.doc,.docx"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando documentos...</p>
          </div>
        ) : documentsSafe.length === 0 ? (
          <EmptyState
            icon={FileText}
            iconStyle={{ opacity: 0.3 }}
            message="Nenhum documento anexado"
            hint="Faça upload de petições, sentenças, contratos e outros documentos relacionados ao processo"
          />
        ) : (
          <div className="documentos-grid">
            {documentsSafe.map((doc) => (
              <div
                key={doc.id}
                className="documento-card"
                onDoubleClick={() => openInSystemDefault(doc)}
                title="Duplo clique para abrir no aplicativo padrao"
              >
                <div className="documento-icon">
                  {doc.file_extension === 'pdf' ? '📕' : ['doc', 'docx'].includes(doc.file_extension) ? '📘' : '📄'}
                </div>
                <div className="documento-info">
                  <div className="documento-nome">{doc.original_name}</div>
                  <div className="documento-meta">
                    {doc.tipo_documento && <span className="doc-tipo">{doc.tipo_documento}</span>}
                    <span className="doc-data">{formatUploadDate(doc.uploaded_at)}</span>
                    {doc.file_size ? <span className="doc-tamanho">{formatFileSize(doc.file_size)}</span> : null}
                  </div>
                </div>
                <div className="documento-actions">
                  <Button
                    variant="success"
                    size="sm"
                    title="Abrir no aplicativo padrao do sistema"
                    onClick={(event) => {
                      event.stopPropagation();
                      openInSystemDefault(doc);
                    }}
                  >
                    Abrir
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    title="Download do arquivo"
                    onClick={(event) => {
                      event.stopPropagation();
                      downloadDocument(doc);
                    }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    title="Excluir"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteDocument(doc.id, doc.original_name);
                    }}
                    disabled={deletingDocumentId === doc.id}
                  >
                    {deletingDocumentId === doc.id ? 'Apagando...' : 'Apagar'}
                  </Button>
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
