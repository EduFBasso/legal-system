// Color Palette - Tema Verde (alinhado com TasksTab)
const colorPalette = {
  normal: '#16a34a',           // Green Primary
  normalLight: '#f0fdf4',      // Green Light Background
  normalDark: '#15803d',       // Green Dark
  normalRgb: '22, 163, 74',    // RGB for transparency
};

export const movementCardStyles = {
  base: {
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    padding: '1rem 1rem 1rem 1.15rem',
    marginBottom: '0.75rem',
    background: colorPalette.normalLight,
    border: `1px solid rgba(${colorPalette.normalRgb}, 0.2)`,
  },
  highlighted: {
    background: '#f0fdfb',
    border: `3px solid ${colorPalette.normal}`,
    boxShadow: `0 0 0 3px rgba(${colorPalette.normalRgb}, 0.2)`,
  },
  selected: {
    border: `3px solid ${colorPalette.normalDark}`,
    background: colorPalette.normalLight,
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
    color: '#6b7280',
    marginBottom: '0.25rem',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    color: '#111827',
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
    color: '#374151',
  },
  infoLabel: {
    color: '#111827',
  },
  descriptionManual: {
    margin: '0.6rem 0 0',
    fontSize: '1.025rem',
    color: '#1f2937',
    lineHeight: 1.5,
  },
  descriptionAuto: {
    margin: '0.6rem 0 0',
    fontSize: '1.025rem',
    color: '#4b5563',
    lineHeight: 1.5,
  },
  actionsRow: {
    marginTop: '0.75rem',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  actionButtonEdit: {
    border: `1px solid ${colorPalette.normal}`,
    background: '#fff',
    color: colorPalette.normal,
    borderRadius: '6px',
    padding: '0.3rem 0.7rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionButtonDelete: {
    border: '1px solid #dc2626',
    background: '#fff',
    color: '#dc2626',
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
  background: isManual ? '#fef3c7' : colorPalette.normalLight,
  color: isManual ? '#92400e' : colorPalette.normalDark,
});

export const movementDeadlineBadgeStyle = {
  fontSize: '0.95rem',
  fontWeight: 700,
  borderRadius: '999px',
  padding: '0.2rem 0.55rem',
  background: '#fee2e2',
  color: '#991b1b',
};

export const tasksInlineStyles = {
  wrapper: {
    marginTop: '1rem',
    borderTop: `1px solid rgba(${colorPalette.normalRgb}, 0.2)`,
    paddingTop: '0.85rem',
  },
  innerContainer: {
    border: `1px solid rgba(${colorPalette.normalRgb}, 0.15)`,
    borderLeft: `4px solid ${colorPalette.normal}`,
    borderRadius: '10px',
    background: colorPalette.normalLight,
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
    color: colorPalette.normalDark,
  },
  addButton: {
    border: `1px solid ${colorPalette.normal}`,
    background: '#fff',
    color: colorPalette.normal,
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
    color: '#6b7280',
    fontSize: '1rem',
  },
  taskTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  taskDescription: {
    marginTop: '0.15rem',
    fontSize: '1rem',
    color: '#4b5563',
  },
  metaBadge: {
    fontSize: '0.9rem',
    padding: '0.15rem 0.45rem',
    borderRadius: '999px',
  },
  dueDateBadge: {
    background: '#eef2ff',
    color: '#3730a3',
    fontWeight: 600,
  },
  noDueDateBadge: {
    background: '#f3f4f6',
    color: '#374151',
    fontWeight: 600,
  },
  editTaskButton: {
    border: `1px solid ${colorPalette.normal}`,
    background: '#fff',
    color: colorPalette.normal,
    borderRadius: '6px',
    padding: '0.2rem 0.55rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export const getTaskCardStyle = ({ isHighlighted, isSelected, isDone }) => ({
  border: isHighlighted
    ? `2px solid ${colorPalette.normal}`
    : isSelected
      ? `2px solid ${colorPalette.normalDark}`
      : `1px solid rgba(${colorPalette.normalRgb}, 0.15)`,
  borderRadius: '8px',
  padding: '0.65rem',
  marginBottom: '0.5rem',
  background: isDone ? '#f9fafb' : '#fff',
});
