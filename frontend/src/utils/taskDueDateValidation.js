// Shared task due-date validation for process tasks
// Rule (Option 1): due date must be >= tomorrow (today + 1 day)

export function getTomorrowISODate() {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function validateDueDateAtLeastTomorrow(dateValue) {
  const value = (dateValue || '').toString().trim();
  if (!value) {
    return {
      ok: false,
      message: 'Data de vencimento é obrigatória',
    };
  }

  // Expect YYYY-MM-DD from <input type="date">; accept any string new Date can parse.
  const candidate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(candidate.getTime())) {
    return {
      ok: false,
      message: 'Data de vencimento inválida',
    };
  }

  candidate.setHours(0, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (candidate < tomorrow) {
    return {
      ok: false,
      message: `A data de vencimento deve ser a partir de ${getTomorrowISODate()}`,
    };
  }

  return { ok: true };
}
