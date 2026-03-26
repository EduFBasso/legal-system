import { useState, useCallback, useEffect, useRef } from 'react';
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

  // Contador para evitar sobrescrita de estado por respostas obsoletas (race condition / StrictMode)
  const loadPartiesRequestId = useRef(0);

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
    is_represented: false,
    representative_contact: null,
    representation_type: '',
  });

  // Dados de formulário para editar parte
  const [editingPartyFormData, setEditingPartyFormData] = useState({
    role: 'AUTOR',
    is_client: false,
    observacoes: '',
    is_represented: false,
    representative_contact: null,
    representation_type: '',
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
    };
    return labels[role] || role;
  };

  /**
   * Carregar partes do caso
   */
  const loadParties = useCallback(async () => {
    if (!id) return;

    const requestId = ++loadPartiesRequestId.current;
    setLoadingParties(true);
    try {
      const data = await casePartiesService.getPartiesByCase(id);
      if (requestId !== loadPartiesRequestId.current) return; // resposta obsoleta
      setParties(data);
    } catch (error) {
      if (requestId !== loadPartiesRequestId.current) return;
      console.error('Error loading parties:', error);
      showToast('Erro ao carregar partes do processo', 'error');
    } finally {
      if (requestId === loadPartiesRequestId.current) {
        setLoadingParties(false);
      }
    }
  }, [id, showToast]);

  // Quando o ID do caso muda, zera as partes exibidas e recarrega
  useEffect(() => {
    setParties([]);
    if (id) {
      loadParties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Salvar nova parte
   */
  const handleSaveParty = async (contact, loadContacts) => {
    if (!contact) {
      showToast('Selecione um contato primeiro', 'error');
      return;
    }

    try {
      // Regra de negócio: 1 cliente por processo.
      // Se já existe um cliente na lista de partes carregadas, não permitir marcar outro como cliente neste fluxo.
      const hasExistingClient = Array.isArray(parties)
        ? parties.some((p) => p?.is_client)
        : false;

      // Regra de negócio: 1 AUTOR por processo.
      const hasExistingAuthor = Array.isArray(parties)
        ? parties.some((p) => String(p?.role || '').toUpperCase() === 'AUTOR')
        : false;

      if (hasExistingAuthor && String(partyFormData.role || '').toUpperCase() === 'AUTOR') {
        showToast('Já existe um Autor/Requerente neste processo. Edite o Autor existente.', 'error', 7000);
        return;
      }

      const effectiveIsClient = hasExistingClient ? false : !!partyFormData.is_client;

      if (partyFormData.is_represented) {
        if (!partyFormData.representative_contact?.id) {
          showToast('Selecione o representante.', 'error', 7000);
          return;
        }
        if (!String(partyFormData.representation_type || '').trim()) {
          showToast('Informe o tipo de representação.', 'error', 7000);
          return;
        }
        if (Number(partyFormData.representative_contact.id) === Number(contact?.id)) {
          showToast('Representante não pode ser o mesmo contato da parte.', 'error', 7000);
          return;
        }
      }

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
          is_client: effectiveIsClient,
          observacoes: partyFormData.observacoes,
          is_represented: !!partyFormData.is_represented,
          representative_contact: partyFormData.representative_contact,
          representation_type: partyFormData.representation_type,
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
        is_client: effectiveIsClient,
        observacoes: partyFormData.observacoes,
        is_represented: !!partyFormData.is_represented,
        representative_contact: partyFormData.is_represented
          ? partyFormData.representative_contact?.id || null
          : null,
        representation_type: partyFormData.is_represented
          ? String(partyFormData.representation_type || '').trim()
          : '',
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
  const handleEditParty = (party, representations = []) => {
    const reprList = Array.isArray(representations) ? representations : [];
    const repr = party?.case && party?.contact
      ? reprList.find((r) => Number(r?.case) === Number(party.case) && Number(r?.represented_contact) === Number(party.contact))
      : null;

    setEditingParty(party);
    setEditingPartyFormData({
      role: party.role,
      is_client: party.is_client,
      observacoes: party.observacoes || '',
      is_represented: !!repr,
      representative_contact: repr
        ? {
          id: repr.representative_contact,
          name: repr.representative_contact_name,
        }
        : null,
      representation_type: repr?.representation_type || '',
    });
  };

  /**
   * Salvar alterações na parte
   */
  const handleSavePartyChanges = async (loadContacts) => {
    if (!editingParty) return;

    try {
      if (editingPartyFormData.is_represented) {
        if (!editingPartyFormData.representative_contact?.id) {
          showToast('Selecione o representante.', 'error', 7000);
          return;
        }
        if (!String(editingPartyFormData.representation_type || '').trim()) {
          showToast('Informe o tipo de representação.', 'error', 7000);
          return;
        }
        if (Number(editingPartyFormData.representative_contact.id) === Number(editingParty?.contact)) {
          showToast('Representante não pode ser o mesmo contato da parte.', 'error', 7000);
          return;
        }
      }

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
                is_represented: !!editingPartyFormData.is_represented,
                representative_contact: editingPartyFormData.representative_contact,
                representation_type: editingPartyFormData.representation_type,
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
        is_represented: !!editingPartyFormData.is_represented,
        representative_contact: editingPartyFormData.is_represented
          ? editingPartyFormData.representative_contact?.id || null
          : null,
        representation_type: editingPartyFormData.is_represented
          ? String(editingPartyFormData.representation_type || '').trim()
          : '',
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
      is_represented: false,
      representative_contact: null,
      representation_type: '',
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
