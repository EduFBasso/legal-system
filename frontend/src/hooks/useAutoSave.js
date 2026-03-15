import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook genérico para auto-save com debounce
 * 
 * @param {Object} data - Dados a serem salvos
 * @param {Function} onSave - Callback async para salvar (recebe data)
 * @param {Object} options - Opções de configuração
 * @param {number} options.delay - Delay em ms para debounce (padrão: 800)
 * @param {boolean} options.enabled - Se auto-save está habilitado (padrão: true)
 * @param {Function} options.getChangedFields - Opcional: função para calcular apenas campos mudados
 * @returns {Object} { isSaving, lastSavedData, forceSave }
 * 
 * @example
 * const { isSaving } = useAutoSave(
 *   financialData,
 *   async (data) => await casesService.update(id, data),
 *   { delay: 800, enabled: !!id }
 * );
 */
export function useAutoSave(data, onSave, options = {}) {
  const {
    delay = 800,
    enabled = true,
    getChangedFields = null,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const initializedRef = useRef(false);

  const computeDataToSave = useCallback((currentData, lastSavedDataStr) => {
    let dataToSave = currentData;

    if (getChangedFields && lastSavedDataStr) {
      try {
        const lastData = JSON.parse(lastSavedDataStr);
        dataToSave = getChangedFields(currentData, lastData);

        if (Object.keys(dataToSave).length === 0) {
          return null;
        }
      } catch (error) {
        console.warn('Error calculating changed fields:', error);
      }
    }

    return dataToSave;
  }, [getChangedFields]);

  // Force save function (útil para casos especiais)
  const forceSave = async () => {
    if (!enabled || !onSave) return;

    const currentDataStr = JSON.stringify(data);

    if (!initializedRef.current) {
      lastSavedDataRef.current = currentDataStr;
      initializedRef.current = true;
      return;
    }

    if (currentDataStr === lastSavedDataRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const dataToSave = computeDataToSave(data, lastSavedDataRef.current);
    if (dataToSave === null) {
      lastSavedDataRef.current = currentDataStr;
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(dataToSave);
      lastSavedDataRef.current = currentDataStr;
    } catch (error) {
      console.error('Error in forceSave:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // Skip se não habilitado
    if (!enabled || !onSave) return;

    // Serializar dados para comparação
    const currentDataStr = JSON.stringify(data);

    // Primeira inicialização: apenas guardar referência
    if (!initializedRef.current) {
      lastSavedDataRef.current = currentDataStr;
      initializedRef.current = true;
      return;
    }

    // Se não mudou, não faz nada
    if (currentDataStr === lastSavedDataRef.current) {
      return;
    }

    // Limpar timer anterior se existir
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const dataToSave = computeDataToSave(data, lastSavedDataRef.current);
    if (dataToSave === null) {
      return;
    }

    // Agendar save com debounce
    setIsSaving(true);
    timerRef.current = setTimeout(async () => {
      try {
        await onSave(dataToSave);
        lastSavedDataRef.current = currentDataStr;
      } catch (error) {
        console.error('Error in auto-save:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    // Cleanup: cancelar timer se componente desmontar ou deps mudarem
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, onSave, delay, enabled, computeDataToSave]);

  return {
    isSaving,
    lastSavedData: lastSavedDataRef.current 
      ? JSON.parse(lastSavedDataRef.current) 
      : null,
    forceSave,
  };
}

export default useAutoSave;
