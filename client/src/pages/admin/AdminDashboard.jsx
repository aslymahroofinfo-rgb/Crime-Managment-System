import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

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

export default function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localTime, setLocalTime] = useState('');
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Modals State
  const [viewComplaint, setViewComplaint] = useState(null);
  const [statusModalComplaint, setStatusModalComplaint] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const [statusLoading, setStatusLoading] = useState(false);

  const [deleteModalComplaint, setDeleteModalComplaint] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Update live local time display
    setLocalTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }, 30000);

    fetchDashboardData();

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resComplaints, resUsers] = await Promise.all([
        adminService.getAllComplaints(),
        adminService.getUserCount()
      ]);

      if (resComplaints.ok && Array.isArray(resComplaints.data)) {
        setComplaints(resComplaints.data);
      } else {
        setComplaints([]);
      }

      if (resUsers.ok && resUsers.data?.total !== undefined) {
        setUserCount(resUsers.data.total);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setAlertFeedback({ type: 'danger', message: 'Failed to connect to backend service.' });
    } finally {
      setLoading(false);
    }
  };

  // Stats Counters
  const statTotal = complaints.length;
  const statPending = complaints.filter(c => c.status === 'Pending').length;
  const statInvestigating = complaints.filter(c => c.status === 'Under Investigation').length;
  const statResolved = complaints.filter(c => c.status === 'Resolved').length;

  // Status Change Submit
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusModalComplaint) return;
    setStatusLoading(true);

    try {
      const res = await adminService.updateComplaintStatus(
        statusModalComplaint.complaintId || statusModalComplaint._id,
        selectedStatus
      );

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Case ${statusModalComplaint.complaintId} status updated to ${selectedStatus}.`
        });
        setStatusModalComplaint(null);
        await fetchDashboardData();
      } else {
        setAlertFeedback({
          type: 'danger',
          message: res.data?.message || 'Failed to update case status.'
        });
      }
    } catch (err) {
      console.error('Status update failure:', err);
      setAlertFeedback({ type: 'danger', message: 'Error applying status update.' });
    } finally {
      setStatusLoading(false);
    }
  };

  // Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deleteModalComplaint) return;
    setDeleteLoading(true);

    try {
      const res = await adminService.deleteComplaint(
        deleteModalComplaint.complaintId || deleteModalComplaint._id
      );

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Case ${deleteModalComplaint.complaintId} deleted permanently.`
        });
        setDeleteModalComplaint(null);
        await fetchDashboardData();
      } else {
        setAlertFeedback({
          type: 'danger',
          message: res.data?.message || 'Failed to delete complaint record.'
        });
      }
    } catch (err) {
      console.error('Delete complaint failure:', err);
      setAlertFeedback({ type: 'danger', message: 'Error executing record deletion.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleTitle = isSuperAdmin ? 'Super Administrator' : 'System Administrator';

  return (
    <>
      {/* Alert Feedback Banner */}
      {alertFeedback && (
        <div className={`alert alert-${alertFeedback.type} alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4`} role="alert">
          <i className={`bi bi-${alertFeedback.type === 'success' ? 'check-circle' : 'exclamation-octagon'}-fill me-2`}></i>
          {alertFeedback.message}
          <button type="button" className="btn-close" onClick={() => setAlertFeedback(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Header Block */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom g-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Administrative Overview</h2>
          <p className="text-muted mb-0 small">
            Welcome back, <strong>{roleTitle}</strong>. System operations status report and active complaints.
          </p>
        </div>
        <div className="bg-white rounded-3 px-3 py-2 shadow-sm border">
          <span className="text-muted small">
            <i className="bi bi-clock me-1 text-primary"></i>Local Time:
          </span>
          <strong className="text-dark small ms-1">{localTime || 'Live'}</strong>
        </div>
      </div>

      {/* Statistics Dashboard Cards */}
      <div className="row g-4 mb-4">
        {/* Total Complaints */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-primary">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Total Complaints</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{statTotal}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                <i className="bi bi-clipboard-data-fill fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Complaints */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-warning">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Pending Cases</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{statPending}</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3">
                <i className="bi bi-hourglass-split fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Resolved Complaints */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-success">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Resolved Cases</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{statResolved}</h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                <i className="bi bi-patch-check-fill fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Users */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-info">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Registered Users</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{userCount}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-3">
                <i className="bi bi-people-fill fs-3"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Management Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-white py-3 border-0 d-flex align-items-center justify-content-between px-4 border-bottom">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-file-earmark-text-fill text-primary me-2"></i>Complaints Management
          </h5>
          <div className="d-flex align-items-center gap-2">
            <Link to="/admin/complaints" className="btn btn-sm btn-outline-primary">
              Full Registry
            </Link>
            <span className="badge bg-light text-muted border py-2 px-3 small">Active Records</span>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading administrative records...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard2-x text-muted" style={{ fontSize: '3.5rem' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-1">No Complaints in Database</h5>
              <p className="text-muted small">All records have been processed or deleted.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted text-uppercase small">
                  <tr>
                    <th className="ps-4">Complaint ID</th>
                    <th>Citizen Name</th>
                    <th>Category</th>
                    <th>Incident Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.slice(0, 10).map((c) => {
                    const citizenName = c.isAnonymous
                      ? 'Anonymous Report'
                      : (c.user?.fullName || c.userName || 'Citizen');

                    return (
                      <tr key={c.complaintId || c._id}>
                        <td className="ps-4 fw-bold text-dark font-monospace">
                          {c.complaintId}
                        </td>
                        <td>
                          {c.isAnonymous ? (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary">
                              <i className="bi bi-eye-slash-fill me-1"></i>Anonymous
                            </span>
                          ) : (
                            <span className="fw-semibold text-dark">{citizenName}</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1.5">
                            {c.category}
                          </span>
                        </td>
                        <td>{formatDate(c.incidentDate || c.createdAt)}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td className="text-end pe-4">
                          <div className="btn-group gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-2"
                              onClick={() => setViewComplaint(c)}
                              title="Review Details"
                            >
                              <i className="bi bi-eye-fill"></i>
                              <span className="d-none d-md-inline ms-1">View</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-2"
                              onClick={() => {
                                setStatusModalComplaint(c);
                                setSelectedStatus(c.status || 'Pending');
                              }}
                              title="Update Status"
                            >
                              <i className="bi bi-pencil-square"></i>
                              <span className="d-none d-md-inline ms-1">Status</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-2"
                              onClick={() => setDeleteModalComplaint(c)}
                              title="Delete Record"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
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

      {/* ============================================================
           VIEW COMPLAINT DETAILS MODAL
           ============================================================ */}
      {viewComplaint && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white border-0 py-3" style={{ background: 'var(--primary-dark)' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-file-earmark-text-fill me-2"></i>Review Complaint Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setViewComplaint(null)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 p-sm-5 bg-white">
                <div className="row g-4">
                  <div className="col-sm-6 col-md-4">
                    <span className="text-muted small d-block">Complaint ID</span>
                    <strong className="text-dark fs-5 font-monospace">{viewComplaint.complaintId}</strong>
                  </div>
                  <div className="col-sm-6 col-md-4">
                    <span className="text-muted small d-block">Citizen Information</span>
                    <strong className="text-dark fs-6">
                      {viewComplaint.isAnonymous
                        ? 'Anonymous Report'
                        : (viewComplaint.user?.fullName || viewComplaint.userName || 'Registered Citizen')}
                    </strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Current Status</span>
                    <div className="mt-1">{getStatusBadge(viewComplaint.status)}</div>
                  </div>

                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Category</span>
                    <strong className="text-dark">{viewComplaint.category}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Incident Date</span>
                    <strong className="text-dark">{formatDate(viewComplaint.incidentDate || viewComplaint.createdAt)}</strong>
                  </div>

                  <div className="col-12">
                    <span className="text-muted small d-block">Complaint Title / Summary</span>
                    <h5 className="fw-bold text-dark mt-1">{viewComplaint.title || 'Incident Report'}</h5>
                  </div>

                  <div className="col-12">
                    <span className="text-muted small d-block mb-1">Incident Narrative Details</span>
                    <div className="p-3 bg-light rounded-3 small text-dark border" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {viewComplaint.description}
                    </div>
                  </div>

                  {(viewComplaint.suspectDetails || viewComplaint.witnessDetails) && (
                    <div className="col-12 pt-2 border-top">
                      <div className="row g-3">
                        {viewComplaint.suspectDetails && (
                          <div className="col-md-6">
                            <span className="text-muted small d-block fw-semibold">Suspect Details</span>
                            <div className="p-2 bg-light rounded small border">{viewComplaint.suspectDetails}</div>
                          </div>
                        )}
                        {viewComplaint.witnessDetails && (
                          <div className="col-md-6">
                            <span className="text-muted small d-block fw-semibold">Witness Details</span>
                            <div className="p-2 bg-light rounded small border">{viewComplaint.witnessDetails}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {Array.isArray(viewComplaint.evidenceFiles) && viewComplaint.evidenceFiles.length > 0 && (
                    <div className="col-12 pt-2 border-top">
                      <span className="text-muted small d-block mb-2 fw-semibold">
                        Evidence Attachments ({viewComplaint.evidenceFiles.length})
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {viewComplaint.evidenceFiles.map((file, idx) => (
                          <span key={idx} className="badge bg-light text-dark border p-2">
                            <i className="bi bi-paperclip me-1 text-primary"></i>Evidence #{idx + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 bg-light p-3 rounded-bottom-4">
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2"
                  onClick={() => setViewComplaint(null)}
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           UPDATE STATUS MODAL
           ============================================================ */}
      {statusModalComplaint && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white border-0 py-3" style={{ background: 'var(--primary-dark)' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-arrow-repeat me-2"></i>Update Case Status
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setStatusModalComplaint(null)}
                  disabled={statusLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 bg-white">
                <form onSubmit={handleStatusSubmit}>
                  <p className="text-muted small mb-3">
                    Changing status for case <strong className="font-monospace text-dark">{statusModalComplaint.complaintId}</strong>:
                  </p>
                  <div className="mb-4">
                    <label htmlFor="selectStatus" className="form-label small fw-semibold text-muted">
                      Select New Investigation State
                    </label>
                    <select
                      className="form-select bg-light"
                      id="selectStatus"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Under Investigation">Under Investigation</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2"
                      onClick={() => setStatusModalComplaint(null)}
                      disabled={statusLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2 shadow-sm"
                      style={{ background: 'var(--primary)', border: 'none' }}
                      disabled={statusLoading}
                    >
                      {statusLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Applying...
                        </>
                      ) : (
                        'Apply Status Change'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
           DELETE CONFIRMATION MODAL
           ============================================================ */}
      {deleteModalComplaint && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-body p-4 text-center">
                <div className="mb-3">
                  <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '3.5rem' }}></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Delete Confirmation</h5>
                <p className="text-muted small mb-4">
                  Are you sure you want to delete case <strong className="font-monospace text-dark">{deleteModalComplaint.complaintId}</strong>?
                  This action cannot be undone and will permanently remove it from the database.
                </p>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setDeleteModalComplaint(null)}
                    disabled={deleteLoading}
                  >
                    NO
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 py-2 shadow-sm"
                    onClick={handleDeleteSubmit}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : (
                      'YES'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
