const API_BASE = 'http://localhost:5000/api';

let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

// Generic fetch wrapper
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Set headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  const fetchOptions = {
    ...options,
    headers,
  };
  
  // For credentials like cookies
  if (options.credentials !== 'omit') {
    fetchOptions.credentials = 'include';
  }

  let response = await fetch(url, fetchOptions);
  
  // If unauthorized, try to refresh token (except on auth endpoints themselves)
  if (response.status === 401 && !options._retry && !endpoint.startsWith('/auth/')) {
    options._retry = true;
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.data.accessToken;
        
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${accessToken}`;
        response = await fetch(url, fetchOptions);
      } else {
        // Refresh token failed/expired
        accessToken = '';
        throw new Error('Session expired');
      }
    } catch (err) {
      accessToken = '';
      throw err;
    }
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = data?.message || response.statusText || 'Request failed';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  
  // Upload multipart form-data (for datasets)
  upload: (endpoint, formData, options = {}) => {
    const headers = { ...options.headers };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
      ...options,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      return data;
    });
  }
};
