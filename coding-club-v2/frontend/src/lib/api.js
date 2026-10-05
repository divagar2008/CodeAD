import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  // AI review can take up to 120s server-side; keep a comfortable margin.
  timeout: 150000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Send the session back to its own sign-in page: students to /login,
      // the administrator to /admin/login (its separate credentials page).
      let wasAdmin = false;
      try { wasAdmin = JSON.parse(localStorage.getItem('cc_user') || 'null')?.role === 'admin'; } catch {}
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = wasAdmin ? '/admin/login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
