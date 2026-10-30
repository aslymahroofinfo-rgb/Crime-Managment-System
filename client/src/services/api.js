/**
 * Central API Client Configuration for Crime Investigation Website (CIW)
 */

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = String(rawBaseUrl).trim().replace(/\/+$/, '');

/**
 * Universal API Request Handler
 * @param {string} endpoint - Path like '/complaints' or full URL
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<Response>} Fetch Response
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem('token');

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto set Content-Type: application/json unless body is FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type'] && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    // Central 401 Unauthorized Session Handling: only dispatch if user previously had a token
    if (response.status === 401 && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:session_expired'));
    }

    return response;
  } catch (error) {
    console.error('API Request Network Failure:', error);
    throw error;
  }
}

/**
 * Convenience helper methods with JSON decoding
 */
export const api = {
  get: async (endpoint, options = {}) => {
    const res = await apiRequest(endpoint, { ...options, method: 'GET' });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  },

  post: async (endpoint, body, options = {}) => {
    const res = await apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  },

  put: async (endpoint, body, options = {}) => {
    const res = await apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  },

  delete: async (endpoint, options = {}) => {
    const res = await apiRequest(endpoint, { ...options, method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  },

  getBlob: async (endpoint, options = {}) => {
    const res = await apiRequest(endpoint, { ...options, method: 'GET' });
    if (!res.ok) {
      const err = new Error(`Request failed with status ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.blob();
  }
};

export default api;
