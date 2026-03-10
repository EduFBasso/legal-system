import { useState, useCallback } from 'react';
import casePartiesService from '../services/casePartiesService';

/**
 * usePartyManagement
 * Gerencia o CRUD completo de partes do caso: adicionar, editar, remover, modais.
 * 
 * @param {number} id - ID do caso
 * @param {function} showToast - Função para exibir notificações
 * @param {Array} initialParties - Parties iniciais (opcional)
 * @returns {Object} Estado e funções para gerenciar partes
 */
export function usePartyManagement(id, showToast, initialParties = []) {
  // Estado de partes
  const [parties, setParties] = useState(initialParties);
  const [loadingParties, setLoadingParties] = useState(false);

  // Modal de adicionar parte
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Modal de editar papel (role)
  const [editingParty, setEditingParty] = useState(null);

  // Dados de formulário para adicionar parte
  const [partyFormData, setPartyFormData] = useState({
    role: 'AUTOR',
    is_client: false,
    observacoes: '',
  });

  // Dados de formulário para editar parte
  const [editingPartyFormData, setEditingPartyFormData] = useState({
    role: 'AUTOR',
    is_client: false,
    observacoes: '',
  });

  /**
   * Mapa de papel para exibição
   */
  const getRoleDisplay = (role) => {
    const labels = {
      AUTOR: 'Autor/Requerente',
      REU: 'Réu/Requerido',
      TESTEMUNHA: 'Testemunha',
      PERITO: 'Perito',
      TERCEIRO: 'Terceiro Interessado',
      CLIENTE: 'Cliente/Representado',
    };
    return labels[role] || role;
  };

  /**
   * Carregar partes do caso
   */
  const loadParties = useCallback(async () => {
    if (!id) return;
    
    setLoadingParties(true);
    try {
      const data = await casePartiesService.getPartiesByCase(id);
      setParties(data);
    } catch (error) {
      console.error('Error loading parties:', error);
      showToast('Erro ao carregar partes do processo', 'error');
    } finally {
      setLoadingParties(false);
    }
  }, [id, showToast]);

  /**
   * Salvar nova parte
   */
  const handleSaveParty = async (contact, loadContacts) => {
    if (!contact) {
      showToast('Selecione um contato primeiro', 'error');
      return;
    }

    try {
      if (!id) {
        // Draft mode - não está conectado ao backend
        const draftId = `draft-${Date.now()}-${contact.id}`;
        const draftParty = {
          id: draftId,
          contact: contact.id,
          contact_name: contact.name,
          contact_person_type: contact.person_type,
          contact_document: contact.document_number,
          contact_phone: contact.phone,
          contact_email: contact.email,
          role: partyFormData.role,
          role_display: getRoleDisplay(partyFormData.role),
          is_client: partyFormData.is_client,
          observacoes: partyFormData.observacoes,
          is_draft: true,
        };

        setParties((prev) => {
          const withoutSameContact = prev.filter((p) => p.contact !== contact.id);
          if (draftParty.is_client) {
            return [...withoutSameContact.map((p) => ({ ...p, is_client: false })), draftParty];
          }
          return [...withoutSameContact, draftParty];
        });

        showToast('Parte adicionada ao rascunho do processo', 'success');
        handleCloseAddPartyModal();
        return;
      }

      // Criar parte no backend
      await casePartiesService.createParty({
        case: parseInt(id),
        contact: contact.id,
        role: partyFormData.role,
        is_client: partyFormData.is_client,
        observacoes: partyFormData.observacoes,
      });

      showToast('Parte adicionada com sucesso!', 'success');
      handleCloseAddPartyModal();
      
      // Reload parties e contatos
      await loadParties();
      if (loadContacts) {
        await loadContacts();
      }
    } catch (error) {
      console.error('Error saving party:', error);
      
      if (error.message && error.message.includes('is_client')) {
        const message = error.message.replace('is_client: ', '');
        showToast(message, 'error', 7000);
        setPartyFormData((prev) => ({
          ...prev,
          is_client: false,
        }));
      } else {
        showToast('Erro ao adicionar parte', 'error', 7000);
      }
    }
  };

  /**
   * Remover parte
   */
  const handleRemoveParty = async (partyId, partyName, loadContacts) => {
    if (!window.confirm(`Remover ${partyName} deste processo?`)) return;

    try {
      if (!id) {
        setParties((prev) => prev.filter((party) => party.id !== partyId));
        showToast('Parte removida do rascunho', 'success');
        return;
      }

      await casePartiesService.deleteParty(partyId);
      showToast('Parte removida do processo', 'success');
      
      // Reload parties e contatos
      await loadParties();
      if (loadContacts) {
        await loadContacts();
      }
    } catch (error) {
      console.error('Error removing party:', error);
      showToast('Erro ao remover parte', 'error');
    }
  };

  /**
   * Abrir edição de parte
   */
  const handleEditParty = (party) => {
    setEditingParty(party);
    setEditingPartyFormData({
      role: party.role,
      is_client: party.is_client,
      observacoes: party.observacoes || '',
    });
  };

  /**
   * Salvar alterações na parte
   */
  const handleSavePartyChanges = async (loadContacts) => {
    if (!editingParty) return;

    try {
      if (!id) {
        setParties((prev) =>
          prev
            .map((party) => {
              if (party.id !== editingParty.id) return party;
              return {
                ...party,
                role: editingPartyFormData.role,
                role_display: getRoleDisplay(editingPartyFormData.role),
                is_client: editingPartyFormData.is_client,
                observacoes: editingPartyFormData.observacoes,
              };
            })
            .map((party) => {
              if (editingPartyFormData.is_client && party.id !== editingParty.id) {
                return { ...party, is_client: false };
              }
              return party;
            })
        );

        showToast('Papel da parte atualizado no rascunho!', 'success');
        setEditingParty(null);
        return;
      }

      const payload = {
        case: editingParty.case,
        contact: editingParty.contact,
        role: editingPartyFormData.role,
        is_client: editingPartyFormData.is_client,
        observacoes: editingPartyFormData.observacoes,
      };

      await casePartiesService.updateParty(editingParty.id, payload);
      showToast('Papel da parte atualizado com sucesso!', 'success');
      setEditingParty(null);
      
      // Reload parties e contatos
      await loadParties();
      if (loadContacts) {
        await loadContacts();
      }
    } catch (error) {
      console.error('Error updating party:', error);
      
      if (error.message && error.message.includes('is_client')) {
        const message = error.message.replace('is_client: ', '');
        showToast(message, 'error', 7000);
        setEditingPartyFormData((prev) => ({
          ...prev,
          is_client: false,
        }));
      } else {
        showToast('Erro ao atualizar papel da parte', 'error', 7000);
      }
    }
  };

  /**
   * Fechar modal de adicionar parte
   */
  const handleCloseAddPartyModal = () => {
    setShowAddPartyModal(false);
    setSelectedContact(null);
    setPartyFormData({
      role: 'AUTOR',
      is_client: false,
      observacoes: '',
    });
  };

  return {
    // Estado
    parties,
    setParties,
    loadingParties,
    showAddPartyModal,
    setShowAddPartyModal,
    selectedContact,
    setSelectedContact,
    editingParty,
    setEditingParty,
    partyFormData,
    setPartyFormData,
    editingPartyFormData,
    setEditingPartyFormData,

    // Funções
    getRoleDisplay,
    loadParties,
    handleSaveParty,
    handleRemoveParty,
    handleEditParty,
    handleSavePartyChanges,
    handleCloseAddPartyModal,
  };
}

export default usePartyManagement;
