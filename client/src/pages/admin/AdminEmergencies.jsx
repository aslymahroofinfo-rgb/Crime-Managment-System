import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';

function formatDate(dateString) {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? String(dateString) : date.toLocaleDateString('en-US', options);
}

function getStatusBadge(status) {
  let badgeClass = 'bg-secondary';
  switch (status) {
    case 'Pending':
      badgeClass = 'bg-warning text-dark';
      break;
    case 'Under Investigation':
      badgeClass = 'bg-info text-dark';
      break;
    case 'Approved':
      badgeClass = 'bg-primary';
      break;
    case 'Rejected':
      badgeClass = 'bg-danger';
      break;
    case 'Resolved':
      badgeClass = 'bg-success';
      break;
    default:
      badgeClass = 'bg-secondary';
  }
  return <span className={`badge ${badgeClass} fs-7 px-2.5 py-1.5`}>{status}</span>;
}

export default function AdminEmergencies() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllComplaints();
      if (res.ok && Array.isArray(res.data)) {
        // Filter complaints where category is Emergency or flagged urgent
        const urgentItems = res.data.filter(c =>
          (c.category || '').toLowerCase() === 'emergency' ||
          c.isEmergency === true
        );
        setEmergencies(urgentItems);
      } else {
        setEmergencies([]);
      }
    } catch (err) {
      console.error('Failed to load emergencies:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header Block */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom g-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Emergency Reports</h2>
          <p className="text-muted mb-0 small">Quick review panel for urgent complaints only.</p>
        </div>
        <div>
          <Link to="/admin/complaints" className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i>All Complaints
          </Link>
        </div>
      </div>

      {/* Emergency Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-white py-3 border-0 d-flex align-items-center justify-content-between px-4 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
            <h5 className="fw-bold text-dark mb-0">Emergency Records</h5>
          </div>
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-1.5">
            {emergencies.length} Urgent Logs
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="text-muted small mt-2">Checking priority distress channels...</p>
            </div>
          ) : emergencies.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-shield-check text-success" style={{ fontSize: '3.5rem' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-1">No Emergency Complaints</h5>
              <p className="text-muted small">No urgent incident reports are currently pending priority triage.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted text-uppercase small">
                  <tr>
                    <th className="ps-4">Complaint ID</th>
                    <th>Citizen Name</th>
                    <th>District</th>
                    <th>Incident Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emergencies.map((c) => {
                    const citizenName = c.isAnonymous
                      ? 'Anonymous Report'
                      : (c.user?.fullName || c.userName || 'Citizen');

                    return (
                      <tr key={c.complaintId || c._id} className="table-danger bg-opacity-25">
                        <td className="ps-4 fw-bold text-dark font-monospace">{c.complaintId}</td>
                        <td>
                          {c.isAnonymous ? (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              <i className="bi bi-eye-slash-fill me-1"></i>Anonymous
                            </span>
                          ) : (
                            <span className="fw-semibold text-dark">{citizenName}</span>
                          )}
                        </td>
                        <td>{c.district || '-'}</td>
                        <td>{formatDate(c.incidentDate || c.createdAt)}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td className="text-end pe-4">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-2"
                            onClick={() => setSelectedCase(c)}
                          >
                            <i className="bi bi-eye-fill me-1"></i>Review
                          </button>
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

      {/* Emergency Detail Modal */}
      {selectedCase && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white border-0 py-3 bg-danger">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-octagon-fill me-2"></i>Priority Emergency File ({selectedCase.complaintId})
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedCase(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 p-sm-5 bg-white">
                <div className="row g-4">
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">District / Location</span>
                    <strong className="text-dark fs-5">{selectedCase.district || 'Unspecified'}</strong>
                    <div className="small text-muted">{selectedCase.location}</div>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Incident Timestamp</span>
                    <strong className="text-dark fs-5">{formatDate(selectedCase.incidentDate || selectedCase.createdAt)}</strong>
                    <div className="small text-muted">{selectedCase.incidentTime || ''}</div>
                  </div>

                  <div className="col-12">
                    <span className="text-muted small d-block">Emergency Description</span>
                    <div className="p-3 bg-light rounded-3 small text-dark border mt-1" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {selectedCase.description}
                    </div>
                  </div>

                  {(selectedCase.suspectDetails || selectedCase.witnessDetails) && (
                    <div className="col-12 pt-2 border-top">
                      <div className="row g-3">
                        {selectedCase.suspectDetails && (
                          <div className="col-md-6">
                            <span className="text-muted small d-block fw-semibold">Suspect Information</span>
                            <div className="p-2 bg-light rounded small border">{selectedCase.suspectDetails}</div>
                          </div>
                        )}
                        {selectedCase.witnessDetails && (
                          <div className="col-md-6">
                            <span className="text-muted small d-block fw-semibold">Witness Information</span>
                            <div className="p-2 bg-light rounded small border">{selectedCase.witnessDetails}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 bg-light p-3 rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2"
                  onClick={() => setSelectedCase(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
