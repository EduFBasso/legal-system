import { useState, useEffect, useCallback } from 'react';
import casesService from '../services/casesService';
import publicationsService from '../services/publicationsService';
import { notifyPublicationSync } from '../services/publicationSync';
import { useSettings } from '../contexts/SettingsContext';

/**
 * useCaseCore
 * Gerencia o estado central do caso: dados, formulário, edição e persistência.
 * 
 * @param {number} id - ID do caso (pode ser null para novo caso)
 * @param {string} publicationId - ID de publicação para pré-preenchimento
 * @param {Object} systemSettings - Configurações do sistema
 * @param {function} showToast - Função para exibir notificações
 * @param {function} onCaseCreated - Callback quando caso é criado
 * @param {function} onCaseDeleted - Callback quando caso é deletado
 * @returns {Object} Estado e funções para gerenciar o caso
 */
export function useCaseCore(
  id,
  publicationId,
  systemSettings,
  showToast,
  onCaseCreated,
  onCaseDeleted,
) {
  const { settings: _settings } = useSettings();

  // Estado principal do caso
  const [caseData, setCaseData] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(!id); // Novo caso = modo edição
  const [loading, setLoading] = useState(!!id); // Só carrega se tem ID
  const [saving, setSaving] = useState(false);

  // Publicação de origem (para pré-preenchimento)
  const [sourcePublication, setSourcePublication] = useState(null);

  // Opções dos selects
  const tribunalOptions = [
    { value: 'TJSP', label: 'TJSP - Tribunal de Justiça de São Paulo' },
    { value: 'TJRJ', label: 'TJRJ - Tribunal de Justiça do Rio de Janeiro' },
    { value: 'TJMG', label: 'TJMG - Tribunal de Justiça de Minas Gerais' },
    { value: 'TRF1', label: 'TRF1 - Tribunal Regional Federal da 1ª Região' },
    { value: 'TRF2', label: 'TRF2 - Tribunal Regional Federal da 2ª Região' },
    { value: 'TRF3', label: 'TRF3 - Tribunal Regional Federal da 3ª Região' },
    { value: 'TRT2', label: 'TRT2 - Tribunal Regional do Trabalho da 2ª Região' },
    { value: 'TRT15', label: 'TRT15 - Tribunal Regional do Trabalho da 15ª Região' },
    { value: 'STJ', label: 'STJ - Superior Tribunal de Justiça' },
    { value: 'STF', label: 'STF - Supremo Tribunal Federal' },
    { value: 'TST', label: 'TST - Tribunal Superior do Trabalho' },
  ];

  const statusOptions = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'ARQUIVADO', label: 'Arquivado' },
    { value: 'ENCERRADO', label: 'Encerrado' },
  ];

  const defaultTipoAcaoOptions = [
    { value: '', label: 'Selecione...' },
    { value: 'CIVEL', label: 'Cível' },
    { value: 'CRIMINAL', label: 'Criminal' },
    { value: 'TRABALHISTA', label: 'Trabalhista' },
    { value: 'TRIBUTARIA', label: 'Tributária' },
    { value: 'FAMILIA', label: 'Família' },
    { value: 'CONSUMIDOR', label: 'Consumidor' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  const [tipoAcaoOptions, setTipoAcaoOptions] = useState(defaultTipoAcaoOptions);

  const loadTipoAcaoOptions = useCallback(async () => {
    try {
      const options = await casesService.getTipoAcaoOptions();
      if (Array.isArray(options) && options.length > 0) {
        setTipoAcaoOptions(options);
      }
    } catch (error) {
      // Fallback silencioso para defaults (ex: offline)
      console.warn('Error loading tipo_acao options:', error);
    }
  }, []);

  const createTipoAcaoOption = useCallback(async (label) => {
    const created = await casesService.createTipoAcaoOption(label);
    if (created && typeof created === 'object') {
      setTipoAcaoOptions((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const exists = next.some((opt) => String(opt?.value) === String(created.value));
        if (!exists) next.push(created);
        return next;
      });
    }
    return created;
  }, []);

  const updateTipoAcaoOption = useCallback(async (idToUpdate, label) => {
    try {
      const updated = await casesService.updateTipoAcaoOption(idToUpdate, label);
      if (updated && typeof updated === 'object') {
        setTipoAcaoOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const index = next.findIndex((opt) => Number(opt?.id) === Number(updated.id));
          if (index >= 0) {
            next[index] = { ...next[index], ...updated };
            return next;
          }
          // Fallback: se não encontrou por id (opções antigas), tenta por value/label
          const byValue = next.findIndex((opt) => String(opt?.value) === String(updated.value));
          if (byValue >= 0) {
            next[byValue] = { ...next[byValue], ...updated };
            return next;
          }
          return [...next, updated];
        });
      }
      return updated;
    } catch (error) {
      showToast?.(error?.message || 'Erro ao editar Tipo de Ação', 'error');
      return null;
    }
  }, [showToast]);

  /**
   * Carregar dados do caso
   */
  const loadCaseData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await casesService.getById(id);
      setCaseData(data);
      setFormData(data);
    } catch (error) {
      console.error('Error loading case:', error);
      showToast('Erro ao carregar processo', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  useEffect(() => {
    loadTipoAcaoOptions();
  }, [loadTipoAcaoOptions]);

  /**
   * Pré-preenchimento via publicação
   */
  useEffect(() => {
    const loadPublicationPrefill = async () => {
      if (id || !publicationId) return;

      try {
        const result = await publicationsService.getPublicationById(publicationId);
        const publication = result?.publication;
        if (!publication) return;
        setSourcePublication(publication);

        setFormData((prev) => {
          return {
            ...prev,
            numero_processo: prev.numero_processo || publication.numero_processo || '',
            tribunal: prev.tribunal || publication.tribunal || '',
            vara: prev.vara || publication.orgao || '',
            publicacao_origem: publication.id,
            publicacao_origem_id_api: publication.id_api || null,
            publicacao_origem_data: publication.data_disponibilizacao,
            publicacao_origem_tipo: publication.tipo_comunicacao,
          };
        });
      } catch (error) {
        console.error('Error loading publication prefill:', error);
        showToast('Não foi possível carregar os dados da publicação para pré-preenchimento', 'warning');
      }
    };

    loadPublicationPrefill();
  }, [id, publicationId, showToast]);

  /**
   * Atualizar título da aba
   */
  useEffect(() => {
    if (caseData?.numero_processo) {
      document.title = `Proc.: ${caseData.numero_processo_formatted || caseData.numero_processo}`;
    } else if (!id) {
      document.title = 'Novo Processo - Sistema Jurídico';
    }
    
    return () => {
      document.title = 'Sistema Jurídico';
    };
  }, [caseData, id]);

  /**
   * Mudança de campo do formulário
   */
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Salvar caso
   */
  const handleSave = async (parties = []) => {
    try {
      setSaving(true);

      const dataToSave = {
        ...formData,
      };

      // Limpar valores vazios
      const cleanedData = {};
      Object.entries(dataToSave).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      // Robustez: se o processo foi aberto via ?pub_id= mas o prefill ainda não carregou,
      // garantir que o FK `publicacao_origem` seja enviado no create.
      // Isso evita perder a rastreabilidade (e a UI de origem em Observações).
      let originPublicationMeta = null;
      if (!id && publicationId && !cleanedData.publicacao_origem) {
        try {
          const result = await publicationsService.getPublicationById(publicationId);
          const publication = result?.publication;
          if (publication?.id) {
            cleanedData.publicacao_origem = publication.id;
            originPublicationMeta = {
              publicacao_origem: publication.id,
              publicacao_origem_id_api: publication.id_api || publicationId || null,
              publicacao_origem_data: publication.data_disponibilizacao || null,
              publicacao_origem_tipo: publication.tipo_comunicacao || null,
              publicacao_origem_numero_processo: publication.numero_processo || null,
            };
          }
        } catch (error) {
          console.warn('Falha ao carregar publicação para preencher publicacao_origem:', error);
        }
      }

      if (!originPublicationMeta && formData.publicacao_origem) {
        originPublicationMeta = {
          publicacao_origem: formData.publicacao_origem,
          publicacao_origem_id_api: formData.publicacao_origem_id_api || publicationId || null,
          publicacao_origem_data: formData.publicacao_origem_data || null,
          publicacao_origem_tipo: formData.publicacao_origem_tipo || null,
          publicacao_origem_numero_processo: formData.publicacao_origem_numero_processo || null,
        };
      }

      if (!id) {
        // Criar novo caso
        const created = await casesService.create(cleanedData);

        let failedParties = 0;
        for (const party of parties) {
          try {
            const { default: casePartiesService } = await import('../services/casePartiesService');
            await casePartiesService.createParty({
              case: created.id,
              contact: party.contact,
              role: party.role,
              is_client: !!party.is_client,
              observacoes: party.observacoes || '',
            });
          } catch (partyError) {
            failedParties += 1;
            console.error('Error creating party after case creation:', partyError);
          }
        }

        const pubId = sourcePublication?.id_api || publicationId;
        const shouldCreateMovementBySystemSetting = systemSettings?.AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION !== false;

        if (pubId) {
          // REGRA DE NEGÓCIO:
          // Se o processo foi criado a partir de uma publicação (via ?pub_id=),
          // essa publicação deve ser vinculada ao processo.
          try {
            // Para publicação de origem, sempre garantir criação de movimentação.
            const createMovementRequested = true;

            const integrationResult = await publicationsService.integratePublication(pubId, {
              caseId: created.id,
              createMovement: createMovementRequested,
            });

            // Caso o backend não crie a movimentação (ou se estiver desligado por setting),
            // fazer fallback explícito para garantir que apareça em Movimentações.
            if (
              createMovementRequested
              && (integrationResult?.movement_created !== true || shouldCreateMovementBySystemSetting === false)
            ) {
              try {
                await publicationsService.createMovementFromPublication(pubId);
              } catch (fallbackError) {
                console.warn('Fallback de criação de movimentação falhou:', fallbackError);
              }
            }

            notifyPublicationSync({
              type: 'PUBLICATION_INTEGRATED',
              idApi: Number(pubId),
              caseId: created.id,
            });
          } catch (integrationError) {
            console.error('Error integrating source publication:', integrationError);
            showToast('Processo criado, mas houve falha ao vincular a publicação de origem', 'warning');
          }
        }

        const createdWithOrigin = {
          ...created,
          publicacao_origem: created?.publicacao_origem ?? originPublicationMeta?.publicacao_origem ?? null,
          publicacao_origem_id_api: created?.publicacao_origem_id_api ?? originPublicationMeta?.publicacao_origem_id_api ?? null,
          publicacao_origem_data: created?.publicacao_origem_data ?? originPublicationMeta?.publicacao_origem_data ?? null,
          publicacao_origem_tipo: created?.publicacao_origem_tipo ?? originPublicationMeta?.publicacao_origem_tipo ?? null,
          publicacao_origem_numero_processo:
            created?.publicacao_origem_numero_processo ?? originPublicationMeta?.publicacao_origem_numero_processo ?? null,
        };

        setCaseData(createdWithOrigin);
        setFormData(createdWithOrigin);
        setIsEditing(false);

        if (onCaseCreated) {
          onCaseCreated(created.id, failedParties);
        }

        if (failedParties > 0) {
          showToast(`Processo criado! ${failedParties} parte(s) não foram vinculadas`, 'warning');
        } else {
          showToast('Processo criado com sucesso!', 'success');
        }

        return created;
      }

      // Atualizar caso existente
      const updated = await casesService.update(id, cleanedData);
      setCaseData(updated);
      setFormData(updated);
      setIsEditing(false);
      showToast('Processo atualizado com sucesso!', 'success');

      return updated;
    } catch (error) {
      console.error('Error saving case:', error);
      showToast('Erro ao atualizar processo', 'error');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancelar edição
   */
  const handleCancel = () => {
    if (!id) {
      window.close();
      return;
    }

    setFormData(caseData);
    setIsEditing(false);
  };

  /**
   * Deletar caso
   */
  const handleDelete = async (deletePublicationToo = false) => {
    try {
      await casesService.delete(id, 'Deleted via UI', deletePublicationToo);
      window.dispatchEvent(new Event('publicationsSearchCompleted'));
      showToast('Processo deletado com sucesso!', 'success');
      
      if (onCaseDeleted) {
        onCaseDeleted();
      }

      return true;
    } catch (error) {
      console.error('Error deleting case:', error);
      showToast('Erro ao deletar processo', 'error');
      throw error;
    }
  };

  return {
    // Estado
    caseData,
    formData,
    setFormData,
    isEditing,
    setIsEditing,
    loading,
    saving,
    sourcePublication,

    // Opções
    tribunalOptions,
    statusOptions,
    tipoAcaoOptions,
    createTipoAcaoOption,
    updateTipoAcaoOption,

    // Funções
    handleInputChange,
    handleSave,
    handleCancel,
    handleDelete,
    loadCaseData,
  };
}

export default useCaseCore;
