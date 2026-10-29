import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const CATEGORY_COLORS = [
  'var(--primary)',
  'var(--bs-info)',
  'var(--bs-warning)',
  'var(--bs-danger)',
  'var(--bs-success)',
  'var(--bs-secondary)',
  '#6f42c1',
  '#d63384'
];

export default function AdminReports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    adminService.getAnalyticsOverview()
      .then((res) => {
        if (mounted) {
          if (res.ok && res.data) {
            setAnalytics(res.data);
          } else {
            setError(res.data?.message || 'Failed to retrieve analytics data.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Analytics overview error:', err);
        if (mounted) {
          setError(err.message || 'Network error fetching analytics.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted fw-semibold">Loading real-time operational analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger rounded-4 p-4 shadow-sm" role="alert">
        <h5 className="fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Analytics Error</h5>
        <p className="mb-0">{error}</p>
      </div>
    );
  }

  const data = analytics || {
    totalComplaints: 0,
    pending: 0,
    approved: 0,
    underInvestigation: 0,
    resolved: 0,
    rejected: 0,
    resolutionRate: 0,
    emergencyCount: 0,
    totalCitizens: 0,
    statusDistribution: [],
    categoryDistribution: [],
    districtDistribution: [],
    monthlyTrend: []
  };

  const total = data.totalComplaints;
  const resolutionRate = data.resolutionRate || 0;
  const activeCount = (data.underInvestigation || 0) + (data.approved || 0);

  return (
    <div>
      {/* Header Block */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom g-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">System Operational Analytics</h2>
          <p className="text-muted mb-0 small">
            Real-time aggregate performance metrics, intake distribution, and resolution ratios.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary btn-sm fw-semibold shadow-sm"
            style={{ background: 'var(--primary)', border: 'none' }}
            onClick={() => window.print()}
          >
            <i className="bi bi-printer-fill me-2"></i>Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Overview stats cards */}
      <div className="row g-4 mb-4">
        {/* Resolution Ratio Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 text-center">
            <span className="text-muted small fw-bold text-uppercase">Case Resolution Rate</span>
            <div className="my-3">
              <span className="display-4 fw-bold text-success">{resolutionRate}%</span>
            </div>
            <div className="progress mb-2" style={{ height: '8px' }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${resolutionRate}%` }}
                aria-valuenow={resolutionRate}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span className="text-muted small mt-1">Concluded ({data.resolved}) vs Total ({total}) cases</span>
          </div>
        </div>

        {/* Total Registry Intake Card */}
        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 text-center">
            <span className="text-muted small fw-bold text-uppercase">Total Registered Cases</span>
            <div className="my-3">
              <span className="display-4 fw-bold text-primary">{total}</span>
            </div>
            <div className="progress mb-2" style={{ height: '8px' }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: total > 0 ? '100%' : '0%' }}
                aria-valuenow={total}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span className="text-muted small mt-1">{data.pending} pending initial triage</span>
          </div>
        </div>

        {/* Active Investigations & Emergencies */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100 text-center">
            <span className="text-muted small fw-bold text-uppercase">Active Investigations</span>
            <div className="my-3">
              <span className="display-4 fw-bold text-warning">{activeCount}</span>
            </div>
            <div className="progress mb-2" style={{ height: '8px' }}>
              <div
                className="progress-bar bg-warning"
                role="progressbar"
                style={{ width: `${total > 0 ? Math.round((activeCount / total) * 100) : 0}%` }}
                aria-valuenow={activeCount}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <span className="text-muted small mt-1">{data.emergencyCount} high-priority emergency incidents</span>
          </div>
        </div>
      </div>

      {/* Categories & Incident Distribution Progress Bars */}
      <div className="row g-4 mb-4">
        {/* Distribution by Category */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-pie-chart-fill text-primary me-2"></i>Cases by Incident Category
            </h5>

            {data.categoryDistribution && data.categoryDistribution.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {data.categoryDistribution.map((item, idx) => {
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div key={item.category || idx}>
                      <div className="d-flex justify-content-between mb-1 small text-dark">
                        <span>{item.category}</span>
                        <strong>{pct}% ({item.count} Cases)</strong>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                          aria-valuenow={pct}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted small my-auto text-center py-4">No category incident records found.</p>
            )}
          </div>
        </div>

        {/* Status Breakdown & Lifecycle Distribution */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-bar-chart-steps text-success me-2"></i>Case Lifecycle Breakdown
            </h5>

            {data.statusDistribution && data.statusDistribution.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {data.statusDistribution.map((item) => {
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  let barClass = 'bg-primary';
                  if (item.status === 'Pending') barClass = 'bg-warning text-dark';
                  if (item.status === 'Approved') barClass = 'bg-info';
                  if (item.status === 'Under Investigation') barClass = 'bg-primary';
                  if (item.status === 'Resolved') barClass = 'bg-success';
                  if (item.status === 'Rejected') barClass = 'bg-danger';

                  return (
                    <div key={item.status}>
                      <div className="d-flex justify-content-between mb-1 small text-dark">
                        <span>{item.status}</span>
                        <strong>{pct}% ({item.count} Cases)</strong>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div
                          className={`progress-bar ${barClass}`}
                          role="progressbar"
                          style={{ width: `${pct}%` }}
                          aria-valuenow={pct}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted small my-auto text-center py-4">No status lifecycle data recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Intake Trend (Last 6 Months) */}
      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-calendar3-event-fill text-danger me-2"></i>Monthly Case Intake Trend (Last 6 Months)
            </h5>

            {data.monthlyTrend && data.monthlyTrend.length > 0 ? (
              <div className="row g-3 text-center">
                {data.monthlyTrend.map((m) => {
                  const maxCount = Math.max(...data.monthlyTrend.map(t => t.count), 1);
                  const heightPct = Math.max(Math.round((m.count / maxCount) * 100), 8);
                  return (
                    <div key={m.month} className="col-4 col-md-2">
                      <div className="p-3 bg-light rounded-3 h-100 d-flex flex-column justify-content-end align-items-center">
                        <span className="fw-bold text-primary fs-5 mb-1">{m.count}</span>
                        <div
                          className="w-50 bg-primary rounded-top mb-2"
                          style={{ height: `${heightPct}px`, minHeight: '8px', opacity: 0.85 }}
                        ></div>
                        <span className="text-muted small fw-semibold">{m.month}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted small my-auto text-center py-4">No monthly intake trend available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
