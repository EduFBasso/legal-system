import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * usePageNavigation
 * Gerencia navegação de abas, URL query parameters e highlighting de elementos.
 * 
 * @param {number} caseId - ID do caso
 * @returns {Object} Estado e funções para navegação da página
 */
export function usePageNavigation(caseId) {
  const location = useLocation();
  const navigate = useNavigate();

  // Aba ativa
  const [activeSection, setActiveSection] = useState('info');

  // Highlighting
  const [highlightedMovimentacaoId, setHighlightedMovimentacaoId] = useState(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  /**
   * Detecta query params para navegação automática a seção, movimento e tarefa
   * Exemplos: ?tab=movements&focusMovement=123&focusTask=456
   */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const focusMovement = params.get('focusMovement');
    const focusTask = params.get('focusTask');

    if (tab === 'movements') {
      setActiveSection('movimentacoes');
    } else if (tab === 'parties') {
      setActiveSection('parties');
    } else if (tab === 'info') {
      setActiveSection('info');
    }

    if (focusMovement) {
      setHighlightedMovimentacaoId(parseInt(focusMovement, 10));
    }

    if (focusTask) {
      setHighlightedTaskId(parseInt(focusTask, 10));
    }
  }, [location.search]);

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
      const confirmLeave = window.confirm(
        'Você está editando informações do processo.\n\n' +
        'Deseja sair sem salvar as alterações?'
      );
      if (!confirmLeave) {
        return; // Cancela mudança de aba
      }
      // Reverte mudanças não salvas
      setFormData(caseData);
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
