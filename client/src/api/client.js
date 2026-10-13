import axios from 'axios';

const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('placement_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for token expiration & seamless renewal
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthError =
      error.response &&
      (error.response.status === 401 ||
        (error.response.status === 403 &&
          (error.response.data?.message?.includes('token') || error.response.data?.message?.includes('authenticated'))));

    if (isAuthError && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      originalRequest._retry = true;
      try {
        const savedUserStr = localStorage.getItem('placement_user');
        let targetRole = 'SUPER_ADMIN';
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            if (parsed.roleName) targetRole = parsed.roleName;
          } catch (e) {}
        }

        // Request a freshly signed token for the active role session
        const refreshRes = await axios.post('/api/v1/auth/switch-role', { targetRole });
        if (refreshRes.data && refreshRes.data.token) {
          const newToken = refreshRes.data.token;
          localStorage.setItem('placement_token', newToken);
          if (refreshRes.data.user) {
            localStorage.setItem('placement_user', JSON.stringify(refreshRes.data.user));
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('placement_token');
        localStorage.removeItem('placement_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    if (isAuthError && originalRequest?._retry) {
      localStorage.removeItem('placement_token');
      localStorage.removeItem('placement_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
