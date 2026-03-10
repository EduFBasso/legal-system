import { useState } from 'react';
import { Check, X } from 'lucide-react';

/**
 * TaskForm - Formulário inline para criar ou editar tarefas
 * 
 * Props:
 * - initialData: {titulo, descricao, data_vencimento} - dados iniciais
 * - onSave: (formData) => Promise - callback ao salvar
 * - onCancel: () => void - callback ao cancelar
 * - isLoading: boolean - estado de carregamento
 * - submitLabel: string - texto do botão de submit (padrão: "Salvar")
 */
export default function TaskForm({
  initialData = { titulo: '', descricao: '', data_vencimento: '' },
  onSave = async () => {},
  onCancel = () => {},
  isLoading = false,
  submitLabel = 'Salvar'
}) {
  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      alert('Título é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaving = isLoading || isSubmitting;
  const canSubmit = !isSaving && formData.titulo.trim();

  return (
    <div style={{
      padding: '0.75rem',
      background: '#2d3748',
      border: '1px solid #374151',
      borderRadius: '6px',
      marginBottom: '0.75rem'
    }}>
      {/* Título */}
      <input
        type="text"
        placeholder="Título da tarefa *"
        value={formData.titulo}
        onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #16a34a',
          borderRadius: '4px',
          fontSize: '1.05rem',
          marginBottom: '0.5rem',
          background: '#1f2937',
          color: '#f0f4f8',
          fontWeight: '500'
        }}
      />

      {/* Descrição */}
      <textarea
        placeholder="Descrição (opcional)"
        value={formData.descricao}
        onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
        rows={2}
        style={{
          width: '100%',
          padding: '0.5rem',
          border: '1px solid #16a34a',
          borderRadius: '4px',
          fontSize: '1rem',
          marginBottom: '0.5rem',
          resize: 'vertical',
          background: '#1f2937',
          color: '#f0f4f8',
          fontWeight: '500'
        }}
      />

      {/* Data Limite */}
      <div style={{ marginBottom: '0.5rem' }}>
        <input
          type="date"
          placeholder="Data de vencimento"
          value={formData.data_vencimento}
          onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #16a34a',
            borderRadius: '4px',
            fontSize: '0.975rem',
            background: '#1f2937',
            color: '#f0f4f8',
            fontWeight: '500'
          }}
        />
      </div>

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          disabled={isSaving}
          style={{
            border: '1px solid #16a34a',
            background: 'transparent',
            color: '#16a34a',
            borderRadius: '8px',
            padding: '0.375rem 0.75rem',
            fontSize: '0.8125rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
        >
          <X size={14} /> Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            border: 'none',
            background: '#16a34a',
            color: 'white',
            borderRadius: '8px',
            padding: '0.375rem 0.75rem',
            fontSize: '0.8125rem',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.6,
            transition: 'all 0.2s'
          }}
        >
          <Check size={14} /> {isSaving ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
