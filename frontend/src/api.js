const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Debug: log the API base in dev
if (import.meta.env.DEV) {
  console.log('[api] API_BASE =', API_BASE);
}

const request = async (url, options = {}) => {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error(`[api] ${options.method || 'GET'} ${url} →`, err.message);
    throw err;
  }
};

export const api = {
  // ── Dashboard ──
  getDashboardStats: () => request('/dashboard/stats'),

  // ── Students ──
  getStudents: () => request('/students'),
  addStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),

  // ── Transport ──
  getTransport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transport${query ? '?' + query : ''}`);
  },
  addTransport: (data) => request('/transport', { method: 'POST', body: JSON.stringify(data) }),
  updateTransport: (id, data) => request(`/transport/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransport: (id) => request(`/transport/${id}`, { method: 'DELETE' }),

  // ── Payments ──
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? '?' + query : ''}`);
  },
  addPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),

  // ── Dues ──
  getDues: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dues${query ? '?' + query : ''}`);
  },
  addDue: (data) => request('/dues', { method: 'POST', body: JSON.stringify(data) }),
  updateDue: (id, data) => request(`/dues/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ── Enquiries ──
  getEnquiries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/enquiries${query ? '?' + query : ''}`);
  },
  addEnquiry: (data) => request('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateEnquiry: (id, data) => request(`/enquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ── Follow-ups ──
  getFollowUps: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/followups${query ? '?' + query : ''}`);
  },
  addFollowUp: (data) => request('/followups', { method: 'POST', body: JSON.stringify(data) }),
  updateFollowUp: (id, data) => request(`/followups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ── Student Exits ──
  getExits: () => request('/exits'),
  addExit: (data) => request('/exits', { method: 'POST', body: JSON.stringify(data) }),

  // ── Finance ──
  getFinanceSummary: () => request('/finance/summary'),
  getReportsData: () => request('/finance/reports'),

  // ── Expenses (MySQL) ──
  getExpenses: () => request('/finance/expenses'),
  addExpense: (data) => request('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/finance/expenses/${id}`, { method: 'DELETE' }),

  // ── AI Insights ──
  getInsights: () => request('/insights'),

  // ── Messages ──
  getMessages: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/messages${query ? '?' + query : ''}`);
  },
  sendMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  autoGenerateReminders: () => request('/messages/auto-generate', { method: 'POST', body: JSON.stringify({ type: 'reminder' }) }),

  // ── WhatsApp Alerts ──
  getAlertStudents: () => request('/transport/alert-students'),
  markPaid: (data) => request('/transport/mark-paid', { method: 'POST', body: JSON.stringify(data) }),
  sendManualAlert: (data) => request('/transport/send-manual-alert', { method: 'POST', body: JSON.stringify(data) }),
  getAlertLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transport/alert-logs${query ? '?' + query : ''}`);
  },
};
