/**
 * caseTheme.js - Paleta de cores centralizada para o tema das movimentações
 * 
 * Um único lugar para definir todas as cores do sistema.
 * Facilita mudanças de tema e mantém consistência visual.
 */

export const caseTheme = {
  // === DARK THEME BASE ===
  darkBg: '#1f2937',           // Dark background base
  darkBgLight: '#2d3748',      // Slightly lighter dark background
  darkBorder: '#374151',       // Dark border
  darkText: '#f0f4f8',         // Light text (almost white)
  darkTextSecondary: '#cbd5e0', // Secondary text (light gray)
  darkTextTertiary: '#9ca3af', // Tertiary text (very light gray, for done tasks)

  // === PRIMARY ACCENT ===
  accentGreen: '#16a34a',      // Green primary
  accentGreenDark: '#15803d',  // Green dark
  accentGreenRgb: '22, 163, 74',

  // === URGENCY BADGES ===
  urgency: {
    URGENTISSIMO: { background: '#5f3d1a', color: '#fde047', label: 'Urgentissimo' },
    URGENTE: { background: '#5d4037', color: '#fed7aa', label: 'Urgente' },
    NORMAL: { background: '#1e3a2c', color: '#16a34a', label: 'Normal' },
  },

  // === ORIGIN BADGES ===
  origin: {
    MANUAL: { background: '#5f3d1a', color: '#fde047' },
    AUTOMATICA: { background: '#1e3a2c', color: '#16a34a' },
  },

  // === DEADLINE BADGE ===
  deadline: { background: '#5f3d1a', color: '#fde047' },

  // === DUE DATE BADGE ===
  dueDate: { background: '#2d3e4f', color: '#93c5fd' },
  noDueDate: { background: '#3f4649', color: '#cbd5e0' },

  // === BUTTON COLORS ===
  button: {
    primary: '#16a34a',        // Green for save/add
    primaryDark: '#15803d',    // Darker green on hover
    secondary: '#4a5568',      // Gray for cancel
    secondaryDark: '#5a6670',  // Darker gray on hover
    danger: '#ef4444',         // Red for delete
  },

  // === FORM STYLING ===
  form: {
    background: '#2d3748',
    border: '#374151',
    input: {
      background: '#1f2937',
      border: '#374151',
      text: '#f0f4f8',
    },
  },

  // === TASK LIST ===
  taskInline: {
    background: '#1f2937',
    border: '#374151',
    container: '#2d3748',
  },

  // === CARD STATES ===
  card: {
    normalBg: '#2d3748',
    normalBorder: '#374151',
    highlightedBg: '#3d4556',
    highlightedBorder: '#16a34a',
    doneBg: '#3f4649',
  },
};

// === HELPER: Get origin badge style ===
export const getOriginBadgeStyle = (isManual) => ({
  fontSize: '0.95rem',
  fontWeight: 700,
  borderRadius: '999px',
  padding: '0.2rem 0.55rem',
  ...caseTheme.origin[isManual ? 'MANUAL' : 'AUTOMATICA'],
});

// === HELPER: Get urgency style ===
export const getUrgencyStyle = (urgency) => ({
  fontSize: '0.9rem',
  fontWeight: 700,
  padding: '0.15rem 0.45rem',
  borderRadius: '999px',
  ...caseTheme.urgency[urgency || 'NORMAL'],
});

// === HELPER: Get task card style ===
export const getTaskCardStyle = ({ isHighlighted, isSelected, isDone }) => ({
  border: isHighlighted
    ? `2px solid ${caseTheme.accentGreen}`
    : isSelected
      ? `2px solid ${caseTheme.accentGreen}`
      : `1px solid ${caseTheme.darkBorder}`,
  borderRadius: '8px',
  padding: '0.65rem',
  marginBottom: '0.5rem',
  background: isDone ? caseTheme.card.doneBg : '#fff',
  color: isDone ? caseTheme.darkTextSecondary : caseTheme.darkText,
});
