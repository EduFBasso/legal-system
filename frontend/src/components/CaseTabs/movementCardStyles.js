// Color Palette - Tema Escuro
const colorPalette = {
  // Dark Theme
  darkBg: '#1f2937',           // Dark background base
  darkBgLight: '#2d3748',      // Slightly lighter dark background
  darkBorder: '#374151',       // Dark border
  darkText: '#f0f4f8',         // Light text (almost white)
  darkTextSecondary: '#cbd5e0', // Secondary text (light gray)
  accentGreen: '#16a34a',      // Green accent (may appear bright on dark)
  accentGreenRgb: '22, 163, 74',
};

export const movementCardStyles = {
  base: {
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    padding: '1rem 1rem 1rem 1.15rem',
    marginBottom: '0.75rem',
    background: colorPalette.darkBgLight,
    border: `1px solid ${colorPalette.darkBorder}`,
    color: colorPalette.darkText,
  },
  highlighted: {
    background: '#3d4556',
    border: `3px solid ${colorPalette.accentGreen}`,
    boxShadow: `0 0 0 3px rgba(${colorPalette.accentGreenRgb}, 0.3)`,
  },
  selected: {
    border: `3px solid ${colorPalette.accentGreen}`,
    background: colorPalette.darkBgLight,
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
    color: colorPalette.darkTextSecondary,
    marginBottom: '0.25rem',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    color: colorPalette.darkText,
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
    color: colorPalette.darkTextSecondary,
  },
  infoLabel: {
    color: colorPalette.darkText,
  },
  descriptionManual: {
    margin: '0.6rem 0 0',
    fontSize: '1.025rem',
    color: colorPalette.darkText,
    lineHeight: 1.5,
  },
  descriptionAuto: {
    margin: '0.6rem 0 0',
    fontSize: '1.025rem',
    color: colorPalette.darkTextSecondary,
    lineHeight: 1.5,
  },
  actionsRow: {
    marginTop: '0.75rem',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  actionButtonEdit: {
    border: `1px solid ${colorPalette.accentGreen}`,
    background: 'transparent',
    color: colorPalette.accentGreen,
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionButtonDelete: {
    border: '1px solid #ef4444',
    background: 'transparent',
    color: '#ef4444',
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export const getOriginBadgeStyle = (isManual) => ({
  fontSize: '0.95rem',
  fontWeight: 700,
  borderRadius: '999px',
  padding: '0.2rem 0.55rem',
  background: isManual ? '#5f3d1a' : '#1e3a2c',
  color: isManual ? '#fde047' : colorPalette.accentGreen,
});

export const movementDeadlineBadgeStyle = {
  fontSize: '0.95rem',
  fontWeight: 700,
  borderRadius: '999px',
  padding: '0.2rem 0.55rem',
  background: '#5f3d1a',
  color: '#fde047',
};

export const tasksInlineStyles = {
  wrapper: {
    marginTop: '1rem',
    borderTop: `1px solid ${colorPalette.darkBorder}`,
    paddingTop: '0.85rem',
  },
  innerContainer: {
    border: `1px solid ${colorPalette.darkBorder}`,
    borderLeft: `4px solid ${colorPalette.accentGreen}`,
    borderRadius: '10px',
    background: colorPalette.darkBg,
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
    color: colorPalette.darkText,
  },
  addButton: {
    border: `1px solid ${colorPalette.accentGreen}`,
    background: 'transparent',
    color: colorPalette.accentGreen,
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
    color: colorPalette.darkTextSecondary,
    fontSize: '1rem',
  },
  taskTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: colorPalette.darkText,
  },
  taskDescription: {
    marginTop: '0.15rem',
    fontSize: '1rem',
    color: colorPalette.darkTextSecondary,
  },
  metaBadge: {
    fontSize: '0.9rem',
    padding: '0.15rem 0.45rem',
    borderRadius: '999px',
  },
  dueDateBadge: {
    background: '#2d3e4f',
    color: '#93c5fd',
    fontWeight: 600,
  },
  noDueDateBadge: {
    background: '#3f4649',
    color: colorPalette.darkTextSecondary,
    fontWeight: 600,
  },
  editTaskButton: {
    border: `1px solid ${colorPalette.accentGreen}`,
    background: 'transparent',
    color: colorPalette.accentGreen,
    borderRadius: '6px',
    padding: '0.2rem 0.55rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export const getTaskCardStyle = ({ isHighlighted, isSelected, isDone }) => ({
  border: isHighlighted
    ? `2px solid ${colorPalette.accentGreen}`
    : isSelected
      ? `2px solid ${colorPalette.accentGreen}`
      : `1px solid ${colorPalette.darkBorder}`,
  borderRadius: '8px',
  padding: '0.65rem',
  marginBottom: '0.5rem',
  background: isDone ? '#3f4649' : colorPalette.darkBgLight,
  color: isDone ? colorPalette.darkTextSecondary : colorPalette.darkText,
});
