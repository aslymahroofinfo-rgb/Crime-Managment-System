const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, index: true },
  district: { type: String, required: true, trim: true, index: true },
  incidentDate: { type: Date, required: true },
  incidentTime: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  suspectDetails: { type: String, default: '', trim: true },
  witnessDetails: { type: String, default: '', trim: true },
  evidenceFiles: [{ type: String }],
  isAnonymous: { type: Boolean, default: false, index: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Under Investigation', 'Resolved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  statusHistory: [
    {
      status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Under Investigation', 'Resolved', 'Rejected'],
        required: true 
      },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedByRole: { type: String, default: 'System' },
      changedByName: { type: String, default: '' },
      changedAt: { type: Date, default: Date.now },
      note: { type: String, default: '' }
    }
  ],
  isArchived: { type: Boolean, default: false, index: true },
  archivedAt: { type: Date, default: null },
  archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Compound Indexes supporting real administrative query patterns
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ district: 1, status: 1 });
complaintSchema.index({ isArchived: 1, createdAt: -1 });
complaintSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
