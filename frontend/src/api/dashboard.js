import api from '../lib/axios.js';

export const getDashboard = () => api.get('/api/dashboard').then((r) => r.data.data);
