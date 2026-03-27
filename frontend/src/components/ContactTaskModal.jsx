import { useEffect, useMemo, useState } from 'react';

import SelectContactModal from './SelectContactModal';

import './CreateTaskModal.css';

const EMPTY_FORM = {
  contact: null,
  contact_name: '',
  titulo: '',
  descricao: '',
  data_vencimento: '',
};

export default function ContactTaskModal({ isOpen, mode = 'create', initialData = null, onClose, onSubmit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [isSelectContactOpen, setIsSelectContactOpen] = useState(false);

  const modalTitle = useMemo(() => {
    if (mode === 'edit') return 'Editar Tarefa de Pessoa';
    return 'Criar Tarefa de Pessoa';
  }, [mode]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialData) {
      setFormData({
        contact: initialData.contact ?? null,
        contact_name: initialData.contact_name ?? '',
        titulo: initialData.titulo ?? '',
        descricao: initialData.descricao ?? '',
        data_vencimento: initialData.data_vencimento ?? '',
      });
      return;
    }

    setFormData(EMPTY_FORM);
  }, [isOpen, mode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.contact) {
      alert('Selecione um contato');
      return;
    }

    if (!formData.titulo.trim()) {
      alert('Título da tarefa é obrigatório');
      return;
    }

    if (!formData.data_vencimento) {
      alert('Data de vencimento é obrigatória');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        contact: formData.contact,
        titulo: formData.titulo,
        descricao: formData.descricao,
        data_vencimento: formData.data_vencimento,
        status: 'PENDENTE',
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tarefa de pessoa:', error);
      alert('Erro ao salvar tarefa');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content create-task-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{modalTitle}</h2>
            <button className="modal-close" onClick={onClose} type="button">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="create-task-form">
            <div className="form-group">
              <label>Contato *</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={formData.contact_name || ''}
                  placeholder="Selecione um contato..."
                  readOnly
                  disabled={loading}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  className="create-task-submit"
                  onClick={() => setIsSelectContactOpen(true)}
                  disabled={loading}
                  style={{ width: 'auto' }}
                >
                  Selecionar
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact_task_titulo">Título *</label>
              <input
                id="contact_task_titulo"
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Agendar reunião, Solicitar documentos..."
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_task_descricao">Descrição</label>
              <textarea
                id="contact_task_descricao"
                name="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Detalhes da tarefa..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_task_data_vencimento">Data de vencimento *</label>
              <input
                id="contact_task_data_vencimento"
                type="date"
                name="data_vencimento"
                value={formData.data_vencimento}
                onChange={(e) => setFormData((prev) => ({ ...prev, data_vencimento: e.target.value }))}
                disabled={loading}
                required
              />
            </div>

            <div className="create-task-actions">
              <button className="create-task-cancel" type="button" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button className="create-task-submit" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SelectContactModal
        isOpen={isSelectContactOpen}
        onClose={() => setIsSelectContactOpen(false)}
        onSelectContact={(contact) => {
          setFormData((prev) => ({
            ...prev,
            contact: contact.id,
            contact_name: contact.name,
          }));
          setIsSelectContactOpen(false);
        }}
        onCreateNew={null}
      />
    </>
  );
}
