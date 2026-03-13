/**
 * movementCardStyles.js - Layout e estrutura dos estilos de cards de movimentação
 * 
 * As CORES estão centralizadas em caseTheme.js
 * Este arquivo contém apenas a estrutura e layout dos componentes.
 */

import {
  caseTheme,
  getOriginBadgeStyle,
  getTaskCardStyle,
} from './caseTheme';

export const movementCardStyles = {
  base: {
    cursor: 'default',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    padding: '1rem 1rem 1rem 1.15rem',
    marginBottom: '0.75rem',
    background: caseTheme.card.normalBg,
    border: `1px solid ${caseTheme.card.normalBorder}`,
    color: caseTheme.darkText,
  },
  highlighted: {
    background: caseTheme.card.highlightedBg,
    border: `3px solid ${caseTheme.accentGreen}`,
    boxShadow: `0 0 0 3px rgba(${caseTheme.accentGreenRgb}, 0.2)`,
  },
  selected: {
    border: `3px solid ${caseTheme.card.normalBorder}`,
    background: caseTheme.card.normalBg,
  },
};

export const movementDisplayStyles = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  date: {
    fontSize: '1rem',
    color: caseTheme.darkTextSecondary,
    marginBottom: '0.25rem',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    color: caseTheme.darkText,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flexWrap: 'wrap',
  },
  publicationActionsRow: {
    marginTop: '0.55rem',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  consultaButton: {
    border: `1px solid ${caseTheme.darkBorder}`,
    background: '#ffffff',
    color: caseTheme.darkText,
    borderRadius: '8px',
    padding: '0.35rem 0.7rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  infoLine: {
    marginTop: '0.5rem',
    fontSize: '1.025rem',
    color: caseTheme.darkTextSecondary,
  },
  publicationHeader: {
    marginTop: '0.55rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.45rem 0.85rem',
  },
  publicationHeaderItem: {
    fontSize: '0.98rem',
    color: caseTheme.darkTextSecondary,
    lineHeight: 1.35,
  },
  publicationHeaderLabel: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.35px',
    color: caseTheme.darkText,
    marginBottom: '0.15rem',
  },
  infoLabel: {
    color: caseTheme.darkText,
  },
  descriptionManual: {
    margin: '0.6rem 0 0',
    fontSize: '1.025rem',
    color: caseTheme.darkText,
    lineHeight: 1.5,
  },
  descriptionAuto: {
    margin: '0.75rem 0 0',
    fontSize: '1.025rem',
    color: caseTheme.darkTextSecondary,
    lineHeight: 1.5,
  },
  actionsRow: {
    marginTop: '0.75rem',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  actionButtonEdit: {
    border: 'none',
    background: caseTheme.button.primary,
    color: '#fff',
    borderRadius: '6px',
    padding: '0.35rem 0.8rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  actionButtonDelete: {
    border: 'none',
    background: caseTheme.button.danger,
    color: '#fff',
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// Re-exportar helpers de caseTheme para compatibilidade
export { getOriginBadgeStyle };

export const movementDeadlineBadgeStyle = {
  fontSize: '0.95rem',
  fontWeight: 700,
  borderRadius: '999px',
  padding: '0.2rem 0.55rem',
  ...caseTheme.deadline,
};

export const tasksInlineStyles = {
  wrapper: {
    marginTop: '1rem',
    paddingTop: '0.85rem',
    borderTop: `1px solid ${caseTheme.darkBorder}`,
  },
  innerContainer: {
    padding: '0.25rem 0 0',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.6rem',
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: caseTheme.darkText,
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
  },
  addButton: {
    border: 'none',
    background: caseTheme.button.primary,
    color: '#fff',
    borderRadius: '6px',
    padding: '0.35rem 0.8rem',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  emptyText: {
    margin: 0,
    color: caseTheme.darkTextSecondary,
    fontSize: '0.98rem',
  },
  taskTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: caseTheme.darkText,
  },
  taskDescription: {
    marginTop: '0.15rem',
    fontSize: '1rem',
    color: caseTheme.darkTextSecondary,
  },
  metaBadge: {
    fontSize: '0.9rem',
    padding: '0.15rem 0.45rem',
    borderRadius: '999px',
  },
  dueDateBadge: {
    ...caseTheme.dueDate,
    fontWeight: 600,
  },
  noDueDateBadge: {
    ...caseTheme.noDueDate,
    fontWeight: 600,
  },
  editTaskButton: {
    border: 'none',
    background: caseTheme.origin.MANUAL.color,
    color: '#fff',
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// Re-exportar para compatibilidade
export { getTaskCardStyle };
