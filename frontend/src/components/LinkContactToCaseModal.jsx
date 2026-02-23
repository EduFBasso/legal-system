// src/components/LinkContactToCaseModal.jsx
import { useState, useEffect } from 'react';
import casesService from '../services/casesService';
import { createParty } from '../services/casePartiesService';
import './LinkContactToCaseModal.css';

export default function LinkContactToCaseModal({ 
  isOpen, 
  onClose, 
  contactId, 
  contactName,
  onSuccess 
}) {
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [role, setRole] = useState('AUTOR');
  const [isClient, setIsClient] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load available cases
  useEffect(() => {
    if (isOpen) {
      loadCases();
    }
  }, [isOpen]);

  const loadCases = async () => {
    try {
      const data = await casesService.getAll();
      
      // Handle both paginated and non-paginated responses
      const casesList = data.results || data;
      
      setCases(Array.isArray(casesList) ? casesList : []);
    } catch (err) {
      console.error('[LinkContactToCaseModal] Error loading cases:', err);
      setError('Erro ao carregar processos: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCaseId) {
      setError('Selecione um processo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await createParty({
        case: selectedCaseId,
        contact: contactId,
        role: role,
        is_client: isClient,
      });

      onSuccess && onSuccess(data);
      onClose();
    } catch (err) {
      console.error('[LinkContactToCaseModal] Error linking contact:', err);
      setError(err.message || 'Erro ao vincular contato ao processo');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // Se escolher TESTEMUNHA, não pode ser cliente
    if (newRole === 'TESTEMUNHA') {
      setIsClient(false);
    }
  };

  // Filter cases based on search term
  const filteredCases = cases.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const numero = (c.numero_processo || '').toLowerCase();
    const assunto = (c.assunto || '').toLowerCase();
    return numero.includes(search) || assunto.includes(search);
  });

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
                    ? 'Nenhum processo encontrado'
                    : `${filteredCases.length} processo(s) encontrado(s)`
                  }
                </option>
                {filteredCases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.numero_processo} - {c.assunto || 'Sem assunto'}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Vínculo */}
            <div className="form-group">
              <label>
                Tipo de Vínculo <span className="required">*</span>
              </label>
              <div className="role-options">
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="AUTOR"
                    checked={role === 'AUTOR'}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  />
                  <span>Autor (Cliente)</span>
                </label>
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="REU"
                    checked={role === 'REU'}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  />
                  <span>Réu (Cliente)</span>
                </label>
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="TESTEMUNHA"
                    checked={role === 'TESTEMUNHA'}
                    onChange={(e) => handleRoleChange(e.target.value)}
                  />
                  <span>Testemunha (Não-cliente)</span>
                </label>
              </div>
            </div>

            {/* Cliente checkbox (desabilitado se TESTEMUNHA) */}
            {role !== 'TESTEMUNHA' && (
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isClient}
                    onChange={(e) => setIsClient(e.target.checked)}
                  />
                  <span>Este contato é cliente neste processo</span>
                </label>
              </div>
            )}

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
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading || !selectedCaseId}
              >
                {loading ? '⏳ Vinculando...' : '✅ Vincular'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
