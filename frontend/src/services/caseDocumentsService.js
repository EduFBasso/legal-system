import { apiFetch, getApiBaseUrl } from '@/utils/apiFetch.js';

const API_BASE_URL = getApiBaseUrl();

const caseDocumentsService = {
  async getByCase(caseId) {
    return await apiFetch(`/case-documents/?case_id=${caseId}`);
  },

  async upload({ caseId, file, tipoDocumento = '', description = '' }) {
    const formData = new FormData();
    formData.append('case', String(caseId));
    formData.append('file', file);
    if (tipoDocumento) formData.append('tipo_documento', tipoDocumento);
    if (description) formData.append('description', description);

    const response = await fetch(`${API_BASE_URL}/case-documents/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData && typeof errorData === 'object') {
        const errors = Object.entries(errorData)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages.join(', ') : messages;
            return `${field}: ${msg}`;
          })
          .join('\n');
        throw new Error(errors || `API Error: ${response.status}`);
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  },

  async remove(documentId) {
    return await apiFetch(`/case-documents/${documentId}/`, {
      method: 'DELETE',
    });
  },
};

export default caseDocumentsService;
