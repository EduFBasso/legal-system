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
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    padding: '1rem 1rem 1rem 1.15rem',
    marginBottom: '0.75rem',
    background: caseTheme.darkBgLight,
    border: `1px solid ${caseTheme.darkBorder}`,
    color: caseTheme.darkText,
  },
  highlighted: {
    background: caseTheme.card.highlightedBg,
    border: `3px solid ${caseTheme.accentGreen}`,
    boxShadow: `0 0 0 3px rgba(${caseTheme.accentGreenRgb}, 0.3)`,
  },
  selected: {
    border: `3px solid ${caseTheme.accentGreen}`,
    background: caseTheme.darkBgLight,
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
  infoLine: {
    marginTop: '0.5rem',
    fontSize: '1.025rem',
    color: caseTheme.darkTextSecondary,
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
    margin: '0.6rem 0 0',
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
    border: `1px solid ${caseTheme.accentGreen}`,
    background: 'transparent',
    color: caseTheme.accentGreen,
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionButtonDelete: {
    border: `1px solid ${caseTheme.button.danger}`,
    background: 'transparent',
    color: caseTheme.button.danger,
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
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
    borderTop: `1px solid ${caseTheme.darkBorder}`,
    paddingTop: '0.85rem',
  },
  innerContainer: {
    border: `1px solid ${caseTheme.darkBorder}`,
    borderLeft: `4px solid ${caseTheme.accentGreen}`,
    borderRadius: '10px',
    background: caseTheme.taskInline.background,
    padding: '0.7rem',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.6rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: caseTheme.darkText,
  },
  addButton: {
    border: `1px solid ${caseTheme.accentGreen}`,
    background: 'transparent',
    color: caseTheme.accentGreen,
    borderRadius: '6px',
    padding: '0.25rem 0.6rem',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
  },
  emptyText: {
    margin: 0,
    color: caseTheme.darkTextSecondary,
    fontSize: '1rem',
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
    border: `1px solid ${caseTheme.accentGreen}`,
    background: 'transparent',
    color: caseTheme.accentGreen,
    borderRadius: '6px',
    padding: '0.2rem 0.55rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

// Re-exportar para compatibilidade
export { getTaskCardStyle };
