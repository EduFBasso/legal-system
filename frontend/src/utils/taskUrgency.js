import { calculateUrgency } from './movementUtils';

export const parseLocalDate = (dateValue) => {
  if (!dateValue) return null;
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return new Date(`${dateValue}T00:00:00`);
  }
  return new Date(dateValue);
};

export const getTaskUrgency = (dataVencimento) => calculateUrgency(dataVencimento);

export const formatDaysRemaining = (dataVencimento) => {
  if (!dataVencimento) return 'Sem prazo';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = parseLocalDate(dataVencimento);
  dueDate.setHours(0, 0, 0, 0);

  const days = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)}d atrasada`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return `${days}d`;
};

export const isOverdue = (dataVencimento) => {
  if (!dataVencimento) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = parseLocalDate(dataVencimento);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

export const isToday = (dataVencimento) => {
  if (!dataVencimento) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = parseLocalDate(dataVencimento);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate.getTime() === today.getTime();
};