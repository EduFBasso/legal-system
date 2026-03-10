import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar estado de formulário com lógica de edição
 * 
 * @param {Object} initialData - Dados iniciais do formulário
 * @param {Object} options - Opções de configuração
 * @param {boolean} options.editingByDefault - Se inicia em modo de edição (padrão: false)
 * @returns {Object} Estado e handlers do formulário
 * 
 * @example
 * const form = useFormState(caseData, { editingByDefault: !id });
 * 
 * // Usar assim:
 * form.data // dados atuais
 * form.isEditing // modo edição?
 * form.isSaving // salvando?
 * form.handleChange('field', value) // mudar campo
 * form.startEditing() // entrar em modo edição
 * form.cancelEditing() // cancelar e reverter
 * form.setData(newData) // atualizar dados
 * form.setSaving(true) // controlar saving state
 */
export function useFormState(initialData = {}, options = {}) {
  const {
    editingByDefault = false,
  } = options;

  const [data, setData] = useState(initialData);
  const [isEditing, setIsEditing] = useState(editingByDefault);
  const [isSaving, setIsSaving] = useState(false);
  const [originalData, setOriginalData] = useState(initialData);

  /**
   * Atualizar um campo específico do formulário
   */
  const handleChange = useCallback((field, value) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Atualizar múltiplos campos de uma vez
   */
  const handleBatchChange = useCallback((updates) => {
    setData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  /**
   * Iniciar modo de edição
   */
  const startEditing = useCallback(() => {
    setOriginalData(data); // Guardar snapshot para reverter
    setIsEditing(true);
  }, [data]);

  /**
   * Cancelar edição e reverter para dados originais
   */
  const cancelEditing = useCallback(() => {
    setData(originalData);
    setIsEditing(false);
  }, [originalData]);

  /**
   * Salvar e sair do modo de edição (sem fazer save real)
   * Use junto com seu próprio onSave handler
   */
  const finishEditing = useCallback(() => {
    setOriginalData(data); // Atualizar snapshot
    setIsEditing(false);
  }, [data]);

  /**
   * Resetar para dados iniciais
   */
  const reset = useCallback((newData = initialData) => {
    setData(newData);
    setOriginalData(newData);
    setIsEditing(editingByDefault);
    setIsSaving(false);
  }, [initialData, editingByDefault]);

  /**
   * Verificar se dados foram modificados
   */
  const hasChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(originalData);
  }, [data, originalData]);

  return {
    // Estados
    data,
    isEditing,
    isSaving,
    originalData,

    // Setters diretos (para casos especiais)
    setData,
    setIsEditing,
    setIsSaving,

    // Handlers
    handleChange,
    handleBatchChange,
    startEditing,
    cancelEditing,
    finishEditing,
    reset,
    hasChanges,
  };
}

export default useFormState;
