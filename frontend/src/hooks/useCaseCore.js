import { useState, useEffect, useCallback } from 'react';
import casesService from '../services/casesService';
import { notifyCaseSync } from '../services/caseSyncService';
import publicationsService from '../services/publicationsService';
import { notifyPublicationSync } from '../services/publicationSync';

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
  // Estado principal do caso
  const [caseData, setCaseData] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(!id); // Novo caso = modo edição
  const [loading, setLoading] = useState(!!id); // Só carrega se tem ID
  const [saving, setSaving] = useState(false);
  const [fieldValidationErrors, setFieldValidationErrors] = useState({});

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

  const [tituloOptions, setTituloOptions] = useState([]);
  const [vinculoTipoOptions, setVinculoTipoOptions] = useState([]);

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

  const loadTituloOptions = useCallback(async () => {
    try {
      const options = await casesService.getTituloOptions();
      if (Array.isArray(options) && options.length > 0) {
        setTituloOptions(options);
      }
    } catch (error) {
      // Fallback silencioso (ex: offline)
      console.warn('Error loading titulo options:', error);
    }
  }, []);

  const loadVinculoTipoOptions = useCallback(async () => {
    try {
      const options = await casesService.getVinculoTipoOptions();
      if (Array.isArray(options) && options.length > 0) {
        const normalized = options
          .map((opt) => ({
            ...opt,
            value: String(opt?.value || opt?.label || '').trim(),
            label: String(opt?.label || opt?.value || '').trim(),
          }))
          .filter((opt) => opt.value && opt.label);
        setVinculoTipoOptions(normalized);
      }
    } catch (error) {
      console.warn('Error loading vinculo_tipo options:', error);
    }
  }, []);

  const searchTituloOptions = useCallback(async (q) => {
    // Busca remota (server-side) para listas grandes.
    // Não mexe no state global automaticamente para evitar “piscar” a lista base.
    return await casesService.getTituloOptions(q);
  }, []);

  const createTituloOption = useCallback(async (label) => {
    const created = await casesService.createTituloOption(label);
    if (created && typeof created === 'object') {
      setTituloOptions((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const exists = next.some((opt) => String(opt?.value) === String(created.value));
        if (!exists) next.unshift(created);
        return next;
      });
    }
    return created;
  }, []);

  const updateTituloOption = useCallback(async (idToUpdate, label) => {
    try {
      const updated = await casesService.updateTituloOption(idToUpdate, label);
      if (updated && typeof updated === 'object') {
        setTituloOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const index = next.findIndex((opt) => Number(opt?.id) === Number(updated.id));
          if (index >= 0) {
            next[index] = { ...next[index], ...updated };
            return next;
          }
          const byValue = next.findIndex((opt) => String(opt?.value) === String(updated.value));
          if (byValue >= 0) {
            next[byValue] = { ...next[byValue], ...updated };
            return next;
          }
          return [updated, ...next];
        });
      }
      return updated;
    } catch (error) {
      showToast?.(error?.message || 'Erro ao editar Título', 'error');
      return null;
    }
  }, [showToast]);

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
  const loadCaseData = useCallback(
    /**
     * @param {{ silent?: boolean }=} options
     */
    async (options = {}) => {
      const { silent = false } = options || {};

      if (!id) {
        if (!silent) setLoading(false);
        return;
      }

      try {
        if (!silent) setLoading(true);
        const data = await casesService.getById(id);
        setCaseData(data);
        setFormData(data);
      } catch (error) {
        console.error('Error loading case:', error);
        showToast('Erro ao carregar processo', 'error');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, showToast]
  );

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  useEffect(() => {
    loadTipoAcaoOptions();
  }, [loadTipoAcaoOptions]);

  useEffect(() => {
    loadTituloOptions();
  }, [loadTituloOptions]);

  useEffect(() => {
    loadVinculoTipoOptions();
  }, [loadVinculoTipoOptions]);

  const createVinculoTipoOption = useCallback(async (label) => {
    const created = await casesService.createVinculoTipoOption(label);
    if (created && typeof created === 'object') {
      setVinculoTipoOptions((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const exists = next.some((opt) => String(opt?.value) === String(created.value));
        if (!exists) next.push(created);
        return next;
      });
    }
    return created;
  }, []);

  const updateVinculoTipoOption = useCallback(async (idToUpdate, label) => {
    try {
      const updated = await casesService.updateVinculoTipoOption(idToUpdate, label);
      if (updated && typeof updated === 'object') {
        setVinculoTipoOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const index = next.findIndex((opt) => Number(opt?.id) === Number(updated.id));
          if (index >= 0) {
            next[index] = { ...next[index], ...updated };
            return next;
          }
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
      showToast?.(error?.message || 'Erro ao editar Tipo de Vínculo', 'error');
      return null;
    }
  }, [showToast]);

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

    setFieldValidationErrors((prev) => {
      if (!prev?.[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /**
   * Salvar caso
   */
  const handleSave = async (parties = []) => {
    try {
      setSaving(true);
      setFieldValidationErrors({});

      const requiredFields = [
        { key: 'numero_processo', label: 'Processo Nº' },
        { key: 'tribunal', label: 'Tribunal' },
      ];

      if (Boolean(formData?.case_principal)) {
        requiredFields.push({ key: 'vinculo_tipo', label: 'Tipo de Vínculo' });
      }

      const missingRequired = requiredFields.filter(({ key }) => !String(formData?.[key] || '').trim());
      if (missingRequired.length > 0) {
        const nextErrors = missingRequired.reduce((acc, item) => {
          acc[item.key] = true;
          return acc;
        }, {});
        setFieldValidationErrors(nextErrors);

        const labels = missingRequired.map((item) => item.label).join(' e ');
        showToast(`Preencha os campos obrigatórios: ${labels}.`, 'warning');
        return null;
      }

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

        const pubId = sourcePublication?.id_api || publicationId;

        if (pubId) {
          // REGRA DE NEGÓCIO:
          // Se o processo foi criado a partir de uma publicação (via ?pub_id=),
          // essa publicação deve ser vinculada ao processo.
          // Também criamos a movimentação correspondente, porque é na aba Movimentações
          // que o advogado controla tarefas vinculadas ao evento (publicação).
          try {
            const integrationResult = await publicationsService.integratePublication(pubId, {
              caseId: created.id,
              // A ação do usuário aqui é explícita (Criar/Salvar processo a partir da publicação),
              // então faz sentido gerar a movimentação para não "sumir" do fluxo de tarefas.
              createMovement: true,
            });

            // Se a integração falhar, o caso ainda é criado; apenas avisar.
            if (integrationResult?.success !== true) {
              console.warn('Falha ao integrar publicação de origem no caso criado:', integrationResult);
              showToast(integrationResult?.error || 'Processo criado, mas houve falha ao vincular a publicação de origem', 'warning');
            }
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
          const casePrincipalId =
            Number(created.case_principal) ||
            Number(formData?.case_principal) ||
            null;
          onCaseCreated(created.id, 0, { casePrincipalId });
        }

        showToast('Processo criado com sucesso!', 'success');

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

      const message = String(error?.message || '');
      const backendFieldErrors = {};
      if (/numero_processo/i.test(message)) backendFieldErrors.numero_processo = true;
      if (/tribunal/i.test(message)) backendFieldErrors.tribunal = true;
      if (/vinculo_tipo|tipo de v[ií]nculo/i.test(message)) backendFieldErrors.vinculo_tipo = true;

      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldValidationErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        showToast('Não foi possível salvar. Revise os campos obrigatórios destacados.', 'warning');
      } else {
        showToast(id ? 'Erro ao atualizar processo' : 'Erro ao criar processo', 'error');
      }

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
  const handleDelete = async (deletePublicationToo = false, options = {}) => {
    const extraCaseIds = Array.isArray(options?.caseIds) ? options.caseIds : [];

    try {
      await casesService.delete(id, 'Deleted via UI', deletePublicationToo);

      if (deletePublicationToo) {
        notifyPublicationSync({
          type: 'PUBLICATIONS_UPDATED',
          action: 'deleted-by-case',
          caseId: Number(id),
          source: options?.source || 'useCaseCore.handleDelete',
        });
      }

      notifyCaseSync({
        caseIds: [
          Number(id),
          Number(caseData?.case_principal),
          ...extraCaseIds,
        ],
        action: options?.action || 'case-deleted',
        source: options?.source || 'useCaseCore.handleDelete',
      });

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
    fieldValidationErrors,

    // Opções
    tribunalOptions,
    statusOptions,
    tipoAcaoOptions,
    createTipoAcaoOption,
    updateTipoAcaoOption,

    tituloOptions,
    createTituloOption,
    updateTituloOption,
    searchTituloOptions,

    vinculoTipoOptions,
    createVinculoTipoOption,
    updateVinculoTipoOption,

    // Funções
    handleInputChange,
    handleSave,
    handleCancel,
    handleDelete,
    loadCaseData,
  };
}

export default useCaseCore;
