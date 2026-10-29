const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { mockComplaints, mockUsers, mockAuditLogs } = require('../mockData');

const EMERGENCY_KEYWORDS = ['assault', 'robbery', 'murder', 'kidnapping', 'domestic', 'theft', 'weapon', 'violence', 'altercation'];

function isEmergency(complaint) {
  const cat = String(complaint.category || '').toLowerCase();
  const title = String(complaint.title || '').toLowerCase();
  return EMERGENCY_KEYWORDS.some(k => cat.includes(k) || title.includes(k));
}

/**
 * Helper to build last 6 months buckets
 */
function getLast6MonthsBuckets() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    months.push({ key, label, count: 0 });
  }
  return months;
}

/**
 * Admin: Comprehensive System Analytics Overview
 * GET /api/analytics/overview
 */
const getAnalyticsOverview = async (req, res) => {
  try {
    if (global.useMockData) {
      const complaints = mockComplaints || [];
      const citizens = (mockUsers || []).filter(u => u.role === 'Citizen');

      const totalComplaints = complaints.length;
      const pending = complaints.filter(c => (c.status || '').toLowerCase() === 'pending').length;
      const approved = complaints.filter(c => (c.status || '').toLowerCase() === 'approved').length;
      const underInvestigation = complaints.filter(c => (c.status || '').toLowerCase() === 'under investigation').length;
      const resolved = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
      const rejected = complaints.filter(c => (c.status || '').toLowerCase() === 'rejected').length;

      const resolutionRate = totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;
      const emergencyCount = complaints.filter(isEmergency).length;
      const totalCitizens = citizens.length;

      // Status Distribution
      const statusOrder = ['Pending', 'Approved', 'Under Investigation', 'Resolved', 'Rejected'];
      const statusDistribution = statusOrder.map(st => {
        const count = complaints.filter(c => (c.status || '').toLowerCase() === st.toLowerCase()).length;
        return { status: st, count };
      });

      // Category Distribution
      const categoryMap = {};
      complaints.forEach(c => {
        const cat = c.category ? c.category.trim() : 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
      const categoryDistribution = Object.entries(categoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // District Distribution
      const districtMap = {};
      complaints.forEach(c => {
        const dist = c.district ? c.district.trim() : 'Unspecified';
        districtMap[dist] = (districtMap[dist] || 0) + 1;
      });
      const districtDistribution = Object.entries(districtMap)
        .map(([district, count]) => ({ district, count }))
        .sort((a, b) => b.count - a.count);

      // Monthly Trend (Last 6 Months)
      const monthlyBuckets = getLast6MonthsBuckets();
      complaints.forEach(c => {
        if (!c.createdAt) return;
        const d = new Date(c.createdAt);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const b = monthlyBuckets.find(item => item.key === key);
        if (b) b.count += 1;
      });
      const monthlyTrend = monthlyBuckets.map(item => ({ month: item.label, count: item.count }));

      // Recent Activity
      const recentActivity = [];
      // 1. Recent status changes from statusHistory
      complaints.forEach(c => {
        if (Array.isArray(c.statusHistory)) {
          c.statusHistory.forEach(h => {
            recentActivity.push({
              type: 'STATUS_CHANGE',
              complaintId: c.complaintId,
              title: c.title,
              status: h.status,
              changedByRole: h.changedByRole || 'Admin',
              timestamp: h.changedAt || c.createdAt
            });
          });
        }
      });
      // 2. Recent complaint submissions
      complaints.forEach(c => {
        recentActivity.push({
          type: 'COMPLAINT_FILED',
          complaintId: c.complaintId,
          title: c.title,
          category: c.category,
          district: c.district,
          timestamp: c.createdAt
        });
      });
      recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return res.json({
        totalComplaints,
        pending,
        approved,
        underInvestigation,
        resolved,
        rejected,
        resolutionRate,
        emergencyCount,
        totalCitizens,
        statusDistribution,
        categoryDistribution,
        districtDistribution,
        monthlyTrend,
        recentActivity: recentActivity.slice(0, 10),
        serverTimestamp: new Date().toISOString()
      });
    }

    // ==========================================
    // MongoDB Aggregations Mode
    // ==========================================
    const totalComplaints = await Complaint.countDocuments();
    const pending = await Complaint.countDocuments({ status: 'Pending' });
    const approved = await Complaint.countDocuments({ status: 'Approved' });
    const underInvestigation = await Complaint.countDocuments({ status: 'Under Investigation' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const rejected = await Complaint.countDocuments({ status: 'Rejected' });

    const totalCitizens = await User.countDocuments({ role: 'Citizen' });
    const resolutionRate = totalComplaints > 0 ? Math.round((resolved / totalComplaints) * 100) : 0;

    // Status Distribution
    const statusOrder = ['Pending', 'Approved', 'Under Investigation', 'Resolved', 'Rejected'];
    const statusDistribution = [
      { status: 'Pending', count: pending },
      { status: 'Approved', count: approved },
      { status: 'Under Investigation', count: underInvestigation },
      { status: 'Resolved', count: resolved },
      { status: 'Rejected', count: rejected }
    ];

    // Category Distribution via Mongo Aggregation
    const categoryAgg = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const categoryDistribution = categoryAgg.map(item => ({
      category: item._id || 'Other',
      count: item.count
    }));

    // District Distribution via Mongo Aggregation
    const districtAgg = await Complaint.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const districtDistribution = districtAgg.map(item => ({
      district: item._id || 'Unspecified',
      count: item.count
    }));

    // Emergency Count
    const emergencyRegex = new RegExp(EMERGENCY_KEYWORDS.join('|'), 'i');
    const emergencyCount = await Complaint.countDocuments({
      $or: [
        { category: emergencyRegex },
        { title: emergencyRegex }
      ]
    });

    // Monthly Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyAgg = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyBuckets = getLast6MonthsBuckets();
    monthlyAgg.forEach(entry => {
      const key = `${entry._id.year}-${String(entry._id.month).padStart(2, '0')}`;
      const b = monthlyBuckets.find(item => item.key === key);
      if (b) b.count = entry.count;
    });
    const monthlyTrend = monthlyBuckets.map(item => ({ month: item.label, count: item.count }));

    // Recent Activity: newest 10 complaints
    const recentDocs = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('complaintId title category district status createdAt');
    const recentActivity = recentDocs.map(c => ({
      type: 'COMPLAINT_FILED',
      complaintId: c.complaintId,
      title: c.title,
      category: c.category,
      district: c.district,
      status: c.status,
      timestamp: c.createdAt
    }));

    res.json({
      totalComplaints,
      pending,
      approved,
      underInvestigation,
      resolved,
      rejected,
      resolutionRate,
      emergencyCount,
      totalCitizens,
      statusDistribution,
      categoryDistribution,
      districtDistribution,
      monthlyTrend,
      recentActivity,
      serverTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ message: 'Server error occurred while computing analytics.' });
  }
};

/**
 * Public: Safe Aggregate Statistics for Homepage
 * GET /api/public/stats
 */
const getPublicStats = async (req, res) => {
  try {
    if (global.useMockData) {
      const complaints = mockComplaints || [];
      const totalComplaints = complaints.length;
      const resolvedComplaints = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
      const activeInvestigations = complaints.filter(c => {
        const s = (c.status || '').toLowerCase();
        return s === 'under investigation' || s === 'approved';
      }).length;
      const registeredCitizens = (mockUsers || []).filter(u => u.role === 'Citizen').length;
      const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

      return res.json({
        totalComplaints,
        resolvedComplaints,
        activeInvestigations,
        registeredCitizens,
        resolutionRate
      });
    }

    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const activeInvestigations = await Complaint.countDocuments({
      status: { $in: ['Under Investigation', 'Approved'] }
    });
    const registeredCitizens = await User.countDocuments({ role: 'Citizen' });
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    res.json({
      totalComplaints,
      resolvedComplaints,
      activeInvestigations,
      registeredCitizens,
      resolutionRate
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ message: 'Server error retrieving statistics' });
  }
};

module.exports = {
  getAnalyticsOverview,
  getPublicStats
};

