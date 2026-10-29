import { api } from './api';

export const adminService = {
  // Complaints
  getAllComplaints: async () => {
    return api.get('/complaints/all');
  },

  updateComplaintStatus: async (id, status, note = '') => {
    return api.put(`/complaints/${encodeURIComponent(id)}/status`, { status, note });
  },

  deleteComplaint: async (id) => {
    return api.delete(`/complaints/${encodeURIComponent(id)}`);
  },

  getEvidenceBlob: async (id, index) => {
    return api.getBlob(`/complaints/${encodeURIComponent(id)}/evidence/${index}`);
  },

  // Analytics & Intelligence
  getAnalyticsOverview: async () => {
    return api.get('/analytics/overview');
  },

  getPublicStats: async () => {
    return api.get('/public/stats');
  },

  // SuperAdmin Audit Logs
  getAuditLogs: async (limit = 100) => {
    return api.get(`/audit?limit=${limit}`);
  },

  // Users & Administration
  getAllUsers: async () => {
    return api.get('/users/all');
  },

  getAllAdmins: async () => {
    return api.get('/users/admins');
  },

  getUserCount: async () => {
    return api.get('/users/count');
  },

  deleteUser: async (id) => {
    return api.delete(`/users/${encodeURIComponent(id)}`);
  },

  promoteUserToAdmin: async (id) => {
    return api.put(`/users/${encodeURIComponent(id)}/promote`);
  }
};

export default adminService;

