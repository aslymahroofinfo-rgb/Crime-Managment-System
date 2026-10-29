import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';

function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateStr);
  }
}

function getActionBadge(action) {
  switch (action) {
    case 'USER_LOGIN':
      return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">LOGIN</span>;
    case 'USER_LOGIN_FAILED':
      return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">LOGIN FAILED</span>;
    case 'COMPLAINT_CREATED':
      return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">COMPLAINT CREATED</span>;
    case 'COMPLAINT_STATUS_CHANGED':
      return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25">STATUS CHANGED</span>;
    case 'COMPLAINT_UPDATED':
      return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">COMPLAINT UPDATED</span>;
    case 'COMPLAINT_DELETED_OR_ARCHIVED':
      return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">DELETED / ARCHIVED</span>;
    case 'USER_PROMOTED':
      return <span className="badge bg-purple bg-opacity-10 text-dark border border-purple border-opacity-25" style={{ background: '#f3e8ff' }}>USER PROMOTED</span>;
    case 'USER_DELETED_OR_DEACTIVATED':
      return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">USER DELETED</span>;
    case 'CONTACT_STATUS_CHANGED':
      return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">INQUIRY STATUS</span>;
    case 'PROFILE_UPDATED':
      return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">PROFILE UPDATED</span>;
    default:
      return <span className="badge bg-light text-dark border">{action}</span>;
  }
}

export default function AdminAudit() {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    adminService.getAuditLogs(200)
      .then(res => {
        if (mounted) {
          if (res.ok && Array.isArray(res.data)) {
            setLogs(res.data);
          } else {
            setError(res.data?.message || 'Failed to fetch audit log trail.');
          }
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Audit log fetch error:', err);
        if (mounted) {
          setError(err.message || 'Network error fetching audit logs.');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="card border-0 shadow-sm rounded-4 bg-white p-5 text-center my-4">
        <div className="text-danger mb-3">
          <i className="bi bi-shield-slash-fill fs-1"></i>
        </div>
        <h4 className="fw-bold text-dark mb-2">SuperAdmin Privileges Required</h4>
        <p className="text-muted small col-md-6 mx-auto mb-0">
          Access to immutable system audit trails is strictly restricted to designated SuperAdmin supervisors.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter(item => {
    if (filterAction !== 'ALL' && item.action !== filterAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchActor = (item.actorEmail || item.actor || '').toLowerCase().includes(q);
      const matchEntity = (item.entityId || item.entityType || '').toLowerCase().includes(q);
      const matchAction = (item.action || '').toLowerCase().includes(q);
      return matchActor || matchEntity || matchAction;
    }
    return true;
  });

  return (
    <div>
      {/* Header Block */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom g-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">System Security Audit Logs</h2>
          <p className="text-muted mb-0 small">
            SuperAdmin-restricted immutable trail of administrative actions, authentication attempts, and lifecycle transitions.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm fw-semibold shadow-sm"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer-fill me-2"></i>Print Audit Log
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-7">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control bg-light border-0"
                placeholder="Search by actor email, entity ID, action..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-light border-0" onClick={() => setSearchQuery('')}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-md-5">
            <select
              className="form-select form-select-sm bg-light border-0"
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            >
              <option value="ALL">All Actions ({logs.length})</option>
              <option value="USER_LOGIN">User Logins</option>
              <option value="COMPLAINT_CREATED">Complaint Submissions</option>
              <option value="COMPLAINT_STATUS_CHANGED">Complaint Status Changes</option>
              <option value="COMPLAINT_UPDATED">Complaint Edits</option>
              <option value="COMPLAINT_DELETED_OR_ARCHIVED">Complaint Deletions</option>
              <option value="USER_PROMOTED">User Promotions</option>
              <option value="USER_DELETED_OR_DEACTIVATED">User Deletions</option>
              <option value="CONTACT_STATUS_CHANGED">Contact Status Changes</option>
              <option value="PROFILE_UPDATED">Profile Updates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
            <p className="text-muted small mb-0">Loading cryptographic audit trail...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-danger">
            <i className="bi bi-exclamation-triangle-fill fs-2 mb-2 d-block"></i>
            <p className="mb-0">{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <i className="bi bi-clipboard-x fs-1 mb-2 d-block text-secondary"></i>
            <p className="mb-0 fw-semibold">No audit log records match the selected criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr className="small text-muted fw-bold">
                  <th scope="col" className="ps-4">Timestamp</th>
                  <th scope="col">Action</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Target Entity</th>
                  <th scope="col" className="pe-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="small">
                {filteredLogs.map(item => {
                  const metaEntries = item.metadata && typeof item.metadata === 'object'
                    ? Object.entries(item.metadata)
                    : [];

                  return (
                    <tr key={item._id || item.id}>
                      <td className="ps-4 text-muted font-monospace" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td>
                        {getActionBadge(item.action)}
                      </td>
                      <td>
                        <span className="fw-semibold text-dark d-block" style={{ fontSize: '0.8rem' }}>
                          {item.actorEmail || item.actor}
                        </span>
                        <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
                          {item.actorRole || 'System'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border me-1 font-monospace" style={{ fontSize: '0.72rem' }}>
                          {item.entityType}
                        </span>
                        <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                          {item.entityId || '-'}
                        </span>
                      </td>
                      <td className="pe-4">
                        {metaEntries.length > 0 ? (
                          <div className="d-flex flex-wrap gap-1">
                            {metaEntries.map(([k, v]) => (
                              <span key={k} className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>
                                <strong className="text-secondary">{k}:</strong> {String(v)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted fst-italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

