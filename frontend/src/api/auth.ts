import api from '../lib/axios.ts';

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  googleAuth: (data: { credential: string }) =>
    api.post('/api/auth/google', data),
  me: () => api.get('/api/auth/me'),
};
