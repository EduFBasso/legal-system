export const movementCardStyles = {
  base: {
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    padding: '1rem 1rem 1rem 1.15rem',
    marginBottom: '0.75rem',
    background: '#faf5ff',
    border: '1px solid #e9d5ff',
  },
  highlighted: {
    background: '#eff6ff',
    border: '3px solid #3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
  },
  selected: {
    border: '3px solid #6b21a8',
    background: '#fdf4ff',
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
    border: '1px solid #6b21a8',
    background: '#fff',
    color: '#6b21a8',
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
  background: isManual ? '#fef3c7' : '#dbeafe',
  color: isManual ? '#92400e' : '#1e40af',
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
    borderTop: '1px solid #ddd6fe',
    paddingTop: '0.85rem',
  },
  innerContainer: {
    border: '1px solid #ddd6fe',
    borderLeft: '4px solid #7c3aed',
    borderRadius: '10px',
    background: '#fcfaff',
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
    color: '#5b21b6',
  },
  addButton: {
    border: '1px solid #6b21a8',
    background: '#fff',
    color: '#6b21a8',
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
    border: '1px solid #6b21a8',
    background: '#fff',
    color: '#6b21a8',
    borderRadius: '6px',
    padding: '0.2rem 0.55rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export const getTaskCardStyle = ({ isHighlighted, isSelected, isDone }) => ({
  border: isHighlighted ? '2px solid #3b82f6' : isSelected ? '2px solid #6b21a8' : '1px solid #ddd6fe',
  borderRadius: '8px',
  padding: '0.65rem',
  marginBottom: '0.5rem',
  background: isDone ? '#f9fafb' : '#fff',
});
