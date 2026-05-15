import api from '../lib/axios.ts';

export const getDashboard = () => api.get('/api/dashboard').then((r) => r.data.data);
