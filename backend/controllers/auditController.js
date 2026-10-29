const AuditLog = require('../models/AuditLog');
const { mockAuditLogs } = require('../mockData');

/**
 * SuperAdmin Only: Get Audit Logs (Newest First)
 * GET /api/audit
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const isPaginated = page !== undefined;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));

    if (global.useMockData) {
      const logs = [...(mockAuditLogs || [])];
      logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = logs.length;
      const resultList = isPaginated
        ? logs.slice((pageNum - 1) * limitNum, pageNum * limitNum)
        : logs.slice(0, limitNum);

      if (isPaginated) {
        return res.json({
          data: resultList,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum) || 1
          }
        });
      }

      return res.json(resultList);
    }

    const total = await AuditLog.countDocuments();
    let query = AuditLog.find().sort({ createdAt: -1 });

    if (isPaginated) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    } else {
      query = query.limit(limitNum);
    }

    const logs = await query;

    if (isPaginated) {
      return res.json({
        data: logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(logs);
  } catch (error) {
    console.error('Audit logs retrieval error:', error);
    res.status(500).json({ message: 'Server error retrieving audit logs.' });
  }
};

module.exports = {
  getAuditLogs
};
