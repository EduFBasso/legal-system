import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { caseTheme } from './caseTheme';
import { Button } from '../common/Button';
import { validateDueDateAtLeastTomorrow } from '../../utils/taskDueDateValidation';

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

    const dueDateValidation = validateDueDateAtLeastTomorrow(formData.data_vencimento);
    if (!dueDateValidation.ok) {
      alert(dueDateValidation.message);
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

  const labelStyle = {
    display: 'block',
    marginBottom: '0.3rem',
    color: '#374151',
    fontWeight: '600',
    fontSize: '0.875rem'
  };

  return (
    <div style={{
      padding: '0.75rem',
      background: caseTheme.taskInline.container,
      border: `1px solid ${caseTheme.darkBorder}`,
      borderRadius: '6px',
      marginBottom: '0.75rem',
    }}>
      {/* Título */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={labelStyle}>Título *</label>
        <input
          type="text"
          placeholder="Ex: Protocolar petição"
          value={formData.titulo}
          onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: `1px solid ${caseTheme.darkBorder}`,
            borderRadius: '4px',
            fontSize: '1.05rem',
            background: caseTheme.form.input.background,
            color: '#1F2937',
            fontWeight: '500',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Descrição */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={labelStyle}>Descrição (opcional)</label>
        <textarea
          placeholder="Detalhes da tarefa..."
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          rows={2}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: `1px solid ${caseTheme.darkBorder}`,
            borderRadius: '4px',
            fontSize: '1rem',
            resize: 'vertical',
            background: caseTheme.form.input.background,
            color: '#1F2937',
            fontWeight: '500',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Data de Vencimento */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label style={labelStyle}>Data de vencimento</label>
        <div style={{
          marginBottom: '0.35rem',
          color: '#6B7280',
          fontSize: '0.8125rem'
        }}>
          Toque para selecionar uma data
        </div>
        <div style={{ display: 'flex' }}>
          <input
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '0.5rem',
              border: `1px solid ${caseTheme.darkBorder}`,
              borderRadius: '4px',
              fontSize: '0.975rem',
              background: caseTheme.form.input.background,
              color: '#1F2937',
              fontWeight: '500',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <Button variant="secondary" size="xs" onClick={onCancel} disabled={isSaving}>
          <X size={14} /> Cancelar
        </Button>
        <Button variant="success" size="xs" onClick={handleSubmit} disabled={!canSubmit}>
          <Check size={14} /> {isSaving ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
