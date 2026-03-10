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
 * Tema atual: LIGHT MODE (background claro #F8FAFC, texto #111827)
 */

export const caseTheme = {
  // === LIGHT THEME BASE ===
  darkBg: '#F8FAFC',           // Light background base (almost white)
  darkBgLight: '#FFFFFF',      // Slightly lighter (white for inputs)
  darkBorder: '#CBD5E1',       // Light border (steel gray)
  darkText: '#111827',         // Vivid dark text (near black)
  darkTextSecondary: '#374151', // Secondary text (dark gray)
  darkTextTertiary: '#94A3B8', // Tertiary text (even lighter for done tasks)

  // === PRIMARY ACCENT ===
  accentGreen: '#16a34a',      // Green primary
  accentGreenDark: '#15803d',  // Green dark
  accentGreenRgb: '22, 163, 74',

  // === URGENCY BADGES (Light theme) ===
  urgency: {
    URGENTISSIMO: { background: '#fef2f2', color: '#dc2626', label: 'Urgentissimo' },
    URGENTE: { background: '#FEF3C7', color: '#92400E', label: 'Urgente' },
    NORMAL: { background: '#ecfdf3', color: '#166534', label: 'Normal' },
  },

  // === ORIGIN BADGES (Light theme) ===
  origin: {
    MANUAL: { background: '#FEF3C7', color: '#92400E' },
    AUTOMATICA: { background: '#DCFCE7', color: '#166534' },
  },

  // === DEADLINE BADGE (Light theme) ===
  deadline: { background: '#fef2f2', color: '#dc2626' },

  // === DUE DATE BADGE (Light theme) ===
  dueDate: { background: '#EEF2FF', color: '#3730A3' },
  noDueDate: { background: '#F3F4F6', color: '#374151' },

  // === BUTTON COLORS ===
  button: {
    primary: '#166534',        // Dark green for primary actions
    primaryDark: '#15803d',    // Darker green on hover
    secondary: '#E2E8F0',      // Light gray utility
    secondaryDark: '#CBD5E1',  // Darker gray utility
    danger: '#EF4444',         // Red semantic color
    neutral: '#475569',        // Dark neutral for cancel/delete inverted style
    neutralDark: '#334155',    // Darker neutral on hover
  },

  // === FORM STYLING ===
  form: {
    background: '#FFFFFF',
    border: '#CBD5E1',
    input: {
      background: '#FFFFFF',
      border: '#CBD5E1',
      text: '#111827',
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
    normalBorder: '#374151',
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

// === HELPER: Get urgency button tone ===
export const getUrgencyButtonStyle = (urgency) => {
  const urgencyKey = urgency || 'NORMAL';
  const toneByUrgency = {
    URGENTISSIMO: {
      base: caseTheme.urgency.URGENTISSIMO.color,
      hover: '#B91C1C',
      shadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
    },
    URGENTE: {
      base: caseTheme.urgency.URGENTE.color,
      hover: '#78350F',
      shadow: '0 2px 8px rgba(146, 64, 14, 0.3)',
    },
    NORMAL: {
      base: caseTheme.urgency.NORMAL.color,
      hover: '#14532D',
      shadow: '0 2px 8px rgba(22, 101, 52, 0.3)',
    },
  };

  return toneByUrgency[urgencyKey] || toneByUrgency.NORMAL;
};

// === HELPER: Get task card style ===
export const getTaskCardStyle = ({ isDone }) => ({
  border: `1px solid ${caseTheme.card.normalBorder}`,
  borderRadius: '8px',
  padding: '0.65rem',
  marginBottom: '0.5rem',
  background: isDone ? caseTheme.card.doneBg : caseTheme.card.normalBg,
  color: isDone ? caseTheme.darkTextSecondary : caseTheme.darkText,
});
