/* ============================================================
   Crime Complaint Management System - Complaint Submission Logic
   Author: Student Project
   Description: Character counter, file preview, and validation.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const complaintForm = document.getElementById('complaintForm');
  const descriptionInput = document.getElementById('complaintDescription');
  const charCounter = document.getElementById('charCounter');
  const evidenceInput = document.getElementById('evidenceUpload');
  const previewContainer = document.getElementById('previewContainer');
  const filePreviewList = document.getElementById('filePreviewList');

  // ----------------------------------------------------------
  // 1. CHARACTER COUNTER FOR DESCRIPTION
  // ----------------------------------------------------------
  descriptionInput.addEventListener('input', function () {
    const currentLength = descriptionInput.value.length;
    charCounter.textContent = `${currentLength} / 1000 characters`;

    // Visual indicator when approaching limits
    if (currentLength >= 900) {
      charCounter.className = 'text-danger small fw-bold';
    } else if (currentLength >= 750) {
      charCounter.className = 'text-warning small fw-bold';
    } else {
      charCounter.className = 'text-muted small';
    }
  });

  // ----------------------------------------------------------
  // 2. EVIDENCE FILE UPLOAD PREVIEW
  // ----------------------------------------------------------
  evidenceInput.addEventListener('change', function () {
    filePreviewList.innerHTML = ''; // Clear previous previews
    const files = evidenceInput.files;

    if (files.length === 0) {
      previewContainer.classList.add('d-none');
      return;
    }

    previewContainer.classList.remove('d-none');

    Array.from(files).forEach(file => {
      const col = document.createElement('div');
      col.className = 'card p-2 border-1 bg-light position-relative d-flex align-items-center justify-content-center';
      col.style.width = '100px';
      col.style.height = '100px';

      // File Details Wrapper
      const label = document.createElement('span');
      label.className = 'text-truncate w-100 text-center small mt-1';
      label.style.fontSize = '0.7rem';
      label.textContent = file.name;

      // Check if file is image to show actual thumbnail
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.className = 'img-fluid rounded border';
        img.style.maxHeight = '55px';
        img.style.objectFit = 'cover';

        const reader = new FileReader();
        reader.onload = function (e) {
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        col.appendChild(img);
      } else {
        // Icon for PDFs, Videos, or Doc files
        const icon = document.createElement('i');
        if (file.type === 'application/pdf') {
          icon.className = 'bi bi-file-earmark-pdf-fill text-danger fs-2';
        } else if (file.type.startsWith('video/')) {
          icon.className = 'bi bi-file-earmark-play-fill text-primary fs-2';
        } else {
          icon.className = 'bi bi-file-earmark-arrow-up-fill text-muted fs-2';
        }
        col.appendChild(icon);
      }

      col.appendChild(label);
      filePreviewList.appendChild(col);
    });
  });

  // ----------------------------------------------------------
  // 3. FORM VALIDATION & SUBMISSION
  // ----------------------------------------------------------
  complaintForm.addEventListener('submit', function (event) {
    const isValid = complaintForm.checkValidity();

    if (!isValid) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();

      const userConfirmed = confirm("Is this everything right? Can we submit?");
      if (!userConfirmed) {
        return; // Do not submit if the user hits No/Cancel
      }

      const formData = new FormData();
      formData.append('title', document.getElementById('complaintTitle').value);
      formData.append('category', document.getElementById('complaintCategory').value);
      formData.append('district', document.getElementById('incidentDistrict').value);
      formData.append('incidentDate', document.getElementById('incidentDate').value);
      formData.append('incidentTime', document.getElementById('incidentTime').value);
      formData.append('location', document.getElementById('incidentLocation').value);
      formData.append('description', document.getElementById('complaintDescription').value);
      formData.append('suspectDetails', document.getElementById('suspectDetails').value);
      formData.append('witnessDetails', document.getElementById('witnessDetails').value);
      formData.append('isAnonymous', document.getElementById('anonymousReport').checked);

      const files = document.getElementById('evidenceUpload').files;
      for (let i = 0; i < files.length; i++) {
        formData.append('evidenceFiles', files[i]);
      }

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch('http://localhost:5000/api/complaints/submit', {
        method: 'POST',
        headers: headers,
        body: formData
      })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(res => {
        if (res.status === 201) {
          const isAnonymous = document.getElementById('anonymousReport').checked;
          const refNum = res.body.complaintId;
          const message = isAnonymous
            ? `Complaint submitted successfully!\n\nYour complaint has been logged anonymously.\nComplaint Reference Number: ${refNum}\nKeep this reference number safe to track status.`
            : `Complaint submitted successfully!\n\nComplaint Reference Number: ${refNum}\nKeep this reference number safe to track status.`;
          
          alert(message);
          
          complaintForm.reset();
          filePreviewList.innerHTML = '';
          previewContainer.classList.add('d-none');
          charCounter.textContent = '0 / 1000 characters';
          charCounter.className = 'text-muted small';
          complaintForm.classList.remove('was-validated');
        } else {
          alert('Submission failed: ' + (res.body.message || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Server error. Make sure backend is running.');
      });
    }

    complaintForm.classList.add('was-validated');
  }, false);

  // Clear previews on reset
  const resetBtn = document.getElementById('resetBtn');
  resetBtn.addEventListener('click', function () {
    filePreviewList.innerHTML = '';
    previewContainer.classList.add('d-none');
    charCounter.textContent = '0 / 1000 characters';
    charCounter.className = 'text-muted small';
    complaintForm.classList.remove('was-validated');
  });
});
