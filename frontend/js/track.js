/* ============================================================
   Crime Complaint Management System - Complaint Tracking Logic
   Author: Student Project
   Description: Simulates database query for tracking status based
                on user input (Complaint ID & Email).
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const trackForm = document.getElementById('trackForm');
  const resultContainer = document.getElementById('resultContainer');
  const successCard = document.getElementById('successResultCard');
  const errorCard = document.getElementById('errorResultCard');

  // Elements to populate with result data
  const resComplaintId = document.getElementById('resComplaintId');
  const resDateSubmitted = document.getElementById('resDateSubmitted');
  const resComplaintTitle = document.getElementById('resComplaintTitle');
  const badgePlaceholder = document.getElementById('badgePlaceholder');
  const caseProgressBar = document.getElementById('caseProgressBar');

  // No mock database needed

  // ----------------------------------------------------------
  // FORM SUBMISSION EVENT
  // ----------------------------------------------------------
  trackForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Stop page reload

    const idInput = document.getElementById('complaintId').value.trim();
    const emailInput = document.getElementById('registeredEmail').value.trim().toLowerCase();

    // Standard HTML5 validation trigger
    const isValid = trackForm.checkValidity();
    trackForm.classList.add('was-validated');

    if (!isValid) {
      resultContainer.classList.add('d-none');
      return;
    }

    // Call backend API
    fetch('http://localhost:5000/api/complaints/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: idInput, email: emailInput })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(res => {
      resultContainer.classList.remove('d-none');
      if (res.status === 200) {
        const matchedComplaint = res.body;
        // 1. Show Success Card, hide Error Card
        successCard.classList.remove('d-none');
        errorCard.classList.add('d-none');

        // 2. Populate text fields
        resComplaintId.textContent = matchedComplaint.complaintId;
        resDateSubmitted.textContent = formatDate(matchedComplaint.incidentDate);
        resComplaintTitle.textContent = matchedComplaint.title;

        // 3. Render Status Badge & Progress Bar
        updateStatusUI(matchedComplaint.status);
      } else {
        // Show Error Card, hide Success Card
        successCard.classList.add('d-none');
        errorCard.classList.remove('d-none');
      }
    })
    .catch(err => {
      console.error(err);
      alert('Server error while tracking complaint.');
    });
  });

  // Helper function to format SQL-style date (YYYY-MM-DD) to readable format
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  }

  // Helper function to update Badge and Progress Bar
  function updateStatusUI(status) {
    // Clear previous classes
    badgePlaceholder.innerHTML = '';
    caseProgressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
    
    let badgeClass = '';
    let progressWidth = '';
    let progressBg = '';

    switch (status) {
      case 'Pending':
        badgeClass = 'bg-warning text-dark';
        progressWidth = '25%';
        progressBg = 'bg-warning';
        break;
      case 'Approved':
        badgeClass = 'bg-primary';
        progressWidth = '50%';
        progressBg = 'bg-primary';
        break;
      case 'Under Investigation':
        badgeClass = 'bg-info text-dark';
        progressWidth = '75%';
        progressBg = 'bg-info';
        break;
      case 'Resolved':
        badgeClass = 'bg-success';
        progressWidth = '100%';
        progressBg = 'bg-success';
        break;
      case 'Rejected':
        badgeClass = 'bg-danger';
        progressWidth = '100%';
        progressBg = 'bg-danger';
        break;
    }

    // Create and append badge
    const badge = document.createElement('span');
    badge.className = `badge ${badgeClass} fs-6 px-3 py-2`;
    badge.textContent = status;
    badgePlaceholder.appendChild(badge);

    // Apply progress properties
    caseProgressBar.style.width = progressWidth;
    caseProgressBar.classList.add(progressBg);
  }
});
