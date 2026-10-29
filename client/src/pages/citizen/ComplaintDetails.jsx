import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintService } from '../../services/complaintService';

function formatDate(dateString) {
  if (!dateString) return '-';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? String(dateString) : date.toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateString);
  }
}

function getStatusBadgeHTML(status) {
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
  return <span className={`badge ${badgeClass} fs-5 px-4 py-2 shadow-sm`}>{status}</span>;
}

function getStatusDescription(status) {
  switch (status) {
    case 'Pending':
      return 'Your complaint is in queue and awaiting administrator review for officer assignment.';
    case 'Approved':
      return 'Your complaint has been approved for processing. An officer or investigative unit has been assigned.';
    case 'Under Investigation':
      return 'Active investigation details are being gathered. The assigned officer is currently reviewing evidence.';
    case 'Resolved':
      return 'The investigation has concluded and resolution steps have been completed. Check details below.';
    case 'Rejected':
      return 'The complaint file has been rejected due to lack of verifiable evidence or jurisdiction limitations.';
    default:
      return 'Your complaint is currently being processed by the system.';
  }
}

// Sub-component for each evidence attachment
function EvidenceCard({ complaintId, filename, index }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cleanName = String(filename || '').replace(/^(uploads[/\\])+/, '');
  const ext = cleanName.includes('.') ? cleanName.substring(cleanName.lastIndexOf('.')).toLowerCase() : '';
  const labelText = `Evidence ${index + 1}`;

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    async function loadEvidence() {
      try {
        const blob = await complaintService.getEvidenceBlob(complaintId, index);
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

    loadEvidence();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [complaintId, index]);

  if (loading) {
    return (
      <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '180px' }}>
        <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>Loading {labelText}...</div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '180px' }}>
        <i className="bi bi-exclamation-triangle text-warning fs-2 d-block mb-1"></i>
        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Evidence file unavailable</span>
      </div>
    );
  }

  // Image evidence
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    return (
      <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '180px' }}>
        <div className="w-100 text-center mb-2" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={blobUrl} alt={labelText} className="img-fluid rounded border" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
        <span className="text-dark small fw-semibold text-truncate w-100 mb-2" style={{ fontSize: '0.78rem' }} title={labelText}>
          {labelText}
        </span>
        <div className="d-flex gap-2 w-100 justify-content-center">
          <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary py-1 px-2" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-eye"></i> View
          </a>
          <a href={blobUrl} download={`evidence-${index + 1}${ext}`} className="btn btn-sm btn-primary py-1 px-2 text-white" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-download"></i> Download
          </a>
        </div>
      </div>
    );
  }

  // PDF evidence
  if (ext === '.pdf') {
    return (
      <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '180px' }}>
        <div className="w-100 text-center mb-2" style={{ height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-file-earmark-pdf-fill fs-1 text-danger"></i>
          <span className="badge bg-danger bg-opacity-10 text-danger mt-1" style={{ fontSize: '0.68rem' }}>PDF Document</span>
        </div>
        <span className="text-dark small fw-semibold text-truncate w-100 mb-2" style={{ fontSize: '0.78rem' }} title={labelText}>
          {labelText}
        </span>
        <div className="d-flex gap-2 w-100 justify-content-center">
          <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary py-1 px-2" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-eye"></i> View
          </a>
          <a href={blobUrl} download={`evidence-${index + 1}.pdf`} className="btn btn-sm btn-primary py-1 px-2 text-white" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-download"></i> Download
          </a>
        </div>
      </div>
    );
  }

  // Video MP4 evidence
  if (ext === '.mp4') {
    return (
      <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '180px' }}>
        <div className="w-100 text-center mb-2" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <video controls preload="metadata" className="rounded border" style={{ maxHeight: '100px', maxWidth: '100%' }}>
            <source src={blobUrl} type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </div>
        <span className="text-dark small fw-semibold text-truncate w-100 mb-2" style={{ fontSize: '0.78rem' }} title={labelText}>
          {labelText}
        </span>
        <div className="d-flex gap-2 w-100 justify-content-center">
          <a href={blobUrl} download={`evidence-${index + 1}.mp4`} className="btn btn-sm btn-primary py-1 px-2 text-white" style={{ fontSize: '0.72rem' }}>
            <i className="bi bi-download"></i> Download
          </a>
        </div>
      </div>
    );
  }

  // Default other document type
  return (
    <div className="p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between" style={{ minHeight: '180px' }}>
      <div className="w-100 text-center mb-2" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="bi bi-file-earmark-text-fill fs-1 text-primary"></i>
      </div>
      <span className="text-dark small fw-semibold text-truncate w-100 mb-2" style={{ fontSize: '0.78rem' }} title={labelText}>
        {labelText}
      </span>
      <div className="d-flex gap-2 w-100 justify-content-center">
        <a href={blobUrl} download={`evidence-${index + 1}${ext}`} className="btn btn-sm btn-primary py-1 px-2 text-white" style={{ fontSize: '0.72rem' }}>
          <i className="bi bi-download"></i> Download
        </a>
      </div>
    </div>
  );
}

export default function ComplaintDetails() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    setAccessDenied(false);
    setNotFound(false);
    setErrorMessage('');

    try {
      const res = await complaintService.getComplaintById(id);

      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      if (!res.ok) {
        setErrorMessage(res.data?.message || 'Failed to fetch complaint details.');
        return;
      }

      setComplaint(res.data);
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      setErrorMessage('Server connection error. Please verify backend service.');
    } finally {
      setLoading(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <main className="container my-5 flex-grow-1 text-center py-5">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <h5 className="fw-bold text-dark">Accessing Official Case File...</h5>
        <p className="text-muted small">Verifying cryptographic authorization and loading incident logs.</p>
      </main>
    );
  }

  // Access Denied State (403)
  if (accessDenied) {
    return (
      <main className="container my-5 flex-grow-1">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <div className="text-danger mb-3">
            <i className="bi bi-shield-lock-fill" style={{ fontSize: '4rem' }}></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Access Denied</h3>
          <p className="text-muted col-md-6 mx-auto mb-4">
            You do not have permission to access complaint record <strong className="font-monospace text-dark">{id}</strong>.
            Citizens may only view cases registered under their own verified account identity.
          </p>
          <div>
            <Link to="/dashboard" className="btn btn-primary px-4 py-2" style={{ background: 'var(--primary)', border: 'none' }}>
              <i className="bi bi-arrow-left me-2"></i>Return to My Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Not Found State (404)
  if (notFound) {
    return (
      <main className="container my-5 flex-grow-1">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <div className="text-muted mb-3">
            <i className="bi bi-search" style={{ fontSize: '4rem' }}></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Complaint Record Not Found</h3>
          <p className="text-muted col-md-6 mx-auto mb-4">
            No incident record matching reference <strong className="font-monospace text-dark">{id}</strong> exists in the database.
          </p>
          <div>
            <Link to="/dashboard" className="btn btn-outline-secondary px-4 py-2">
              <i className="bi bi-arrow-left me-2"></i>Return to My Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Error State
  if (errorMessage || !complaint) {
    return (
      <main className="container my-5 flex-grow-1">
        <div className="alert alert-danger border-0 shadow-sm rounded-4 p-4 text-center">
          <i className="bi bi-exclamation-triangle-fill fs-2 mb-2 d-block"></i>
          <h5>Error Loading Case File</h5>
          <p className="mb-3">{errorMessage || 'An unexpected error occurred.'}</p>
          <button className="btn btn-outline-danger btn-sm" onClick={fetchDetails}>Retry</button>
        </div>
      </main>
    );
  }

  // Evidence list
  const evidenceFiles = Array.isArray(complaint.evidenceFiles) ? complaint.evidenceFiles : [];

  return (
    <main className="container my-5 flex-grow-1">

      {/* Top breadcrumb & navigation links */}
      <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap g-2">
        <div>
          <Link to="/dashboard" className="text-decoration-none small fw-semibold" style={{ color: 'var(--primary)' }}>
            <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
          </Link>
          <h2 className="fw-bold text-dark mt-2 mb-1">Incident File Details</h2>
          <p className="text-muted small mb-0">Official police record file details, logs, and investigation timeline.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary px-3 py-2 btn-sm fw-semibold"
            onClick={() => window.print()}
          >
            <i className="bi bi-printer-fill me-1"></i> Print Case File
          </button>
        </div>
      </div>

      <div className="row g-4">

        {/* LEFT COLUMN: Main Case File details */}
        <div className="col-lg-8">

          {/* Case Details Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
            <div className="card-header bg-white py-3 border-0 d-flex align-items-center justify-content-between px-4 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-ruled-fill text-primary"></i>
                <h5 className="fw-bold text-dark mb-0">Official Incident Record</h5>
              </div>
              <span className="text-muted small fw-bold font-monospace">
                {complaint.complaintId}
              </span>
            </div>

            <div className="card-body p-4 p-sm-5">
              <div className="row g-4 mb-4">
                {/* Category */}
                <div className="col-sm-6 col-md-4">
                  <span className="text-muted small d-block">Category</span>
                  <strong className="text-dark">{complaint.category || '-'}</strong>
                </div>
                {/* Incident Date */}
                <div className="col-sm-6 col-md-4">
                  <span className="text-muted small d-block">Incident Date</span>
                  <strong className="text-dark">{formatDate(complaint.incidentDate || complaint.createdAt)}</strong>
                </div>
                {/* Location */}
                <div className="col-md-4">
                  <span className="text-muted small d-block">Incident Location</span>
                  <strong className="text-dark">
                    {complaint.location ? `${complaint.location}${complaint.district ? ', ' + complaint.district : ''}` : (complaint.district || 'Not Specified')}
                  </strong>
                </div>
              </div>

              {/* Complaint Title */}
              <div className="mb-4">
                <span className="text-muted small d-block mb-1">Complaint Title Summary</span>
                <h4 className="fw-bold text-dark">{complaint.title || 'Incident Report'}</h4>
              </div>

              {/* Narrative description */}
              <div className="mb-4">
                <span className="text-muted small d-block mb-2">Detailed Incident Narrative</span>
                <div
                  className="p-4 bg-light rounded-3 text-dark border small"
                  style={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}
                >
                  {complaint.description || 'No detailed narrative provided.'}
                </div>
              </div>

              {/* Suspect & Witness Details if provided */}
              {(complaint.suspectDetails || complaint.witnessDetails) && (
                <div className="row g-3 pt-3 border-top">
                  {complaint.suspectDetails && (
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1 fw-semibold">Suspect Information</span>
                      <div className="p-3 bg-light rounded-3 text-dark border small" style={{ whiteSpace: 'pre-line' }}>
                        {complaint.suspectDetails}
                      </div>
                    </div>
                  )}
                  {complaint.witnessDetails && (
                    <div className="col-md-6">
                      <span className="text-muted small d-block mb-1 fw-semibold">Witness Information</span>
                      <div className="p-3 bg-light rounded-3 text-dark border small" style={{ whiteSpace: 'pre-line' }}>
                        {complaint.witnessDetails}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Evidence Showcase Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-header bg-white py-3 border-0 px-4 border-bottom d-flex align-items-center gap-2">
              <i className="bi bi-images text-primary"></i>
              <h5 className="fw-bold text-dark mb-0">Evidence Attachments</h5>
            </div>
            <div className="card-body p-4">
              {evidenceFiles.length === 0 ? (
                <div className="text-muted small">
                  <i className="bi bi-info-circle me-1"></i>No evidence files were attached to this complaint.
                </div>
              ) : (
                <div className="evidence-gallery">
                  {evidenceFiles.map((fileRef, idx) => (
                    <EvidenceCard
                      key={idx}
                      complaintId={complaint.complaintId}
                      filename={fileRef}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Status & Case Timeline */}
        <div className="col-lg-4">

          {/* Status Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4 text-center">
            <span className="text-muted small fw-bold text-uppercase d-block mb-2">Current Case Status</span>
            <div className="mb-2">
              {getStatusBadgeHTML(complaint.status)}
            </div>
            <p className="text-muted small mb-0 mt-2">
              {getStatusDescription(complaint.status)}
            </p>
          </div>

          {/* Timeline Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-header bg-white py-3 border-0 px-4 border-bottom d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-primary"></i>
              <h5 className="fw-bold text-dark mb-0">Case Timeline Log</h5>
            </div>
            <div className="card-body p-4">

              {/* Vertical Timeline Component */}
              <div className="timeline">
                {(() => {
                  let historyEntries = Array.isArray(complaint.statusHistory) && complaint.statusHistory.length > 0
                    ? [...complaint.statusHistory]
                    : [
                        {
                          status: 'Pending',
                          changedAt: complaint.createdAt,
                          changedByRole: 'Citizen',
                          note: 'Complaint initially submitted'
                        }
                      ];

                  // Ensure latest complaint status is reflected if missing in history
                  const lastHistoryStatus = historyEntries[historyEntries.length - 1]?.status;
                  if (complaint.status && complaint.status !== lastHistoryStatus) {
                    historyEntries.push({
                      status: complaint.status,
                      changedAt: complaint.updatedAt || complaint.createdAt,
                      changedByRole: 'Admin',
                      note: ''
                    });
                  }

                  const isTerminal = complaint.status === 'Resolved' || complaint.status === 'Rejected';

                  return (
                    <>
                      {historyEntries.map((entry, idx) => {
                        const isLast = idx === historyEntries.length - 1;
                        const isRejected = entry.status === 'Rejected';
                        const isResolved = entry.status === 'Resolved';
                        const isPending = entry.status === 'Pending';
                        const isApproved = entry.status === 'Approved';
                        const isInvestigation = entry.status === 'Under Investigation';

                        let iconClass = 'completed';
                        let iconBi = 'bi-check-lg';

                        if (isRejected) {
                          iconClass = 'bg-danger border-danger text-white';
                          iconBi = 'bi-x-lg';
                        } else if (isInvestigation) {
                          iconClass = isLast ? 'active bg-primary border-primary text-white' : 'completed';
                          iconBi = 'bi-shield-fill-exclamation';
                        } else if (isApproved) {
                          iconClass = isLast ? 'active bg-info border-info text-white' : 'completed';
                          iconBi = 'bi-file-earmark-check-fill';
                        } else if (isPending) {
                          iconClass = isLast && !isTerminal ? 'active bg-warning border-warning text-dark' : 'completed';
                          iconBi = (isLast && !isTerminal) ? 'bi-hourglass-split' : 'bi-check-lg';
                        }

                        return (
                          <div className="timeline-item" key={idx}>
                            <div className={`timeline-icon ${iconClass}`}>
                              <i className={`bi ${iconBi}`}></i>
                            </div>
                            <div className="timeline-content">
                              <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="fw-bold text-dark mb-1 small">{entry.status}</h6>
                                {isRejected && (
                                  <span className="badge bg-danger" style={{ fontSize: '0.68rem' }}>Rejected</span>
                                )}
                              </div>
                              <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                                {formatDateTime(entry.changedAt)}
                                {entry.changedByRole ? ` · Logged by ${entry.changedByRole}` : ''}
                              </p>
                              {entry.note ? (
                                <p className="text-muted mb-0 mt-1 fst-italic" style={{ fontSize: '0.75rem' }}>
                                  "{entry.note}"
                                </p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}

                      {/* If not concluded, display pending next stage indicator */}
                      {!isTerminal && (
                        <div className="timeline-item">
                          <div className="timeline-icon upcoming">
                            <i className="bi bi-clock-history"></i>
                          </div>
                          <div className="timeline-content">
                            <h6 className="fw-bold text-dark mb-1 small">Investigation Progress</h6>
                            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>In queue / undergoing review</p>
                            <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.75rem' }}>
                              Updates will appear here dynamically as administrators review and conclude case actions.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>
          </div>

        </div>

      </div>

    </main>
  );
}
