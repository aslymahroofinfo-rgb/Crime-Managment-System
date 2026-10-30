import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const CATEGORIES = [
  'Theft', 'Assault', 'Cyber Crime', 'Domestic Violence',
  'Missing Person', 'Fraud', 'Other'
];

const STATUSES = ['Pending', 'Approved', 'Under Investigation', 'Resolved', 'Rejected'];

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

// Sub-component for authenticated evidence file
export function AdminEvidenceCard({ complaintId, filename, index }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cleanName = String(filename || '').replace(/^(uploads[/\\])+/, '');
  const ext = cleanName.includes('.') ? cleanName.substring(cleanName.lastIndexOf('.')).toLowerCase() : '';
  const labelText = `Evidence ${index + 1}`;

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    async function loadFile() {
      try {
        const blob = await adminService.getEvidenceBlob(complaintId, index);
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch (err) {
        if (!active) return;
        console.error(`Failed to load evidence ${index}:`, err);
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFile();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [complaintId, index]);

  if (loading) {
    return (
      <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '160px', width: '130px' }}>
        <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Loading #{index + 1}...</div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '160px', width: '130px' }}>
        <i className="bi bi-exclamation-triangle text-warning fs-2 d-block mb-1"></i>
        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Evidence unavailable</span>
      </div>
    );
  }

  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    return (
      <div className="p-2 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '160px', width: '130px' }}>
        <div className="w-100 text-center mb-1" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyItems: 'center', overflow: 'hidden' }}>
          <img src={blobUrl} alt={labelText} className="img-fluid rounded border mx-auto" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
        <span className="text-dark small fw-semibold text-truncate w-100" style={{ fontSize: '0.75rem' }}>{labelText}</span>
        <div className="d-flex gap-1 w-100 justify-content-center mt-1">
          <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.68rem' }}>View</a>
          <a href={blobUrl} download={`evidence-${index + 1}${ext}`} className="btn btn-sm btn-primary py-0 px-2 text-white" style={{ fontSize: '0.68rem' }}>Get</a>
        </div>
      </div>
    );
  }

  if (ext === '.pdf') {
    return (
      <div className="p-2 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '160px', width: '130px' }}>
        <div className="w-100 text-center my-auto">
          <i className="bi bi-file-earmark-pdf-fill fs-1 text-danger d-block"></i>
          <span className="badge bg-danger bg-opacity-10 text-danger" style={{ fontSize: '0.65rem' }}>PDF</span>
        </div>
        <span className="text-dark small fw-semibold text-truncate w-100" style={{ fontSize: '0.75rem' }}>{labelText}</span>
        <div className="d-flex gap-1 w-100 justify-content-center mt-1">
          <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.68rem' }}>View</a>
          <a href={blobUrl} download={`evidence-${index + 1}.pdf`} className="btn btn-sm btn-primary py-0 px-2 text-white" style={{ fontSize: '0.68rem' }}>Get</a>
        </div>
      </div>
    );
  }

  if (ext === '.mp4') {
    return (
      <div className="p-2 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '160px', width: '130px' }}>
        <div className="w-100 text-center my-auto">
          <video controls preload="metadata" className="rounded border" style={{ maxHeight: '80px', maxWidth: '100%' }}>
            <source src={blobUrl} type="video/mp4" />
          </video>
        </div>
        <span className="text-dark small fw-semibold text-truncate w-100" style={{ fontSize: '0.75rem' }}>{labelText}</span>
        <div className="d-flex gap-1 w-100 justify-content-center mt-1">
          <a href={blobUrl} download={`evidence-${index + 1}.mp4`} className="btn btn-sm btn-primary py-0 px-2 text-white" style={{ fontSize: '0.68rem' }}>Download</a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '160px', width: '130px' }}>
      <div className="w-100 text-center my-auto">
        <i className="bi bi-file-earmark-text-fill fs-1 text-primary"></i>
      </div>
      <span className="text-dark small fw-semibold text-truncate w-100" style={{ fontSize: '0.75rem' }}>{labelText}</span>
      <div className="d-flex gap-1 w-100 justify-content-center mt-1">
        <a href={blobUrl} download={`evidence-${index + 1}${ext}`} className="btn btn-sm btn-primary py-0 px-2 text-white" style={{ fontSize: '0.68rem' }}>Download</a>
      </div>
    </div>
  );
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals
  const [viewComplaint, setViewComplaint] = useState(null);
  const [statusComplaint, setStatusComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('Pending');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [deleteComplaint, setDeleteComplaint] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllComplaints();
      if (res.ok && Array.isArray(res.data)) {
        setComplaints(res.data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Error fetching admin complaints:', err);
      setAlertFeedback({ type: 'danger', message: 'Failed to retrieve complaints registry from backend.' });
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const cid = (c.complaintId || '').toLowerCase();
        const title = (c.title || '').toLowerCase();
        const citizen = (c.user?.fullName || c.userName || '').toLowerCase();
        if (!cid.includes(q) && !title.includes(q) && !citizen.includes(q)) {
          return false;
        }
      }

      // Category
      if (category && c.category !== category) {
        return false;
      }

      // Status
      if (status && c.status !== status) {
        return false;
      }

      // District
      if (district && c.district !== district) {
        return false;
      }

      // Date Filters
      if (filterDay || filterMonth || filterYear) {
        const d = new Date(c.incidentDate || c.createdAt);
        if (isNaN(d.getTime())) return false;

        if (filterDay) {
          const dayStr = String(d.getDate()).padStart(2, '0');
          if (dayStr !== filterDay) return false;
        }
        if (filterMonth) {
          const monthStr = String(d.getMonth() + 1).padStart(2, '0');
          if (monthStr !== filterMonth) return false;
        }
        if (filterYear) {
          const yearStr = String(d.getFullYear());
          if (yearStr !== filterYear) return false;
        }
      }

      return true;
    });
  }, [complaints, search, category, status, district, filterDay, filterMonth, filterYear]);

  // Paginated records
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(start, start + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setDistrict('');
    setFilterDay('');
    setFilterMonth('');
    setFilterYear('');
    setCurrentPage(1);
  };

  // Status Change
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusComplaint) return;
    setStatusUpdating(true);

    try {
      const res = await adminService.updateComplaintStatus(
        statusComplaint.complaintId || statusComplaint._id,
        newStatus
      );

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Case ${statusComplaint.complaintId} status transitioned to "${newStatus}".`
        });
        setStatusComplaint(null);
        await fetchComplaints();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Status transition failed.' });
      }
    } catch (err) {
      console.error('Status transition failure:', err);
      setAlertFeedback({ type: 'danger', message: 'Server communication error during status update.' });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async () => {
    if (!deleteComplaint) return;
    setDeleting(true);

    try {
      const res = await adminService.deleteComplaint(
        deleteComplaint.complaintId || deleteComplaint._id
      );

      if (res.ok) {
        setAlertFeedback({
          type: 'success',
          message: `Record ${deleteComplaint.complaintId} has been permanently deleted.`
        });
        setDeleteComplaint(null);
        await fetchComplaints();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Failed to delete record.' });
      }
    } catch (err) {
      console.error('Delete complaint error:', err);
      setAlertFeedback({ type: 'danger', message: 'Server error deleting complaint.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Alert Feedback */}
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
          <h2 className="fw-bold text-dark mb-1">Incident Reports Registry</h2>
          <p className="text-muted mb-0 small">Secure management and review panel for all logged public complaints.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/admin/emergencies" className="btn btn-sm btn-danger shadow-sm">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>View Emergency Reports
          </Link>
        </div>
      </div>

      {/* Filter Bar Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white mb-4 p-3">
        <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); }} className="row g-2 align-items-end">
          {/* Search */}
          <div className="col-md-3">
            <label className="form-label small fw-bold text-muted mb-1">Search</label>
            <input
              type="text"
              className="form-control form-control-sm bg-light"
              placeholder="Citizen Name, Title, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="col-md-2">
            <label className="form-label small fw-bold text-muted mb-1">Category</label>
            <select
              className="form-select form-select-sm bg-light"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="col-md-2">
            <label className="form-label small fw-bold text-muted mb-1">Status</label>
            <select
              className="form-select form-select-sm bg-light"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="col-md-2">
            <label className="form-label small fw-bold text-muted mb-1">District</label>
            <select
              className="form-select form-select-sm bg-light"
              value={district}
              onChange={(e) => { setDistrict(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Districts</option>
              {DISTRICTS.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="col-md-2">
            <label className="form-label small fw-bold text-muted mb-1">Date Filter (D/M/Y)</label>
            <div className="row g-1">
              <div className="col-4">
                <select
                  className="form-select form-select-sm bg-light px-1"
                  value={filterDay}
                  onChange={(e) => { setFilterDay(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="col-4">
                <select
                  className="form-select form-select-sm bg-light px-1"
                  value={filterMonth}
                  onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">Mo</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="col-4">
                <select
                  className="form-select form-select-sm bg-light px-1"
                  value={filterYear}
                  onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">Yr</option>
                  {['2023', '2024', '2025', '2026'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="col-md-1 text-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={handleResetFilters}
              title="Reset Filters"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Active Records Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-white py-3 border-0 d-flex align-items-center justify-content-between px-4 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <h5 className="fw-bold text-dark mb-0">
              <i className="bi bi-file-earmark-text-fill text-primary me-2"></i>Active Records
            </h5>
            <span className="badge bg-light text-dark border px-2 py-1 small">
              {filteredComplaints.length} matched
            </span>
          </div>
          <span className="badge bg-light text-muted border py-2 px-3 small">Admin Panel</span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading complaints registry...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard2-x text-muted" style={{ fontSize: '3.5rem' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-1">No Matching Complaints Found</h5>
              <p className="text-muted small mb-3">Adjust your search terms or filter constraints.</p>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted text-uppercase small">
                  <tr>
                    <th className="ps-4">Complaint ID</th>
                    <th>Citizen Name</th>
                    <th>Category</th>
                    <th>District</th>
                    <th>Incident Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedComplaints.map((c) => {
                    const citizenName = c.isAnonymous
                      ? 'Anonymous Report'
                      : (c.user?.fullName || c.userName || 'Citizen');

                    return (
                      <tr key={c.complaintId || c._id}>
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
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1.5">{c.category}</span>
                        </td>
                        <td>{c.district || '-'}</td>
                        <td>{formatDate(c.incidentDate || c.createdAt)}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td className="text-end pe-4">
                          <div className="btn-group gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-2"
                              onClick={() => setViewComplaint(c)}
                              title="Review Details & Evidence"
                            >
                              <i className="bi bi-eye-fill"></i>
                              <span className="d-none d-md-inline ms-1">View</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-2"
                              onClick={() => {
                                setStatusComplaint(c);
                                setNewStatus(c.status || 'Pending');
                              }}
                              title="Update Status"
                            >
                              <i className="bi bi-pencil-square"></i>
                              <span className="d-none d-md-inline ms-1">Status</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-2"
                              onClick={() => setDeleteComplaint(c)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
              <span className="small text-muted">
                Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
           COMPLAINT DETAILS & EVIDENCE MODAL
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
                  <i className="bi bi-file-earmark-text-fill me-2"></i>Official Incident Case File ({viewComplaint.complaintId})
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
                    <span className="text-muted small d-block">Citizen Account</span>
                    <strong className="text-dark fs-6">
                      {viewComplaint.isAnonymous
                        ? 'Anonymous Report'
                        : (viewComplaint.user?.fullName || viewComplaint.userName || 'Verified Citizen')}
                    </strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Status</span>
                    <div className="mt-1">{getStatusBadge(viewComplaint.status)}</div>
                  </div>

                  <div className="col-sm-6 col-md-4">
                    <span className="text-muted small d-block">Category</span>
                    <strong className="text-dark">{viewComplaint.category}</strong>
                  </div>
                  <div className="col-sm-6 col-md-4">
                    <span className="text-muted small d-block">District</span>
                    <strong className="text-dark">{viewComplaint.district || '-'}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Incident Date</span>
                    <strong className="text-dark">{formatDate(viewComplaint.incidentDate || viewComplaint.createdAt)}</strong>
                  </div>

                  {/* Reporter Contact Information */}
                  <div className="col-12 pt-2 border-top">
                    <div className="row g-3">
                      <div className="col-sm-6 col-md-4">
                        <span className="text-muted small d-block">Reporter NIC</span>
                        <strong className="text-dark">
                          {viewComplaint.reporterContact?.nic || 'Not provided'}
                        </strong>
                      </div>
                      <div className="col-sm-6 col-md-4">
                        <span className="text-muted small d-block">Reporter Phone</span>
                        <strong className="text-dark">
                          {viewComplaint.reporterContact?.phone || (viewComplaint.user?.phoneNumber || 'Not provided')}
                        </strong>
                      </div>
                      <div className="col-sm-6 col-md-4">
                        <span className="text-muted small d-block">Priority Triage</span>
                        <span className={`badge ${viewComplaint.isEmergency ? 'bg-danger' : 'bg-secondary bg-opacity-25 text-dark'} px-2.5 py-1.5`}>
                          {viewComplaint.isEmergency ? 'Emergency Incident' : 'Standard Complaint'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="col-12 pt-2 border-top">
                    <span className="text-muted small d-block fw-semibold mb-2">Location Information</span>
                    <div className="p-3 bg-light rounded-3 border">
                      <div className="row g-2">
                        <div className="col-sm-6 col-md-3">
                          <span className="text-muted small d-block">District</span>
                          <span className="fw-semibold text-dark">{viewComplaint.district || '-'}</span>
                        </div>
                        <div className="col-sm-6 col-md-3">
                          <span className="text-muted small d-block">Town / City</span>
                          <span className="fw-semibold text-dark">{viewComplaint.locationDetails?.town || '-'}</span>
                        </div>
                        <div className="col-md-6">
                          <span className="text-muted small d-block">Nearby Landmark / Description</span>
                          <span className="fw-semibold text-dark">
                            {viewComplaint.locationDetails?.landmarkDescription || viewComplaint.location || '-'}
                          </span>
                        </div>
                        {(viewComplaint.locationDetails?.address || viewComplaint.locationDetails?.additionalNotes) && (
                          <>
                            {viewComplaint.locationDetails?.address && (
                              <div className="col-md-6 mt-2">
                                <span className="text-muted small d-block">Street / Address</span>
                                <span className="text-dark small">{viewComplaint.locationDetails.address}</span>
                              </div>
                            )}
                            {viewComplaint.locationDetails?.additionalNotes && (
                              <div className="col-md-6 mt-2">
                                <span className="text-muted small d-block">Location Notes</span>
                                <span className="text-dark small">{viewComplaint.locationDetails.additionalNotes}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <span className="text-muted small d-block">Incident Title</span>
                    <h5 className="fw-bold text-dark mt-1">{viewComplaint.title || 'Incident Report'}</h5>
                  </div>

                  <div className="col-12">
                    <span className="text-muted small d-block mb-1">Detailed Incident Narrative</span>
                    <div className="p-3 bg-light rounded-3 small text-dark border" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {viewComplaint.description}
                    </div>
                  </div>

                  {(viewComplaint.suspectDetails || viewComplaint.witnessDetails) && (
                    <div className="col-12 pt-2 border-top">
                      <div className="row g-3">
                        {viewComplaint.suspectDetails && (
                          <div className="col-md-6">
                            <span className="text-muted small d-block fw-semibold">Suspect Information</span>
                            <div className="p-2 bg-light rounded small border">{viewComplaint.suspectDetails}</div>
                          </div>
                        )}
                        {viewComplaint.witnessDetails && (
                          <div className="col-md-6">
                            <span className="text-muted small d-block fw-semibold">Witness Information</span>
                            <div className="p-2 bg-light rounded small border">{viewComplaint.witnessDetails}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Evidence Attachments */}
                  <div className="col-12 pt-3 border-top">
                    <h6 className="fw-bold text-dark mb-3">
                      <i className="bi bi-images text-primary me-2"></i>Evidence Attachments ({Array.isArray(viewComplaint.evidenceFiles) ? viewComplaint.evidenceFiles.length : 0})
                    </h6>

                    {(!Array.isArray(viewComplaint.evidenceFiles) || viewComplaint.evidenceFiles.length === 0) ? (
                      <p className="text-muted small mb-0">No evidence files were attached to this complaint.</p>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {viewComplaint.evidenceFiles.map((filename, idx) => (
                          <AdminEvidenceCard
                            key={idx}
                            complaintId={viewComplaint.complaintId || viewComplaint._id}
                            filename={filename}
                            index={idx}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submission Security Information */}
                  <div className="col-12 pt-3 border-top">
                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-shield-lock-fill text-primary"></i>
                      <span>Submission Security Information</span>
                    </h6>

                    {viewComplaint.submissionMetadata && viewComplaint.submissionMetadata.ipAddress ? (
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="row g-3 small">
                          <div className="col-sm-6 col-md-3">
                            <span className="text-muted d-block">Observed IP Address</span>
                            <strong className="text-dark font-monospace">
                              {viewComplaint.submissionMetadata.ipAddress}
                            </strong>
                          </div>
                          <div className="col-sm-6 col-md-3">
                            <span className="text-muted d-block">Device Category</span>
                            <strong className="text-dark">
                              {viewComplaint.submissionMetadata.deviceType || 'Unknown'}
                            </strong>
                          </div>
                          <div className="col-sm-6 col-md-3">
                            <span className="text-muted d-block">Browser / Client</span>
                            <strong className="text-dark">
                              {viewComplaint.submissionMetadata.browser || 'Unknown'}
                            </strong>
                          </div>
                          <div className="col-sm-6 col-md-3">
                            <span className="text-muted d-block">Operating System</span>
                            <strong className="text-dark">
                              {viewComplaint.submissionMetadata.operatingSystem || 'Unknown'}
                            </strong>
                          </div>
                          <div className="col-sm-6 col-md-4">
                            <span className="text-muted d-block">Submission Timestamp</span>
                            <span className="text-dark">
                              {viewComplaint.submissionMetadata.submittedAt
                                ? new Date(viewComplaint.submissionMetadata.submittedAt).toLocaleString()
                                : formatDate(viewComplaint.createdAt)}
                            </span>
                          </div>
                          <div className="col-sm-6 col-md-4">
                            <span className="text-muted d-block">Submission Channel</span>
                            <span className="badge bg-secondary bg-opacity-25 text-dark">
                              {viewComplaint.submissionMetadata.source || 'Web Portal'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-top text-muted" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-info-circle me-1 text-primary"></i>
                          <em>Technical submission information may assist abuse investigations but does not by itself verify a person's identity.</em>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-light rounded-3 border small text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Technical submission metadata is not recorded for this legacy complaint.
                      </div>
                    )}
                  </div>
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
           STATUS TRANSITION MODAL
           ============================================================ */}
      {statusComplaint && (
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
                  onClick={() => setStatusComplaint(null)}
                  disabled={statusUpdating}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 bg-white">
                <form onSubmit={handleStatusUpdate}>
                  <p className="text-muted small mb-3">
                    Modifying operational status for case{' '}
                    <strong className="font-monospace text-dark">{statusComplaint.complaintId}</strong>:
                  </p>
                  <div className="mb-4">
                    <label htmlFor="selectNewStatus" className="form-label small fw-semibold text-muted">
                      Select Target Investigation State
                    </label>
                    <select
                      className="form-select bg-light"
                      id="selectNewStatus"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      required
                    >
                      {STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2"
                      onClick={() => setStatusComplaint(null)}
                      disabled={statusUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2 shadow-sm"
                      style={{ background: 'var(--primary)', border: 'none' }}
                      disabled={statusUpdating}
                    >
                      {statusUpdating ? (
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
      {deleteComplaint && (
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
                  Are you sure you want to delete case <strong className="font-monospace text-dark">{deleteComplaint.complaintId}</strong>?
                  This action cannot be undone and will permanently remove it from the database.
                </p>

                <div className="d-flex justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2"
                    onClick={() => setDeleteComplaint(null)}
                    disabled={deleting}
                  >
                    NO
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 py-2 shadow-sm"
                    onClick={handleDeleteRecord}
                    disabled={deleting}
                  >
                    {deleting ? (
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
