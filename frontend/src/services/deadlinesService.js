/**
 * Service for Deadlines management
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Get deadlines for a specific case
 * Returns movements with prazo defined, sorted by deadline date
 */
export const getDeadlinesByCase = async (caseId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/case-movements/?case_id=${caseId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter only movements with prazo and sort by deadline
    const deadlines = data
      .filter(mov => mov.prazo && mov.data_limite_prazo)
      .sort((a, b) => new Date(a.data_limite_prazo) - new Date(b.data_limite_prazo));
    
    return deadlines;
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    throw error;
  }
};

/**
 * Get all deadlines from all cases
 */
export const getAllDeadlines = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/case-movements/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter only movements with prazo and sort by deadline
    const deadlines = data
      .filter(mov => mov.prazo && mov.data_limite_prazo)
      .sort((a, b) => new Date(a.data_limite_prazo) - new Date(b.data_limite_prazo));
    
    return deadlines;
  } catch (error) {
    console.error('Error fetching all deadlines:', error);
    throw error;
  }
};

/**
 * Check deadlines and create notifications
 * This triggers the backend to verify all deadlines and create notifications
 */
export const checkDeadlinesAndNotify = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/check_deadlines/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking deadlines:', error);
    throw error;
  }
};

/**
 * Calculate deadline status
 * Returns: 'overdue' | 'urgent' | 'upcoming' | 'future'
 */
export const getDeadlineStatus = (deadlineDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadline = new Date(deadlineDate);
  deadline.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'urgent';
  if (diffDays <= 7) return 'upcoming';
  return 'future';
};

/**
 * Get deadline status label and color
 */
export const getDeadlineStatusInfo = (status) => {
  const statusMap = {
    overdue: { label: '❌ Vencido', color: '#dc2626' },
    urgent: { label: '🔴 Vence hoje', color: '#ea580c' },
    upcoming: { label: '⏰ Próximo', color: '#f59e0b' },
    future: { label: '✅ Futuro', color: '#10b981' },
  };
  
  return statusMap[status] || statusMap.future;
};
