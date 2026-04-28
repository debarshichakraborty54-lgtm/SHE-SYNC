const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('shesync_token');
}

function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, {
    ...options,
    headers,
  }).then(res => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
}

const api = {
  auth: {
    signup: (data) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiRequest('/auth/me'),
  },
  cycles: {
    getAll: () => apiRequest('/cycles'),
    getCurrent: () => apiRequest('/cycles/current'),
    create: (data) => apiRequest('/cycles', { method: 'POST', body: JSON.stringify(data) }),
    end: (id, data) => apiRequest(`/cycles/${id}/end`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  flow: {
    get: (cycleId) => apiRequest(`/flow/${cycleId}`),
    create: (data) => apiRequest('/flow', { method: 'POST', body: JSON.stringify(data) }),
  },
  clots: {
    get: (cycleId) => apiRequest(`/clots/${cycleId}`),
    create: (data) => apiRequest('/clots', { method: 'POST', body: JSON.stringify(data) }),
  },
  alerts: {
    get: () => apiRequest('/alerts'),
    markRead: (id) => apiRequest(`/alerts/${id}/read`, { method: 'PUT' }),
  },
  insights: {
    get: () => apiRequest('/insights'),
  },
};