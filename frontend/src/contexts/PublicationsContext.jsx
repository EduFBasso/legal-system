import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { usePublications } from '../hooks/usePublications';

/**
 * Context para gerenciar estado global de publicações
 * Provê acesso centralizado ao estado e ações relacionadas a publicações
 */
const PublicationsContext = createContext(null);

/**
 * Provider do contexto de publicações
 * Envolve componentes que precisam acessar dados de publicações
 */
export function PublicationsProvider({ children }) {
  const publicationsState = usePublications();

  return (
    <PublicationsContext.Provider value={publicationsState}>
      {children}
    </PublicationsContext.Provider>
  );
}

PublicationsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook para consumir o contexto de publicações
 * Lança erro se usado fora do Provider
 */
export function usePublicationsContext() {
  const context = useContext(PublicationsContext);
  
  if (!context) {
    throw new Error(
      'usePublicationsContext deve ser usado dentro de um PublicationsProvider'
    );
  }
  
  return context;
}

export default PublicationsContext;
