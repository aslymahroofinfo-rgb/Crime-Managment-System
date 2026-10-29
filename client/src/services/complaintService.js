import { api } from './api';

export const complaintService = {
  trackComplaint: async (complaintId, email) => {
    return api.post('/complaints/track', { complaintId, email });
  },

  getMyComplaints: async () => {
    return api.get('/complaints/my-complaints');
  },

  getAllComplaints: async () => {
    return api.get('/complaints/all');
  },

  getComplaintById: async (id) => {
    return api.get(`/complaints/${encodeURIComponent(id)}`);
  },

  submitComplaint: async (formData) => {
    return api.post('/complaints/submit', formData);
  },

  updateMyComplaint: async (id, data) => {
    return api.put(`/complaints/my/${encodeURIComponent(id)}`, data);
  },

  deleteMyComplaint: async (id) => {
    return api.delete(`/complaints/my/${encodeURIComponent(id)}`);
  },

  getEvidenceBlob: async (id, index) => {
    return api.getBlob(`/complaints/${encodeURIComponent(id)}/evidence/${index}`);
  }
};

export default complaintService;

