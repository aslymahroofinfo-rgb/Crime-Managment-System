import { api } from './api';

export const contactService = {
  submitInquiry: async (inquiryData) => {
    return api.post('/contact', inquiryData);
  },

  getAllInquiries: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/contact?${query}` : '/contact';
    return api.get(endpoint);
  },

  getInquiryById: async (id) => {
    return api.get(`/contact/${id}`);
  },

  updateStatus: async (id, status) => {
    return api.put(`/contact/${id}/status`, { status });
  }
};

export default contactService;

