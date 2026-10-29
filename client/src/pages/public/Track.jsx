import { useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';
import ToastAlert from '../../components/feedback/ToastAlert';
import StatusBadge from '../../components/feedback/StatusBadge';

export default function Track() {
  const [complaintId, setComplaintId] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [complaintData, setComplaintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState(null);

  const getProgressInfo = (status) => {
    switch (status) {
      case 'Pending':
        return { percent: '25%', color: 'bg-warning' };
      case 'Approved':
        return { percent: '50%', color: 'bg-primary' };
      case 'Under Investigation':
        return { percent: '75%', color: 'bg-info' };
      case 'Resolved':
        return { percent: '100%', color: 'bg-success' };
      case 'Rejected':
        return { percent: '100%', color: 'bg-danger' };
      default:
        return { percent: '10%', color: 'bg-secondary' };
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setAlertState(null);
    setComplaintData(null);

    const cleanId = complaintId.trim();
    if (!cleanId) {
      setAlertState({ type: 'danger', message: 'Please enter a Complaint Reference ID.' });
      return;
    }

    setLoading(true);
    try {
      const res = await complaintService.trackComplaint(cleanId, registeredEmail.trim());

      if (res.ok && res.data) {
        setComplaintData(res.data);
      } else {
        const errorMsg = res.data?.message || 'No matching complaint found. Please verify your Complaint ID and email.';
        setAlertState({ type: 'danger', message: errorMsg });
      }
    } catch {
      setAlertState({
        type: 'danger',
        message: 'A network communication error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = complaintData ? getProgressInfo(complaintData.status) : null;

  return (
    <main className="container my-5 flex-grow-1">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10 col-12">
          {/* Back Link & Title */}
          <div className="mb-4">
            <Link to="/" className="text-decoration-none small fw-semibold" style={{ color: 'var(--primary)' }}>
              <i className="bi bi-arrow-left me-1"></i> Back to Homepage
            </Link>
            <h2 className="fw-bold text-dark mt-2 mb-1">Track Complaint Status</h2>
            <p className="text-muted">Enter your complaint details below to view real-time investigation status.</p>
          </div>

          {/* Search Input Card */}
          <div className="card shadow border-0 rounded-4 overflow-hidden mb-4">
            <div
              className="card-header py-3 text-white border-0 d-flex align-items-center gap-2"
              style={{ background: 'var(--primary-dark)' }}
            >
              <i className="bi bi-search"></i>
              <h5 className="mb-0 fw-semibold">Search Complaint</h5>
            </div>

            <div className="card-body p-4 p-sm-5 bg-white">
              {alertState && (
                <ToastAlert
                  type={alertState.type}
                  message={alertState.message}
                  onClose={() => setAlertState(null)}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleTrack} noValidate>
                {/* Complaint ID */}
                <div className="mb-3">
                  <label htmlFor="complaintId" className="form-label small fw-semibold">
                    Complaint ID Reference Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-hash"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      id="complaintId"
                      placeholder="e.g. CCMS-000001"
                      value={complaintId}
                      onChange={(e) => setComplaintId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Registered Email */}
                <div className="mb-4">
                  <label htmlFor="registeredEmail" className="form-label small fw-semibold">
                    Registered Email Address <small className="text-muted fw-normal">(Required if filed as registered citizen)</small>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <i className="bi bi-envelope-fill"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control bg-light border-start-0 ps-0"
                      id="registeredEmail"
                      placeholder="e.g. citizen@example.com"
                      value={registeredEmail}
                      onChange={(e) => setRegisteredEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
                  style={{ background: 'var(--primary)', border: 'none' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Searching Case Records...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-binoculars-fill me-2"></i>Track Complaint Status
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Success Result Card */}
          {complaintData && (
            <div className="card shadow border-0 rounded-4 overflow-hidden border-start border-4 border-primary bg-white mb-4 animate-fade-in">
              <div className="card-body p-4 p-sm-5">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                  <div>
                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
                      <i className="bi bi-info-circle-fill text-primary me-2"></i>Case Details
                    </h5>
                  </div>
                  <StatusBadge status={complaintData.status} className="fs-6 px-3 py-2" />
                </div>

                {complaintData.isAnonymous && (
                  <div className="alert alert-secondary py-2 px-3 small d-flex align-items-center mb-4 rounded-3">
                    <i className="bi bi-shield-lock-fill text-primary me-2 fs-5"></i>
                    <span>This is an <strong>Anonymous Incident Report</strong>. Identifying details and sensitive evidence files are strictly protected from public tracking.</span>
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Complaint ID</span>
                    <strong className="text-dark fs-5">{complaintData.complaintId}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Date Submitted</span>
                    <strong className="text-dark fs-5">
                      {complaintData.createdAt
                        ? new Date(complaintData.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'N/A'}
                    </strong>
                  </div>
                  <div className="col-12">
                    <span className="text-muted small d-block">Incident Title</span>
                    <strong className="text-dark fs-6 d-block mt-1">{complaintData.title}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Category</span>
                    <span className="badge bg-light text-dark border px-2.5 py-1.5 mt-1">{complaintData.category}</span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted small d-block">Incident District</span>
                    <strong className="text-dark d-block mt-1">{complaintData.district || 'Not specified'}</strong>
                  </div>
                </div>

                {/* Progress bar milestone representation */}
                {progress && (
                  <div className="mt-4 pt-3 border-top">
                    <span className="text-muted small d-block mb-2 fw-semibold">Investigation Milestone Progress</span>
                    <div className="progress" style={{ height: '10px' }}>
                      <div
                        className={`progress-bar progress-bar-striped progress-bar-animated ${progress.color}`}
                        role="progressbar"
                        style={{ width: progress.percent }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between mt-2 text-muted" style={{ fontSize: '0.72rem' }}>
                      <span className={complaintData.status ? 'fw-bold text-dark' : ''}>1. Filed</span>
                      <span className={complaintData.status !== 'Pending' ? 'fw-bold text-dark' : ''}>2. Reviewed</span>
                      <span className={['Under Investigation', 'Resolved'].includes(complaintData.status) ? 'fw-bold text-dark' : ''}>3. Investigating</span>
                      <span className={complaintData.status === 'Resolved' ? 'fw-bold text-success' : ''}>4. Resolved</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
