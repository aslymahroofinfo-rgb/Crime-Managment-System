import { useState, useEffect, useMemo } from 'react';
import { contactService } from '../../services/contactService';

function formatDate(dateString) {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? String(dateString) : date.toLocaleDateString('en-US', options);
}

function getStatusBadge(status) {
  switch (status) {
    case 'New':
      return <span className="badge bg-warning text-dark px-2.5 py-1.5"><i className="bi bi-bell-fill me-1"></i>New</span>;
    case 'Read':
      return <span className="badge bg-info text-dark px-2.5 py-1.5"><i className="bi bi-envelope-open-fill me-1"></i>Read</span>;
    case 'Resolved':
      return <span className="badge bg-success px-2.5 py-1.5"><i className="bi bi-check2-circle me-1"></i>Resolved</span>;
    default:
      return <span className="badge bg-secondary px-2.5 py-1.5">{status}</span>;
  }
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alertFeedback, setAlertFeedback] = useState(null);

  // Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await contactService.getAllInquiries();
      if (res.ok && Array.isArray(res.data)) {
        setInquiries(res.data);
      } else {
        setInquiries([]);
      }
    } catch (err) {
      console.error('Failed to load contact inquiries:', err);
      setAlertFeedback({ type: 'danger', message: 'Failed to retrieve contact inquiries from backend.' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered inquiries list
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(item => {
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const name = (item.name || '').toLowerCase();
        const email = (item.email || '').toLowerCase();
        const subject = (item.subject || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !subject.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [inquiries, search, statusFilter]);

  // Update Status handler
  const handleUpdateStatus = async (inquiryId, newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await contactService.updateStatus(inquiryId, newStatus);
      if (res.ok) {
        setAlertFeedback({ type: 'success', message: `Inquiry status changed to "${newStatus}".` });
        if (selectedInquiry && (selectedInquiry._id === inquiryId || selectedInquiry.id === inquiryId)) {
          setSelectedInquiry(prev => ({ ...prev, status: newStatus }));
        }
        await fetchInquiries();
      } else {
        setAlertFeedback({ type: 'danger', message: res.data?.message || 'Failed to update status.' });
      }
    } catch (err) {
      console.error('Update inquiry status error:', err);
      setAlertFeedback({ type: 'danger', message: 'Server communication error.' });
    } finally {
      setStatusUpdating(false);
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
          <h2 className="fw-bold text-dark mb-1">Public Contact Inquiries</h2>
          <p className="text-muted mb-0 small">
            Review, track, and resolve citizen questions, feedback, and support inquiries.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3"
            onClick={fetchInquiries}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-md-7 col-lg-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by name, email, or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="col-md-5 col-lg-3">
            <select
              className="form-select bg-light"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses ({inquiries.length})</option>
              <option value="New">New ({inquiries.filter(i => i.status === 'New').length})</option>
              <option value="Read">Read ({inquiries.filter(i => i.status === 'Read').length})</option>
              <option value="Resolved">Resolved ({inquiries.filter(i => i.status === 'Resolved').length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inquiries Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-white py-3 border-0 d-flex align-items-center justify-content-between px-4 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <h5 className="fw-bold text-dark mb-0">
              <i className="bi bi-chat-left-text-fill text-primary me-2"></i>Inquiry Records
            </h5>
            <span className="badge bg-primary-subtle text-primary fw-semibold rounded-pill px-3 py-1">
              {filteredInquiries.length} total
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted small mt-2">Loading contact inquiries...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '3.5rem' }}></i>
              <h5 className="fw-bold text-dark mt-3 mb-1">No Contact Inquiries Found</h5>
              <p className="text-muted small">No submitted inquiries match your current search and filter criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted text-uppercase small">
                  <tr>
                    <th className="ps-4">Submitted Date</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inq) => {
                    const inqId = inq._id || inq.id;
                    return (
                      <tr key={inqId}>
                        <td className="ps-4 small text-muted">{formatDate(inq.createdAt)}</td>
                        <td><span className="fw-semibold text-dark">{inq.name}</span></td>
                        <td className="small text-muted">{inq.email}</td>
                        <td className="text-dark small text-truncate" style={{ maxWidth: '240px' }} title={inq.subject}>
                          {inq.subject}
                        </td>
                        <td>{getStatusBadge(inq.status)}</td>
                        <td className="text-end pe-4">
                          <div className="btn-group gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-2"
                              onClick={() => {
                                setSelectedInquiry(inq);
                                if (inq.status === 'New') {
                                  handleUpdateStatus(inqId, 'Read');
                                }
                              }}
                              title="View Full Message"
                            >
                              <i className="bi bi-eye-fill"></i>
                              <span className="d-none d-md-inline ms-1">View</span>
                            </button>

                            {inq.status !== 'Resolved' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success rounded-2"
                                onClick={() => handleUpdateStatus(inqId, 'Resolved')}
                                title="Mark Resolved"
                              >
                                <i className="bi bi-check2"></i>
                                <span className="d-none d-md-inline ms-1">Resolve</span>
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
           INQUIRY DETAIL MODAL
           ============================================================ */}
      {selectedInquiry && (
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
                  <i className="bi bi-envelope-paper-fill me-2"></i>Inquiry Message Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedInquiry(null)}
                  disabled={statusUpdating}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4 p-sm-5 bg-white">
                <div className="row g-4 mb-4">
                  <div className="col-sm-6 col-md-4">
                    <span className="text-muted small d-block">Sender Name</span>
                    <strong className="text-dark fs-6">{selectedInquiry.name}</strong>
                  </div>
                  <div className="col-sm-6 col-md-4">
                    <span className="text-muted small d-block">Email Address</span>
                    <strong className="text-dark fs-6">{selectedInquiry.email}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Phone Number</span>
                    <strong className="text-dark">{selectedInquiry.phone || 'Not provided'}</strong>
                  </div>

                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Submission Time</span>
                    <strong className="text-dark">{formatDate(selectedInquiry.createdAt)}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Current Status</span>
                    <div className="mt-1">{getStatusBadge(selectedInquiry.status)}</div>
                  </div>

                  <div className="col-12">
                    <span className="text-muted small d-block">Subject Line</span>
                    <h5 className="fw-bold text-dark mt-1">{selectedInquiry.subject}</h5>
                  </div>

                  <div className="col-12">
                    <span className="text-muted small d-block mb-1">Message Body</span>
                    <div
                      className="p-3 bg-light rounded-3 text-dark border small"
                      style={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}
                    >
                      {selectedInquiry.message}
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap justify-content-between align-items-center pt-3 border-top gap-2">
                  <div className="d-flex gap-2">
                    {selectedInquiry.status === 'New' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-info text-dark"
                        onClick={() => handleUpdateStatus(selectedInquiry._id || selectedInquiry.id, 'Read')}
                        disabled={statusUpdating}
                      >
                        <i className="bi bi-envelope-open me-1"></i>Mark as Read
                      </button>
                    )}
                    {selectedInquiry.status !== 'Resolved' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success text-white"
                        onClick={() => handleUpdateStatus(selectedInquiry._id || selectedInquiry.id, 'Resolved')}
                        disabled={statusUpdating}
                      >
                        <i className="bi bi-check2-circle me-1"></i>Mark as Resolved
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary px-4 py-2 btn-sm"
                    onClick={() => setSelectedInquiry(null)}
                  >
                    Close
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
