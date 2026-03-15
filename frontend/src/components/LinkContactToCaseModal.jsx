// src/components/LinkContactToCaseModal.jsx
import { useState, useEffect } from 'react';
import casesService from '../services/casesService';
import './LinkContactToCaseModal.css';

export default function LinkContactToCaseModal({ 
  isOpen, 
  onClose, 
  contactId, 
  contactName,
  linkedCaseIds = [],
  onSuccess 
}) {
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [error, setError] = useState(null);

  async function loadCases() {
    try {
      const data = await casesService.getAll();
      
      // Handle both paginated and non-paginated responses
      const casesList = data.results || data;
      
      setCases(Array.isArray(casesList) ? casesList : []);
    } catch (err) {
      console.error('[LinkContactToCaseModal] Error loading cases:', err);
      setError('Erro ao carregar processos: ' + err.message);
    }
  }

  // Load available cases
  useEffect(() => {
    if (isOpen) {
      const timerId = window.setTimeout(() => {
        loadCases();
      }, 0);

      return () => window.clearTimeout(timerId);
    }

    return undefined;
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCaseId) {
      setError('Selecione um processo');
      return;
    }
    setError(null);

    try {
      const targetUrl = `/cases/${selectedCaseId}?tab=parties&action=link&contactId=${contactId}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      onSuccess && onSuccess({ caseId: Number(selectedCaseId), contactId });
      onClose();
      setSelectedCaseId('');
      setSearchTerm('');
    } catch (err) {
      console.error('[LinkContactToCaseModal] Error opening case detail:', err);
      setError(err.message || 'Erro ao abrir processo para vinculação');
    }
  };

  // Filter cases based on search term
  const filteredCases = cases.filter(c => {
    // Exclude cases where contact is already linked
    if (linkedCaseIds.includes(c.id)) {
      return false;
    }
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const numero = (c.numero_processo || '').toLowerCase();
    const assunto = (c.assunto || '').toLowerCase();
    return numero.includes(search) || assunto.includes(search);
  });

  // Get already linked cases for display
  const linkedCases = cases.filter(c => linkedCaseIds.includes(c.id));

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="link-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="link-modal-header">
          <h2>🔗 Vincular a Processo</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="link-modal-body">
          <div className="contact-info-box">
            <strong>Contato:</strong> {contactName}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Seleção de Processo */}
            <div className="form-group">
              <label htmlFor="case-search">
                Processo <span className="required">*</span>
              </label>
              
              {/* Campo de busca/filtro */}
              <input
                id="case-search"
                type="text"
                className="search-input"
                placeholder="🔍 Buscar por número ou assunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {/* Select com processos filtrados */}
              <select
                id="case-select"
                className="case-select"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                required
                size="5"
              >
                <option value="" disabled>
                  {filteredCases.length === 0 
                    ? (linkedCases.length > 0 ? 'Contato já vinculado em todos os processos' : 'Nenhum processo encontrado')
                    : `${filteredCases.length} processo(s) disponível(is)`
                  }
                </option>
                {filteredCases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.numero_processo} - {c.assunto || 'Sem assunto'}
                  </option>
                ))}
              </select>
              
              {/* Show already linked cases info */}
              {linkedCases.length > 0 && (
                <div className="linked-cases-info">
                  <p className="linked-cases-label">✅ Contato já vinculado em:</p>
                  {linkedCases.map(c => (
                    <span key={c.id} className="linked-case-badge">
                      {c.numero_processo}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="link-modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={!selectedCaseId}
              >
                Abrir processo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
