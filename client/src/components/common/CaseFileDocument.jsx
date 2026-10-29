import React from 'react';

/**
 * Format date for official case document
 */
function formatDate(dateStr) {
  if (!dateStr) return 'Not Specified';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Format datetime for timeline entries and generation stamp
 */
function formatDateTime(dateStr) {
  if (!dateStr) return 'Not Specified';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Clean/safe display name and type for an evidence file
 */
function getEvidenceDisplay(filename, index) {
  if (!filename) return { name: `Evidence Item ${index + 1}`, type: 'Document' };
  const str = String(filename);
  const ext = str.split('.').pop().toLowerCase();
  
  let type = 'Document';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) type = 'Image';
  else if (ext === 'pdf') type = 'PDF Document';
  else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) type = 'Video';

  const isHashed = /^\d{10,}-[a-f0-9]{8,}\.[a-z0-9]+$/i.test(str);
  const name = isHashed ? `Attachment_${index + 1}.${ext}` : str.split('/').pop().split('\\').pop();

  return { name, type };
}

/**
 * Status description text
 */
function getStatusDescription(status) {
  switch (status) {
    case 'Pending':
      return 'Your complaint is currently awaiting administrator review and assignment.';
    case 'Approved':
      return 'The complaint has been officially verified and accepted for departmental action.';
    case 'Under Investigation':
      return 'An investigating officer has been assigned. Active inquiries and evidence reviews are in progress.';
    case 'Resolved':
      return 'The case investigation has been concluded and resolved by law enforcement authorities.';
    case 'Rejected':
      return 'The submission was reviewed and rejected. Please contact administration for further clarification.';
    default:
      return 'Case record is maintained under active registry monitoring.';
  }
}

export default function CaseFileDocument({ complaint, generatedAt }) {
  if (!complaint) return null;

  const loc = complaint.location 
    ? `${complaint.location}${complaint.district ? ', ' + complaint.district : ''}`
    : (complaint.district || 'Not Specified');

  const filingType = complaint.isAnonymous 
    ? 'Confidential Anonymous Incident Report' 
    : 'Registered Citizen Incident Report';

  const statusStr = complaint.status || 'Pending';
  const evidenceFiles = Array.isArray(complaint.evidenceFiles) ? complaint.evidenceFiles : [];

  // Assemble dynamic timeline
  let timeline = Array.isArray(complaint.statusHistory) && complaint.statusHistory.length > 0
    ? [...complaint.statusHistory]
    : [
        {
          status: 'Pending',
          changedAt: complaint.createdAt,
          changedByRole: 'Citizen',
          note: 'Initial incident filing'
        }
      ];

  const lastStatus = timeline[timeline.length - 1]?.status;
  if (complaint.status && complaint.status !== lastStatus) {
    timeline.push({
      status: complaint.status,
      changedAt: complaint.updatedAt || complaint.createdAt,
      changedByRole: 'Admin',
      note: 'Status updated by administration'
    });
  }

  const generatedDateStr = formatDateTime(generatedAt || new Date());

  return (
    <div className="case-file-document-container" id="case-file-document">
      {/* 1. Official Header */}
      <div className="doc-header">
        <div className="doc-header-left">
          <img src="/images/logo_bg_remove.png" alt="CIW Logo" className="doc-logo" />
          <div className="doc-titles">
            <h1 className="doc-main-title">CRIME INVESTIGATION WEBSITE</h1>
            <h2 className="doc-sub-title">OFFICIAL INCIDENT CASE FILE</h2>
            <p className="doc-agency-tag">National Law Enforcement & Public Safety Registry System</p>
          </div>
        </div>
      </div>

      <div className="doc-divider-thick"></div>

      {/* 2. Top Reference & Status Bar */}
      <div className="doc-meta-box">
        <div className="doc-meta-row">
          <div>
            <span className="doc-meta-label">CASE REFERENCE ID:</span>
            <span className="doc-meta-id">{complaint.complaintId}</span>
          </div>
          <div>
            <span className="doc-meta-label">CURRENT STATUS:</span>
            <span className={`doc-status-badge status-${statusStr.toLowerCase().replace(/\s+/g, '-')}`}>
              {statusStr}
            </span>
          </div>
        </div>
        <div className="doc-meta-sub">
          <span>Filing Category: <strong>{filingType}</strong></span>
        </div>
      </div>

      {/* 3. Case Information */}
      <div className="doc-section">
        <div className="doc-section-header">CASE INFORMATION</div>
        <div className="doc-grid-2">
          <div className="doc-grid-row">
            <span className="doc-label">Crime Category:</span>
            <span className="doc-value">{complaint.category || 'Not Specified'}</span>
          </div>
          <div className="doc-grid-row">
            <span className="doc-label">Incident Date:</span>
            <span className="doc-value">{formatDate(complaint.incidentDate || complaint.createdAt)}</span>
          </div>
          <div className="doc-grid-row">
            <span className="doc-label">Incident Location:</span>
            <span className="doc-value">{loc}</span>
          </div>
          <div className="doc-grid-row">
            <span className="doc-label">Reported Date:</span>
            <span className="doc-value">{formatDateTime(complaint.createdAt)}</span>
          </div>
          <div className="doc-grid-row">
            <span className="doc-label">Jurisdiction:</span>
            <span className="doc-value">{complaint.district || 'National Jurisdiction'}</span>
          </div>
          <div className="doc-grid-row">
            <span className="doc-label">Last Registry Update:</span>
            <span className="doc-value">{formatDateTime(complaint.updatedAt || complaint.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* 4. Incident Summary */}
      <div className="doc-section">
        <div className="doc-section-header">INCIDENT SUMMARY</div>
        <div className="doc-summary-title">{complaint.title || 'Incident Report'}</div>
      </div>

      {/* 5. Incident Narrative */}
      <div className="doc-section">
        <div className="doc-section-header">INCIDENT NARRATIVE & DETAILED DESCRIPTION</div>
        <div className="doc-narrative-text">
          {complaint.description || 'No detailed incident narrative provided.'}
        </div>
      </div>

      {/* Suspect & Witness Details (if available) */}
      {(complaint.suspectDetails || complaint.witnessDetails) && (
        <div className="doc-section">
          <div className="doc-section-header">SUSPECT & WITNESS INTELLIGENCE</div>
          {complaint.suspectDetails && (
            <div className="doc-sub-block">
              <span className="doc-sub-label">Suspect Information:</span>
              <p className="doc-sub-text">{complaint.suspectDetails}</p>
            </div>
          )}
          {complaint.witnessDetails && (
            <div className="doc-sub-block">
              <span className="doc-sub-label">Witness Information:</span>
              <p className="doc-sub-text">{complaint.witnessDetails}</p>
            </div>
          )}
        </div>
      )}

      {/* 6. Case Status */}
      <div className="doc-section">
        <div className="doc-section-header">OFFICIAL INVESTIGATION STATUS</div>
        <div className="doc-status-detail">
          <strong>Status: {statusStr}</strong>
          <p className="doc-status-desc">{getStatusDescription(statusStr)}</p>
        </div>
      </div>

      {/* 7. Case Timeline */}
      <div className="doc-section">
        <div className="doc-section-header">CASE TIMELINE & OFFICIAL HISTORY</div>
        <div className="doc-timeline-list">
          {timeline.map((item, idx) => (
            <div key={idx} className="doc-timeline-row">
              <div className="doc-timeline-dot"></div>
              <div className="doc-timeline-body">
                <div className="doc-timeline-top">
                  <span className="doc-timeline-status">{item.status}</span>
                  <span className="doc-timeline-date">
                    {formatDateTime(item.changedAt)}
                    {item.changedByRole ? ` · Logged by ${item.changedByRole}` : ''}
                  </span>
                </div>
                {item.note && (
                  <p className="doc-timeline-note">"{item.note}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Evidence Summary */}
      <div className="doc-section">
        <div className="doc-section-header">EVIDENCE ATTACHMENTS SUMMARY</div>
        <p className="doc-evidence-count">Total Registered Attachments: <strong>{evidenceFiles.length}</strong></p>
        {evidenceFiles.length === 0 ? (
          <p className="doc-no-evidence">No physical or digital evidence files were submitted with this incident report.</p>
        ) : (
          <div className="doc-evidence-list">
            {evidenceFiles.map((fileRef, idx) => {
              const display = getEvidenceDisplay(fileRef, idx);
              return (
                <div key={idx} className="doc-evidence-item">
                  <span className="doc-evidence-num">{idx + 1}.</span>
                  <span className="doc-evidence-name">{display.name}</span>
                  <span className="doc-evidence-type">Type: {display.type}</span>
                </div>
              );
            })}
            <p className="doc-evidence-disclaimer">
              Note: Original binary evidence files are securely stored in the official repository vault.
            </p>
          </div>
        )}
      </div>

      {/* 9. Document Record Information & Legal Footer */}
      <div className="doc-footer-section">
        <div className="doc-divider-thin"></div>
        <div className="doc-legal-header">DOCUMENT RECORD INFORMATION</div>
        <div className="doc-legal-meta">
          <span>Generated On: <strong>{generatedDateStr}</strong></span>
          <span>Record Reference: <strong>{complaint.complaintId}</strong></span>
        </div>
        <p className="doc-legal-disclaimer">
          This document constitutes an official case record extracted from the Crime Investigation & Complaint Management System. Any unauthorized alteration, forgery, or fraudulent reproduction of this document is strictly prohibited and subject to legal prosecution under Penal Code regulations.
        </p>
      </div>
    </div>
  );
}

