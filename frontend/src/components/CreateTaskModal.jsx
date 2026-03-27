import { useState, useEffect } from 'react';
import './CreateTaskModal.css';
import { validateDueDateAtLeastTomorrow } from '../utils/taskDueDateValidation';

/**
 * CreateTaskModal - Modal para criar tarefas do processo (Tipo 2)
 * 
 * Características:
 * - Campos: Título*, Descrição, Data de Vencimento*
 * - Urgência: CALCULADA AUTOMATICAMENTE baseada na data
 *   - CRÍTICA (≤3 dias)
 *   - URGENTE (4-7 dias)
 *   - NORMAL (>7 dias)
 * - Info de urgência é exibida em tempo real ao digitar data
 * - Layout simples e focado
 */
export default function CreateTaskModal({ isOpen, caseId, onClose, onCreateTask }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: '',
    hora_vencimento: '',
  });
  
  const [calculatedUrgency, setCalculatedUrgency] = useState('NORMAL');
  const [loading, setLoading] = useState(false);

  /**
   * Calcula urgência automaticamente baseado em dias restantes
   * Retorna: URGENTISSIMO (≤3d), URGENTE (4-7d), NORMAL (>7d)
   */
  const calculateUrgency = (dataVencimento) => {
    if (!dataVencimento) return 'NORMAL';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(`${dataVencimento}T00:00:00`);
    dueDate.setHours(0, 0, 0, 0);
    
    const daysRemaining = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 3) return 'URGENTISSIMO';
    if (daysRemaining <= 7) return 'URGENTE';
    return 'NORMAL';
  };

  // Atualizar urgência automaticamente quando data muda
  useEffect(() => {
    if (formData.data_vencimento) {
      setCalculatedUrgency(calculateUrgency(formData.data_vencimento));
    }
  }, [formData.data_vencimento]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const normalizeTimeHHmm = (timeValue) => {
    const value = (timeValue || '').toString().trim();
    if (!value) return '';

    const match = value.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
    if (!match) return value;

    const hh = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo.trim()) {
      alert('Título da tarefa é obrigatório');
      return;
    }
    
    const dueDateValidation = validateDueDateAtLeastTomorrow(formData.data_vencimento);
    if (!dueDateValidation.ok) {
      alert(dueDateValidation.message);
      return;
    }
    
    setLoading(true);
    try {
      const normalizedHora = normalizeTimeHHmm(formData.hora_vencimento);
      await onCreateTask({
        ...formData,
        case: caseId,
        status: 'PENDENTE',
        movimentacao: null, // Tipo 2: sem movimentação
        hora_vencimento: normalizedHora || null,
      });
      
      // Reset form
      setFormData({ titulo: '', descricao: '', data_vencimento: '', hora_vencimento: '' });
      setCalculatedUrgency('NORMAL');
      onClose();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      alert('Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Configuração de cores por urgência
  const urgencyConfig = {
    URGENTISSIMO: {
      bg: '#fef2f2',
      border: '#fca5a5',
      text: '#dc2626',
      label: '🔴 CRÍTICA (≤3 dias)'
    },
    URGENTE: {
      bg: '#fff7ed',
      border: '#fbcf8f',
      text: '#f97316',
      label: '⏰ URGENTE (4-7 dias)'
    },
    NORMAL: {
      bg: '#ecfdf5',
      border: '#86efac',
      text: '#10b981',
      label: '✅ NORMAL (>7 dias)'
    },
  };

  const urgencyStyle = urgencyConfig[calculatedUrgency];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Tarefa do Processo</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="create-task-form">
          {/* Título */}
          <div className="form-group">
            <label htmlFor="titulo">Título *</label>
            <input
              id="titulo"
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleInputChange}
              placeholder="Ex: Preparar defesa, Análise contratual, Reunião com cliente..."
              disabled={loading}
              required
            />
          </div>

          {/* Descrição */}
          <div className="form-group">
            <label htmlFor="descricao">Descrição</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              placeholder="Detalhe adicional (opcional)"
              rows="3"
              disabled={loading}
            />
          </div>

          {/* Data de Vencimento */}
          <div className="form-group">
            <label htmlFor="data_vencimento">Data de Vencimento *</label>
            <input
              id="data_vencimento"
              type="date"
              name="data_vencimento"
              value={formData.data_vencimento}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          {/* Hora (opcional) */}
          <div className="form-group">
            <label htmlFor="hora_vencimento">Hora (opcional)</label>
            <input
              id="hora_vencimento"
              type="time"
              name="hora_vencimento"
              value={formData.hora_vencimento}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Urgência - Exibida automaticamente */}
          {formData.data_vencimento && (
            <div 
              className="urgency-badge"
              style={{
                background: urgencyStyle.bg,
                borderColor: urgencyStyle.border,
                color: urgencyStyle.text,
              }}
            >
              {urgencyStyle.label}
            </div>
          )}

          {/* Botões */}
          <div className="form-actions">
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
              className="btn-create"
              disabled={loading || !formData.titulo.trim() || !formData.data_vencimento}
            >
              {loading ? '⏳ Criando...' : '✓ Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
