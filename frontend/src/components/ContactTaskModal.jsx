import { useEffect, useMemo, useState } from 'react';

import ContactDetailModal from './ContactDetailModal';
import SelectContactModal from './SelectContactModal';
import { Button } from './common/Button';

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
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [viewContactId, setViewContactId] = useState(null);
  const [isViewContactOpen, setIsViewContactOpen] = useState(false);

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

  useEffect(() => {
    if (!isOpen) setIsCreateContactOpen(false);
  }, [isOpen]);

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
      <div className="modal-overlay modal-overlay--contact-task" onClick={onClose}>
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
                <Button
                  type="button"
                  variant="success"
                  size="md"
                  onClick={() => setIsSelectContactOpen(true)}
                  disabled={loading}
                  style={{ width: 'auto' }}
                >
                  Selecionar
                </Button>
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
              <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="success" size="md" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
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
        onCreateNew={() => {
          setIsCreateContactOpen(true);
        }}
        onViewContact={(contactId) => {
          setViewContactId(contactId);
          setIsViewContactOpen(true);
        }}
      />

      <ContactDetailModal
        contactId={viewContactId}
        isOpen={isViewContactOpen}
        onClose={() => setIsViewContactOpen(false)}
        onContactUpdated={() => {
          // If user edits the contact name, refresh the selected label if it's the same contact
          // (We keep it simple: if current selected contact matches, re-open selector to refetch list)
          if (formData.contact === viewContactId) {
            setIsSelectContactOpen(true);
          }
        }}
        allowModification={true}
        showLinkToProcessButton={false}
        onLinkToCase={null}
        onLinkToProcess={null}
        modalOverlayClassName="modal-overlay--disable-case-links"
      />

      <ContactDetailModal
        contactId={null}
        isOpen={isCreateContactOpen}
        onClose={() => setIsCreateContactOpen(false)}
        onContactUpdated={(createdContact) => {
          if (createdContact?.id) {
            setFormData((prev) => ({
              ...prev,
              contact: createdContact.id,
              contact_name: createdContact.name,
            }));
          }
          setIsCreateContactOpen(false);
          setIsSelectContactOpen(false);
        }}
        showLinkToProcessButton={false}
      />
    </>
  );
}
