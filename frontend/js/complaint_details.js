/* ============================================================
   Crime Complaint Management System - Complaint Details Logic
   Author: Student Project
   Description: Loads incident details and timeline logs dynamically
                based on URL ID parameters or default values.
   ============================================================ */

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const activeBlobUrls = [];
window.addEventListener('beforeunload', () => {
  activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
});

document.addEventListener('DOMContentLoaded', function () {
  
  // ----------------------------------------------------------
  // URL ID PARAMETER EXTRACTOR
  // ----------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const complaintIdParam = urlParams.get('id');

  if (!complaintIdParam) {
    alert('No complaint ID specified.');
    window.location.href = 'dashboard.html';
    return;
  }

  // ----------------------------------------------------------
  // FETCH FROM DATABASE
  // ----------------------------------------------------------
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to view details.');
    window.location.href = 'login.html';
    return;
  }

  fetch(`http://localhost:5000/api/complaints/${complaintIdParam}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => {
    if (!res.ok) {
      if (res.status === 403) throw new Error('Access denied. You can only view your own complaints.');
      if (res.status === 404) throw new Error('Complaint not found.');
      throw new Error('Failed to fetch complaint details.');
    }
    return res.json();
  })
  .then(data => {
    // Map backend data to selectedCase structure
    const selectedCase = {
      id: data.complaintId,
      category: data.category,
      title: data.title || 'Incident Report',
      date: data.incidentDate,
      location: data.location || 'Not Specified',
      status: data.status,
      description: data.description,
      officer: data.officer || null,
      timeline: {
        submitted: data.createdAt,
        assigned: null,
        started: null,
        resolved: data.status === 'Resolved' ? data.updatedAt : null
      },
      evidence: data.evidenceFiles ? data.evidenceFiles.map((filename, i) => ({
        type: 'image',
        name: filename,
        icon: 'bi-file-image'
      })) : []
    };

    renderComplaintDetails(selectedCase);
  })
  .catch(err => {
    console.error(err);
    alert(err.message);
    window.location.href = 'dashboard.html';
  });

  // ----------------------------------------------------------
  // RENDER CASE DETAIL DATA
  // ----------------------------------------------------------
  function renderComplaintDetails(selectedCase) {
    document.getElementById('detailsId').textContent = selectedCase.id;
    document.getElementById('detailsCategory').textContent = selectedCase.category;
    document.getElementById('detailsDate').textContent = formatDate(selectedCase.date);
    document.getElementById('detailsLocation').textContent = selectedCase.location;
    document.getElementById('detailsTitle').textContent = selectedCase.title;
    document.getElementById('detailsDescription').textContent = selectedCase.description;

    // Status badge selection
    const badgeContainer = document.getElementById('detailsStatusBadge');
    badgeContainer.innerHTML = getStatusBadgeHTML(selectedCase.status);

    // Status text message
    updateStatusDescription(selectedCase.status);

    // ----------------------------------------------------------
    // RENDER EVIDENCE GALLERY
    // ----------------------------------------------------------
    const gallery = document.getElementById('detailsEvidenceGallery');
    const noEvidenceText = document.getElementById('noEvidenceText');

    if (!selectedCase.evidence || selectedCase.evidence.length === 0) {
      noEvidenceText.classList.remove('d-none');
      gallery.classList.add('d-none');
    } else {
      noEvidenceText.classList.add('d-none');
      gallery.classList.remove('d-none');
      gallery.innerHTML = '';

      selectedCase.evidence.forEach((item, i) => {
        const col = document.createElement('div');
        col.className = 'p-3 text-center border rounded-3 bg-light shadow-sm d-flex flex-column align-items-center justify-content-between';
        col.style.minHeight = '180px';
        col.innerHTML = `
          <div class="my-auto text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
            <div class="small text-muted" style="font-size:0.75rem;">Loading Evidence ${i + 1}...</div>
          </div>
        `;
        gallery.appendChild(col);

        const cleanName = String(item.name || '').replace(/^(uploads[/\\])+/, '');
        const ext = cleanName.includes('.') ? cleanName.substring(cleanName.lastIndexOf('.')).toLowerCase() : '';
        const labelText = `Evidence ${i + 1}`;
        const evidenceEndpoint = `http://localhost:5000/api/complaints/${encodeURIComponent(selectedCase.id)}/evidence/${i}`;

        fetch(evidenceEndpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(async res => {
          if (!res.ok) {
            throw new Error('Evidence file unavailable');
          }
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          activeBlobUrls.push(blobUrl);

          col.innerHTML = '';
          if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            col.innerHTML = `
              <div class="w-100 text-center mb-2" style="height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img src="${blobUrl}" alt="${escapeHTML(labelText)}" class="img-fluid rounded border" style="max-height: 100px; max-width: 100%; object-fit: contain;">
              </div>
              <span class="text-dark small fw-semibold text-truncate w-100 mb-2" style="font-size:0.78rem;" title="${escapeHTML(labelText)}">${escapeHTML(labelText)}</span>
              <div class="d-flex gap-2 w-100 justify-content-center">
                <a href="${blobUrl}" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size:0.72rem;"><i class="bi bi-eye"></i> View</a>
                <a href="${blobUrl}" download="evidence-${i + 1}${ext}" class="btn btn-sm btn-primary py-1 px-2 text-white" style="font-size:0.72rem;"><i class="bi bi-download"></i> Download</a>
              </div>
            `;
          } else if (ext === '.pdf') {
            col.innerHTML = `
              <div class="w-100 text-center mb-2" style="height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <i class="bi bi-file-earmark-pdf-fill fs-1 text-danger"></i>
                <span class="badge bg-danger bg-opacity-10 text-danger mt-1" style="font-size:0.68rem;">PDF Document</span>
              </div>
              <span class="text-dark small fw-semibold text-truncate w-100 mb-2" style="font-size:0.78rem;" title="${escapeHTML(labelText)}">${escapeHTML(labelText)}</span>
              <div class="d-flex gap-2 w-100 justify-content-center">
                <a href="${blobUrl}" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size:0.72rem;"><i class="bi bi-eye"></i> View</a>
                <a href="${blobUrl}" download="evidence-${i + 1}.pdf" class="btn btn-sm btn-primary py-1 px-2 text-white" style="font-size:0.72rem;"><i class="bi bi-download"></i> Download</a>
              </div>
            `;
          } else if (ext === '.mp4') {
            col.innerHTML = `
              <div class="w-100 text-center mb-2" style="height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <video controls class="rounded border" style="max-height: 100px; max-width: 100%;" preload="metadata">
                  <source src="${blobUrl}" type="video/mp4">
                </video>
              </div>
              <span class="text-dark small fw-semibold text-truncate w-100 mb-2" style="font-size:0.78rem;" title="${escapeHTML(labelText)}">${escapeHTML(labelText)}</span>
              <div class="d-flex gap-2 w-100 justify-content-center">
                <a href="${blobUrl}" download="evidence-${i + 1}.mp4" class="btn btn-sm btn-primary py-1 px-2 text-white" style="font-size:0.72rem;"><i class="bi bi-download"></i> Download</a>
              </div>
            `;
          } else {
            col.innerHTML = `
              <div class="w-100 text-center mb-2" style="height: 100px; display: flex; align-items: center; justify-content: center;">
                <i class="bi bi-file-earmark-text-fill fs-1 text-primary"></i>
              </div>
              <span class="text-dark small fw-semibold text-truncate w-100 mb-2" style="font-size:0.78rem;" title="${escapeHTML(labelText)}">${escapeHTML(labelText)}</span>
              <div class="d-flex gap-2 w-100 justify-content-center">
                <a href="${blobUrl}" download="evidence-${i + 1}${ext}" class="btn btn-sm btn-primary py-1 px-2 text-white" style="font-size:0.72rem;"><i class="bi bi-download"></i> Download</a>
              </div>
            `;
          }
        })
        .catch(err => {
          col.innerHTML = `
            <div class="w-100 text-center my-auto py-3">
              <i class="bi bi-exclamation-triangle text-warning fs-2 d-block mb-1"></i>
              <span class="text-muted small" style="font-size:0.75rem;">Evidence file unavailable</span>
            </div>
          `;
        });
      });
    }

    // ----------------------------------------------------------
    // RENDER PROGRESS TIMELINE LOGS
    // ----------------------------------------------------------
    renderTimeline(selectedCase);
  }

  // ----------------------------------------------------------
  // HELPER IMPLEMENTATIONS
  // ----------------------------------------------------------
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  }

  function getStatusBadgeHTML(status) {
    let badgeClass = '';
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
    }
    return `<span class="badge ${badgeClass} fs-5 px-4 py-2 shadow-sm">${status}</span>`;
  }

  function updateStatusDescription(status) {
    const textMsg = document.getElementById('statusMessageText');
    switch (status) {
      case 'Pending':
        textMsg.textContent = 'Your complaint is in queue and awaiting administrator review for officer assignment.';
        break;
      case 'Approved':
        textMsg.textContent = 'Your complaint has been approved for processing. An officer has been assigned to start investigating.';
        break;
      case 'Under Investigation':
        textMsg.textContent = 'Active investigation details are being gathered. The assigned officer is currently looking into evidence.';
        break;
      case 'Resolved':
        textMsg.textContent = 'The investigation has concluded and resolution steps have been completed. Check details below.';
        break;
      case 'Rejected':
        textMsg.textContent = 'The complaint file has been rejected due to lack of verifiable evidence or jurisdiction limitations.';
        break;
    }
  }

  function renderTimeline(c) {
    // Step 1: Submitted (always completed)
    document.getElementById('timeSubmittedDate').textContent = `Filed on ${c.timeline.submitted}`;

    // Step 2: Officer Assigned
    const iconOfficer = document.getElementById('iconOfficer');
    const timeOfficerDetails = document.getElementById('timeOfficerDetails');
    const timeOfficerDesc = document.getElementById('timeOfficerDesc');

    if (c.status === 'Pending') {
      iconOfficer.className = 'timeline-icon upcoming';
      timeOfficerDetails.textContent = 'Pending Officer Assignment';
      timeOfficerDesc.textContent = 'Station administrator will designate a lead investigator shortly.';
    } else {
      iconOfficer.className = 'timeline-icon completed';
      iconOfficer.innerHTML = '<i class="bi bi-check-lg"></i>';
      timeOfficerDetails.textContent = `Assigned to ${c.officer}`;
      timeOfficerDesc.textContent = `Assigned on ${c.timeline.assigned || 'next business day'}.`;
    }

    // Step 3: Investigation Started
    const iconInvestigation = document.getElementById('iconInvestigation');
    const timeInvestigationDate = document.getElementById('timeInvestigationDate');
    const timeInvestigationDesc = document.getElementById('timeInvestigationDesc');

    if (c.status === 'Pending') {
      iconInvestigation.className = 'timeline-icon upcoming';
      timeInvestigationDate.textContent = 'Awaiting triage';
      timeInvestigationDesc.textContent = 'Will start once an officer reviews statement logs.';
    } else if (c.status === 'Approved') {
      iconInvestigation.className = 'timeline-icon active';
      timeInvestigationDate.textContent = 'Queued for start';
      timeInvestigationDesc.textContent = 'Officer is organizing incident file notes to initiate inquiry.';
    } else {
      // Under Investigation, Resolved, Rejected
      iconInvestigation.className = 'timeline-icon completed';
      iconInvestigation.innerHTML = '<i class="bi bi-check-lg"></i>';
      timeInvestigationDate.textContent = `Started: ${c.timeline.started || 'Active investigation phase'}`;
      timeInvestigationDesc.textContent = 'Formal police inquiry opened. Case statement logs recorded.';
    }

    // Step 4: Status / Resolution
    const iconFinal = document.getElementById('iconFinal');
    const timeResolutionDate = document.getElementById('timeResolutionDate');
    const timeResolutionDesc = document.getElementById('timeResolutionDesc');

    if (c.status === 'Resolved') {
      iconFinal.className = 'timeline-icon completed';
      iconFinal.innerHTML = '<i class="bi bi-check-lg"></i>';
      timeResolutionDate.textContent = `Resolved on ${c.timeline.resolved}`;
      timeResolutionDesc.textContent = 'Case closed. Official resolution report filed and complete.';
    } else if (c.status === 'Rejected') {
      iconFinal.className = 'timeline-icon completed bg-danger border-danger';
      iconFinal.innerHTML = '<i class="bi bi-x-lg text-white"></i>';
      timeResolutionDate.textContent = `Rejected on ${c.timeline.resolved || 'Review phase'}`;
      timeResolutionDesc.textContent = 'Case closed without further action. Insufficient statement details.';
    } else {
      iconFinal.className = 'timeline-icon upcoming';
      timeResolutionDate.textContent = 'Pending Case Conclusion';
      timeResolutionDesc.textContent = 'Updates will post automatically upon completion of investigation.';
    }
  }

});
