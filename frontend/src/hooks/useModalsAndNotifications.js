import { useState, useCallback } from 'react';
import contactsService from '../services/contactsService';

/**
 * useModalsAndNotifications
 * Gerencia todos os modais, notificações e estado de contatos da página de detalhes de casos.
 * 
 * @param {function} onContactCreated - Callback quando um contato é criado
 * @param {function} onContactUpdated - Callback quando um contato é atualizado
 * @returns {Object} Estado e funções para gerenciar modais e notificações
 */
export function useModalsAndNotifications(onContactCreated, onContactUpdated) {
  // Toast/Notifications
  const [toast, setToast] = useState(null);

  // Contato modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);

  // Seleção de contato modal
  const [showSelectContactModal, setShowSelectContactModal] = useState(false);

  // Delete confirmation modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletePublicationToo, setDeletePublicationToo] = useState(false);

  // Contatos
  const [contacts, setContacts] = useState([]);

  /**
   * Exibir toast com mensagem padronizada
   */
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration });
    setTimeout(() => setToast(null), duration);
  }, []);

  /**
   * Carregar contatos quando necessário
   */
  const loadContacts = useCallback(async () => {
    try {
      const data = await contactsService.getAllContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      showToast('Erro ao carregar contatos', 'error');
    }
  }, [showToast]);

  /**
   * Handler para contato criado
   */
  const handleContactCreated = async () => {
    await loadContacts();
    
    // Só fechá se NÃO estiver em contexto de parties
    // Em parties, onLinkToProcess vai handle o flow
    if (onContactCreated) {
      onContactCreated();
    }
  };

  /**
   * Handler para contato atualizado
   */
  const handleContactUpdated = () => {
    setEditingContactId(null);
    if (onContactUpdated) {
      onContactUpdated();
    }
    showToast('Dados pessoais atualizados!', 'success');
  };

  return {
    // Toast
    toast,
    setToast,
    showToast,

    // Contact modal
    showContactModal,
    setShowContactModal,
    editingContactId,
    setEditingContactId,

    // Select contact modal
    showSelectContactModal,
    setShowSelectContactModal,

    // Delete confirmation modal
    showDeleteConfirmModal,
    setShowDeleteConfirmModal,
    deletePublicationToo,
    setDeletePublicationToo,

    // Contatos
    contacts,
    loadContacts,

    // Handlers
    handleContactCreated,
    handleContactUpdated,
  };
}

export default useModalsAndNotifications;
