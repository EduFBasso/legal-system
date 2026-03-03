import { apiFetch } from '@/utils/apiFetch.js';

/**
 * Buscar todos os prazos do sistema (de todos os processos)
 * Retorna lista com prazo, caso associado, dias restantes e urgência
 */
export const getAllPrazos = async () => {
  return await apiFetch('/case-prazos/');
};

/**
 * Buscar prazos de um caso específico
 */
export const getPrazosByCase = async (caseId) => {
  return await apiFetch(`/case-prazos/?case_id=${caseId}`);
};

export default {
  getAllPrazos,
  getPrazosByCase,
};
