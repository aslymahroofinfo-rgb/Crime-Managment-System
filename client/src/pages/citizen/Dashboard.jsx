import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';

const CATEGORIES = [
  'Theft', 'Assault', 'Cyber Crime', 'Domestic Violence',
  'Missing Person', 'Fraud', 'Other'
];

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

export default function Dashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Modal State
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', category: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Modal State
  const [deletingComplaint, setDeletingComplaint] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Feedback Notification
  const [alertFeedback, setAlertFeedback] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getMyComplaints();
      if (res.ok && Array.isArray(res.data)) {
        setComplaints(res.data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Failed to fetch citizen complaints:', err);
      setAlertFeedback({ type: 'danger', message: 'Failed to load complaints from backend.' });
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculations
  const statTotal = complaints.length;
  const statPending = complaints.filter(c => c.status === 'Pending').length;
  const statInvestigating = complaints.filter(c => c.status === 'Under Investigation').length;
  const statResolved = complaints.filter(c => c.status === 'Resolved').length;

  // Filtered complaints for table
  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      const matchesSearch = searchQuery.trim() === '' ||
        (item.complaintId && item.complaintId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchQuery, statusFilter]);

  // Open Edit Modal
  const handleOpenEdit = (complaint) => {
    setEditError('');
    setEditingComplaint(complaint);
    setEditFormData({
      title: complaint.title || '',
      category: complaint.category || 'Other',
      description: complaint.description || ''
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editFormData.title.trim() || editFormData.title.trim().length < 5) {
      setEditError('Title must be at least 5 characters long.');
      return;
    }
    if (!editFormData.category) {
      setEditError('Category is required.');
      return;
    }
    if (!editFormData.description.trim() || editFormData.description.trim().length < 10) {
      setEditError('Description must be at least 10 characters long.');
      return;
    }
    if (editFormData.description.length > 1000) {
      setEditError('Description cannot exceed 1000 characters.');
      return;
    }

    setEditLoading(true);
    try {
      const res = await complaintService.updateMyComplaint(editingComplaint.complaintId, {
        title: editFormData.title.trim(),
        category: editFormData.category,
        description: editFormData.description.trim()
      });

      if (res.ok) {
        setEditingComplaint(null);
        setAlertFeedback({ type: 'success', message: `Complaint ${editingComplaint.complaintId} updated successfully.` });
        await fetchComplaints();
      } else {
        setEditError(res.data?.message || 'Failed to update complaint.');
      }
    } catch (err) {
      console.error('Update complaint error:', err);
      setEditError('Server or network error updating complaint.');
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (complaint) => {
    setDeleteError('');
    setDeletingComplaint(complaint);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    try {
      const res = await complaintService.deleteMyComplaint(deletingComplaint.complaintId);
      if (res.ok) {
        setDeletingComplaint(null);
        setAlertFeedback({ type: 'success', message: `Complaint ${deletingComplaint.complaintId} deleted successfully.` });
        await fetchComplaints();
      } else {
        setDeleteError(res.data?.message || 'Failed to delete complaint.');
      }
    } catch (err) {
      console.error('Delete complaint error:', err);
      setDeleteError('Server or network error deleting complaint.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="container my-5 flex-grow-1">

      {/* Alert Feedback Banner */}
      {alertFeedback && (
        <div className={`alert alert-${alertFeedback.type} alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4`} role="alert">
          <i className={`bi bi-${alertFeedback.type === 'success' ? 'check-circle' : 'exclamation-octagon'}-fill me-2`}></i>
          {alertFeedback.message}
          <button type="button" className="btn-close" onClick={() => setAlertFeedback(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Welcome Panel */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
        <div className="row align-items-center g-3">
          <div className="col-md-8 text-center text-md-start">
            <h3 className="fw-bold text-dark mb-1">
              Welcome Back{user?.fullName ? `, ${user.fullName}` : ''}!
            </h3>
            <p className="text-muted mb-0 small">
              Here is the latest activity and status of your filed crime complaints.
            </p>
          </div>
          <div className="col-md-4 text-center text-md-end">
            <Link
              to="/profile"
              className="btn btn-outline-primary px-4 py-2 fw-semibold shadow-sm mb-2 mb-md-0 me-md-2"
            >
              <i className="bi bi-person-lines-fill me-2"></i>Edit Profile
            </Link>
            <Link
              to="/complaint"
              className="btn btn-primary px-4 py-2 fw-semibold shadow-sm"
              style={{ background: 'var(--primary)', border: 'none' }}
            >
              <i className="bi bi-plus-lg me-2"></i>File New Complaint
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Count Grid */}
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
                <i className="bi bi-folder-fill fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Cases */}
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

        {/* Investigating Cases */}
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-info">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Investigating</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{statInvestigating}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-3">
                <i className="bi bi-zoom-in fs-3"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Resolved Cases */}
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
      </div>

      {/* Recent Complaints Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-white py-3 border-0 d-flex flex-wrap align-items-center justify-content-between px-4 border-bottom gap-2">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-list-stars text-primary me-2"></i>My Recent Complaints
          </h5>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border p-2 small">Live Case Feed</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        {complaints.length > 0 && (
          <div className="p-3 bg-light border-bottom">
            <div className="row g-2">
              <div className="col-md-7 col-sm-12">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by ID, title, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="btn btn-outline-secondary" onClick={() => setSearchQuery('')}>
                      &times;
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-5 col-sm-12">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses ({complaints.length})</option>
                  <option value="Pending">Pending ({statPending})</option>
                  <option value="Under Investigation">Under Investigation ({statInvestigating})</option>
                  <option value="Approved">Approved</option>
                  <option value="Resolved">Resolved ({statResolved})</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading complaints from secure server...</p>
            </div>
          ) : complaints.length === 0 ? (
            /* Empty State */
            <div className="text-center py-5">
              <i className="bi bi-clipboard2-x text-muted" style={{ fontSize: '3.5rem' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-1">No Filed Complaints</h5>
              <p className="text-muted small mb-3">You haven't submitted any complaints yet. Click "File New Complaint" to begin.</p>
              <Link to="/complaint" className="btn btn-primary btn-sm px-4 py-2" style={{ background: 'var(--primary)', border: 'none' }}>
                <i className="bi bi-plus-lg me-1"></i> File New Complaint
              </Link>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search text-muted fs-1"></i>
              <h6 className="fw-bold text-dark mt-2">No matching complaints found</h6>
              <p className="text-muted small">Try adjusting your search query or filter options.</p>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 px-4">
                <thead className="table-light text-muted text-uppercase small">
                  <tr>
                    <th className="ps-4">Complaint ID</th>
                    <th>Category</th>
                    <th>Incident Date</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map(item => {
                    const isPending = item.status === 'Pending';
                    return (
                      <tr key={item.complaintId || item._id}>
                        <td className="ps-4 fw-bold text-dark font-monospace">
                          {item.complaintId}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1.5">
                            {item.category}
                          </span>
                        </td>
                        <td>{formatDate(item.incidentDate || item.createdAt)}</td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td className="text-end pe-4">
                          <div className="btn-group gap-1">
                            {/* View Button */}
                            <Link
                              to={`/complaints/${encodeURIComponent(item.complaintId)}`}
                              className="btn btn-sm btn-outline-primary rounded-2"
                              title="View Details"
                            >
                              <i className="bi bi-eye-fill"></i>
                              <span className="d-none d-md-inline ms-1">View</span>
                            </Link>

                            {/* Edit Button */}
                            {isPending ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-2"
                                onClick={() => handleOpenEdit(item)}
                                title="Edit Complaint"
                              >
                                <i className="bi bi-pencil-square"></i>
                                <span className="d-none d-md-inline ms-1">Edit</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary rounded-2 opacity-50"
                                disabled
                                title="This complaint can no longer be modified because processing has started."
                              >
                                <i className="bi bi-pencil-square"></i>
                                <span className="d-none d-md-inline ms-1">Edit</span>
                              </button>
                            )}

                            {/* Delete Button */}
                            {isPending ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-2"
                                onClick={() => handleOpenDelete(item)}
                                title="Delete Complaint"
                              >
                                <i className="bi bi-trash-fill"></i>
                                <span className="d-none d-md-inline ms-1">Delete</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-2 opacity-50"
                                disabled
                                title="This complaint can no longer be modified because processing has started."
                              >
                                <i className="bi bi-trash-fill"></i>
                                <span className="d-none d-md-inline ms-1">Delete</span>
                              </button>
                            )}
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
           EDIT COMPLAINT MODAL
           ============================================================ */}
      {editingComplaint && (
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
                  <i className="bi bi-pencil-square me-2"></i>Update Incident Details ({editingComplaint.complaintId})
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingComplaint(null)}
                  disabled={editLoading}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 p-sm-5 bg-white">
                {editError && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>{editError}
                  </div>
                )}

                <form onSubmit={handleSaveEdit}>
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label htmlFor="editTitle" className="form-label small fw-semibold">
                        Complaint Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        id="editTitle"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        required
                        minLength={5}
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="editCategory" className="form-label small fw-semibold">
                        Complaint Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select bg-light"
                        id="editCategory"
                        value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        required
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label htmlFor="editDescription" className="form-label small fw-semibold mb-0">
                          Detailed Description <span className="text-danger">*</span>
                        </label>
                        <small className="text-muted small">
                          {editFormData.description.length} / 1000 characters
                        </small>
                      </div>
                      <textarea
                        className="form-control bg-light"
                        id="editDescription"
                        rows={5}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        required
                        maxLength={1000}
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2"
                      onClick={() => setEditingComplaint(null)}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2 shadow-sm"
                      style={{ background: 'var(--primary)', border: 'none' }}
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving Updates...
                        </>
                      ) : (
                        'Save Updates'
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
      {deletingComplaint && (
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
                <div className="text-danger mb-3" style={{ fontSize: '3.5rem' }}>
                  <i className="bi bi-trash3-fill"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Delete Complaint Record?</h5>
                <p className="text-muted small">
                  Are you sure you want to delete complaint{' '}
                  <strong className="text-dark font-monospace">{deletingComplaint.complaintId}</strong>?
                  This action is permanent and cannot be undone.
                </p>

                {deleteError && (
                  <div className="alert alert-danger py-2 small mb-3">
                    {deleteError}
                  </div>
                )}

                <div className="d-flex justify-content-center gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-light border px-4 py-2"
                    onClick={() => setDeletingComplaint(null)}
                    disabled={deleteLoading}
                  >
                    Keep Record
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-4 py-2"
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : (
                      'Delete Permanently'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
