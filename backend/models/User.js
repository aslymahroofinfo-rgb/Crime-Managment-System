const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  nationalId: { type: String, required: true, trim: true },
  address: {
    no: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true }
  },
  citizenId: { type: String, unique: true, sparse: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Citizen', 'Admin', 'SuperAdmin'], 
    default: 'Citizen',
    index: true
  },
  permissions: {
    manageComplaints: { type: Boolean, default: true },
    manageEmergencies: { type: Boolean, default: true },
    manageUsers: { type: Boolean, default: true },
    manageInquiries: { type: Boolean, default: true },
    viewReports: { type: Boolean, default: true },
    manageSettings: { type: Boolean, default: true },
    viewAuditLogs: { type: Boolean, default: false },
    viewSecurityMetadata: { type: Boolean, default: false },
    manageAdministrators: { type: Boolean, default: false }
  },
  mustChangePassword: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Compound and operational indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'address.district': 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
