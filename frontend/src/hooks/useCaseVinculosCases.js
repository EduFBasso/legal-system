import { useEffect, useRef, useState } from 'react';

/**
 * useCaseVinculosCases
 * Carrega processos vinculados pelo relacionamento principal/derivado (case_principal).
 *
 * Regras:
 * - Se o processo atual é PRINCIPAL: retorna somente seus derivados.
 * - Se o processo atual é DERIVADO: retorna o principal + outros derivados do mesmo principal.
 * - Se o processo atual é NEUTRO: retorna lista vazia.
 *
 * @param {Object} params
 * @param {number|null|undefined} params.currentCaseId
 * @param {number|null|undefined} params.casePrincipalId - case_principal do processo atual (se for derivado)
 * @param {string|null|undefined} params.classificacao - classificacao do processo atual
 * @returns {{ linkedCases: Array, loadingLinkedCases: boolean }}
 */
export function useCaseVinculosCases({ currentCaseId, casePrincipalId, classificacao }) {
  const [linkedCases, setLinkedCases] = useState([]);
  const [loadingLinkedCases, setLoadingLinkedCases] = useState(false);
  const loadRunIdRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const reloadLinkedCases = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let isActive = true;
    const runId = (loadRunIdRef.current += 1);
    let loadingUiTimer = null;

    const normalizedClassificacao = String(classificacao || '').trim().toUpperCase();
    const currentId = Number(currentCaseId) || null;
    const principalId = casePrincipalId ? Number(casePrincipalId) || null : null;

    const isDerived = Boolean(principalId);
    const isPrincipal = !isDerived && normalizedClassificacao === 'PRINCIPAL';

    const resolvedPrincipalId = isDerived ? principalId : (isPrincipal ? currentId : null);

    const load = async () => {
      if (!currentId || !resolvedPrincipalId) {
        setLinkedCases([]);
        setLoadingLinkedCases(false);
        return;
      }

      setLoadingLinkedCases(false);
      loadingUiTimer = window.setTimeout(() => {
        if (!isActive) return;
        if (runId !== loadRunIdRef.current) return;
        setLoadingLinkedCases(true);
      }, 150);

      try {
        const { default: casesService } = await import('../services/casesService');

        const [derived, principal] = await Promise.all([
          casesService.getAll({
            case_principal: resolvedPrincipalId,
            ordering: 'created_at',
          }),
          isDerived ? casesService.getById(resolvedPrincipalId) : Promise.resolve(null),
        ]);

        if (!isActive) return;
        if (runId !== loadRunIdRef.current) return;

        const derivedList = Array.isArray(derived)
          ? derived.filter((c) => Number(c?.id) !== Number(currentId))
          : Array.isArray(derived?.results)
            ? derived.results.filter((c) => Number(c?.id) !== Number(currentId))
            : [];

        if (isDerived && principal && typeof principal === 'object') {
          setLinkedCases([
            principal,
            ...derivedList,
          ]);
        } else {
          setLinkedCases(derivedList);
        }
      } catch {
        if (!isActive) return;
        if (runId !== loadRunIdRef.current) return;
        setLinkedCases([]);
      } finally {
        if (loadingUiTimer) {
          window.clearTimeout(loadingUiTimer);
        }

        const shouldApply = isActive && runId === loadRunIdRef.current;
        if (shouldApply) {
          setLoadingLinkedCases(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
      if (loadingUiTimer) {
        window.clearTimeout(loadingUiTimer);
      }
    };
  }, [currentCaseId, casePrincipalId, classificacao, refreshKey]);

  return { linkedCases, loadingLinkedCases, reloadLinkedCases };
}

export default useCaseVinculosCases;
