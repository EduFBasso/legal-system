/**
 * caseTheme.js - Paleta de cores centralizada para o tema das movimentações
 * 
 * Um único lugar para definir todas as cores do sistema.
 * Facilita mudanças de tema e mantém consistência visual.
 */

/**
 * caseTheme.js - Paleta de cores centralizada para o tema das movimentações
 * 
 * Um único lugar para definir todas as cores do sistema.
 * Facilita mudanças de tema e mantém consistência visual.
 * 
 * Tema atual: LIGHT MODE (background claro #F8FAFC, texto #475569)
 */

export const caseTheme = {
  // === LIGHT THEME BASE ===
  darkBg: '#F8FAFC',           // Light background base (almost white)
  darkBgLight: '#FFFFFF',      // Slightly lighter (white for inputs)
  darkBorder: '#CBD5E1',       // Light border (steel gray)
  darkText: '#475569',         // Dark text (slate)
  darkTextSecondary: '#64748B', // Secondary text (lighter slate)
  darkTextTertiary: '#94A3B8', // Tertiary text (even lighter for done tasks)

  // === PRIMARY ACCENT ===
  accentGreen: '#16a34a',      // Green primary
  accentGreenDark: '#15803d',  // Green dark
  accentGreenRgb: '22, 163, 74',

  // === URGENCY BADGES (Light theme) ===
  urgency: {
    URGENTISSIMO: { background: '#FECACA', color: '#991B1B', label: 'Urgentissimo' },
    URGENTE: { background: '#FED7AA', color: '#92400E', label: 'Urgente' },
    NORMAL: { background: '#DCFCE7', color: '#166534', label: 'Normal' },
  },

  // === ORIGIN BADGES (Light theme) ===
  origin: {
    MANUAL: { background: '#FEF3C7', color: '#92400E' },
    AUTOMATICA: { background: '#DCFCE7', color: '#166534' },
  },

  // === DEADLINE BADGE (Light theme) ===
  deadline: { background: '#FECACA', color: '#991B1B' },

  // === DUE DATE BADGE (Light theme) ===
  dueDate: { background: '#EEF2FF', color: '#3730A3' },
  noDueDate: { background: '#F3F4F6', color: '#374151' },

  // === BUTTON COLORS ===
  button: {
    primary: '#16a34a',        // Green for save/add
    primaryDark: '#15803d',    // Darker green on hover
    secondary: '#E2E8F0',      // Light gray for cancel
    secondaryDark: '#CBD5E1',  // Darker gray on hover
    danger: '#EF4444',         // Red for delete
  },

  // === FORM STYLING ===
  form: {
    background: '#FFFFFF',
    border: '#CBD5E1',
    input: {
      background: '#FFFFFF',
      border: '#CBD5E1',
      text: '#475569',
    },
  },

  // === TASK LIST ===
  taskInline: {
    background: '#F8FAFC',
    border: '#CBD5E1',
    container: '#FFFFFF',
  },

  // === CARD STATES ===
  card: {
    normalBg: '#FFFFFF',
    normalBorder: '#CBD5E1',
    highlightedBg: '#F0FDF4',
    highlightedBorder: '#16a34a',
    doneBg: '#F9FAFB',
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
