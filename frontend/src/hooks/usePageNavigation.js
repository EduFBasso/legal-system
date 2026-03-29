import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * usePageNavigation
 * Gerencia navegação de abas, URL query parameters e highlighting de elementos.
 * 
 * @returns {Object} Estado e funções para navegação da página
 */
export function usePageNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  // Aba ativa
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'movements' || tab === 'movimentacoes') return 'movimentacoes';
    if (tab === 'parties' || tab === 'partes') return 'parties';
    if (tab === 'info' || tab === 'informacoes') return 'info';
    if (tab === 'financeiro') return 'financeiro';
    if (tab === 'vinculos') return 'vinculos';
    if (tab === 'publicacoes') return 'publicacoes';
    if (tab === 'tasks' || tab === 'tarefas') return 'tasks';
    return 'info';
  });

  // Highlighting
  const [highlightedMovimentacaoId, setHighlightedMovimentacaoId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  // Evita loop no mount: quando a URL já define a aba (ex.: ?tab=financeiro)
  // não podemos sobrescrever com o default (info) antes do setActiveSection rodar.
  const skipNextUrlSyncRef = useRef(false);

  const resolveSectionFromTab = useCallback((tab) => {
    if (!tab) return null;

    // Backward compatible aliases
    if (tab === 'movements' || tab === 'movimentacoes') return 'movimentacoes';
    if (tab === 'parties' || tab === 'partes') return 'parties';
    if (tab === 'info' || tab === 'informacoes') return 'info';

    // Canonical tabs
    if (tab === 'financeiro') return 'financeiro';
    if (tab === 'vinculos') return 'vinculos';
    if (tab === 'publicacoes') return 'publicacoes';
    if (tab === 'tasks' || tab === 'tarefas') return 'tasks';
    return 'info';
  }, []);

  const resolveTabFromSection = useCallback((section) => {
    if (!section) return 'info';
    if (section === 'movimentacoes') return 'movements';
    if (section === 'parties') return 'parties';
    if (section === 'info') return 'info';
    if (section === 'financeiro') return 'financeiro';
    if (section === 'publicacoes') return 'publicacoes';
    if (section === 'tasks') return 'tasks';
    return 'info';
  }, []);

  /**
   * Detecta query params para navegação automática a seção, movimento e tarefa
   * Exemplos: ?tab=movements&focusMovement=123&focusTask=456
   */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const focusMovement = params.get('focusMovement');
    const focusTask = params.get('focusTask');

    const nextSection = resolveSectionFromTab(tab);
    if (nextSection) {
      // Só reagimos a mudanças vindas da URL (ex.: back/forward, deeplink).
      // Não devemos re-sincronizar state -> URL durante cliques normais,
      // senão o state é revertido para o tab antigo antes do efeito state->URL.
      setActiveSection((current) => {
        if (current === nextSection) return current;
        // Marca para que o próximo efeito (state -> URL) não sobrescreva a URL
        // com o estado anterior (evita piscar entre abas).
        skipNextUrlSyncRef.current = true;
        return nextSection;
      });
    }

    if (focusMovement) {
      setHighlightedMovimentacaoId(parseInt(focusMovement, 10));
    }

    if (focusTask) {
      setHighlightedTaskId(parseInt(focusTask, 10));
    }
  }, [location.search, resolveSectionFromTab]);

  /**
   * Mantém a URL sincronizada com a aba ativa.
   * Sem isso, qualquer fluxo que faça `navigate(..., replace)` pode re-aplicar
   * um `?tab=` antigo e "pular" a aba (instabilidade percebida em Financeiro/Vínculos).
   */
  useEffect(() => {
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false;
      return;
    }

    const params = new URLSearchParams(location.search);
    const desiredTab = resolveTabFromSection(activeSection);
    const currentTab = params.get('tab') || '';

    if (currentTab === desiredTab) {
      return;
    }

    params.set('tab', desiredTab);

    // Evita carregar highlights de movimentação em outras abas
    if (activeSection !== 'movimentacoes') {
      params.delete('focusMovement');
      params.delete('focusTask');
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${location.pathname}?${nextQuery}` : location.pathname;
    navigate(nextUrl, { replace: true });
  }, [activeSection, location.pathname, location.search, navigate, resolveTabFromSection]);

  /**
   * Limpar query params de ação/contato após usar
   */
  const clearLinkQueryParams = useCallback(() => {
    const params = new URLSearchParams(location.search);
    params.delete('action');
    params.delete('contactId');

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${location.pathname}?${nextQuery}` : location.pathname;
    navigate(nextUrl, { replace: true });
  }, [location.pathname, location.search, navigate]);

  /**
   * Mudança protegida de aba - previne perda de dados
   */
  const handleTabChange = (newTab, isEditing, caseData, formData, setIsEditing, setFormData) => {
    // Se estiver editando na aba de informações, confirma antes de sair
    if (isEditing && activeSection === 'info') {
      // Caso novo (sem caseData ainda): não descartar o formulário ao navegar.
      // Mantém o modo de edição e preserva os valores preenchidos.
      if (!caseData) {
        setActiveSection(newTab);
        return;
      }

      const confirmLeave = window.confirm(
        'Você está editando informações do processo.\n\n' +
        'Deseja sair sem salvar as alterações?'
      );
      if (!confirmLeave) {
        return; // Cancela mudança de aba
      }
      // Reverte mudanças não salvas
      setFormData(caseData || {});
      setIsEditing(false);
    }
    setActiveSection(newTab);
  };

  return {
    // Aba ativa
    activeSection,
    setActiveSection,

    // Highlighting
    highlightedMovimentacaoId,
    setHighlightedMovimentacaoId,
    highlightedTaskId,
    setHighlightedTaskId,

    // Funções
    handleTabChange,
    clearLinkQueryParams,
  };
}

export default usePageNavigation;
