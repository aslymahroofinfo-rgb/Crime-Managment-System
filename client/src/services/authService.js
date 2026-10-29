import { api } from './api';

export const authService = {
  login: async (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  getProfile: async () => {
    return api.get('/auth/profile');
  },

  updateProfile: async (profileData) => {
    return api.put('/auth/profile', profileData);
  }
};

export default authService;

