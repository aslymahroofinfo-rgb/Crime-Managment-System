/* ============================================================
   Crime Complaint Management System - Citizen Dashboard Logic
   Author: Student Project
   Description: Manages CRUD operations (View, Update, Delete) and
                dynamic stats calculations.
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

document.addEventListener('DOMContentLoaded', function () {
  // ----------------------------------------------------------
  // DYNAMIC COMPLAINTS STATE
  // ----------------------------------------------------------
  let complaints = [];
  
  function fetchComplaints() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first.');
      window.location.href = 'login.html';
      return;
    }

    fetch('http://localhost:5000/api/complaints/my-complaints', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      // Set user's name in the welcome header
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          const welcomeEl = document.getElementById('welcomeUserName');
          if (welcomeEl) {
            welcomeEl.textContent = `Welcome Back, ${userObj.fullName}`;
          }
        } catch(e) {}
      }

      complaints = data.map(c => ({
        id: c.complaintId,
        category: c.category,
        title: c.title,
        date: c.incidentDate,
        status: c.status,
        description: c.description
      }));
      renderDashboard();
    })
    .catch(err => {
      console.error(err);
      alert('Error loading complaints. Is backend running?');
    });
  }

  // Bootstrap Modals Instances
  const viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
  const updateModal = new bootstrap.Modal(document.getElementById('updateModal'));
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

  // DOM Elements
  const tableBody = document.getElementById('complaintTableBody');
  const emptyState = document.getElementById('tableEmptyState');
  const updateForm = document.getElementById('updateForm');

  // Stats Counters
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statInvestigating = document.getElementById('statInvestigating');
  const statResolved = document.getElementById('statResolved');

  // ----------------------------------------------------------
  // INITIAL RENDER & COUNT CALCULATION
  // ----------------------------------------------------------
  function renderDashboard() {
    // 1. Calculate and update stats counters
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const investigating = complaints.filter(c => c.status === 'Under Investigation').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statInvestigating.textContent = investigating;
    statResolved.textContent = resolved;

    // 2. Clear previous table content
    tableBody.innerHTML = '';

    if (total === 0) {
      emptyState.classList.remove('d-none');
      return;
    } else {
      emptyState.classList.add('d-none');
    }

    // 3. Populate table rows
    complaints.forEach(item => {
      const isPending = item.status === 'Pending';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="ps-4 fw-bold text-dark">${escapeHTML(item.id)}</td>
        <td><span class="badge bg-light text-dark border px-2 py-1.5">${escapeHTML(item.category)}</span></td>
        <td>${formatDate(item.date)}</td>
        <td>${getStatusBadge(item.status)}</td>
        <td class="text-end pe-4">
          <div class="btn-group gap-1">
            <button class="btn btn-sm btn-outline-primary rounded-2 btn-view" data-id="${escapeHTML(item.id)}" title="View Details">
              <i class="bi bi-eye-fill"></i> <span class="d-none d-md-inline ms-1">View</span>
            </button>
            ${isPending ? `
            <button class="btn btn-sm btn-outline-secondary rounded-2 btn-edit" data-id="${escapeHTML(item.id)}" title="Edit Complaint">
              <i class="bi bi-pencil-square"></i> <span class="d-none d-md-inline ms-1">Edit</span>
            </button>
            <button class="btn btn-sm btn-outline-danger rounded-2 btn-delete" data-id="${escapeHTML(item.id)}" title="Delete Complaint">
              <i class="bi bi-trash-fill"></i> <span class="d-none d-md-inline ms-1">Delete</span>
            </button>
            ` : `
            <button class="btn btn-sm btn-outline-secondary rounded-2 opacity-50" disabled title="This complaint can no longer be modified because processing has started.">
              <i class="bi bi-pencil-square"></i> <span class="d-none d-md-inline ms-1">Edit</span>
            </button>
            <button class="btn btn-sm btn-outline-danger rounded-2 opacity-50" disabled title="This complaint can no longer be modified because processing has started.">
              <i class="bi bi-trash-fill"></i> <span class="d-none d-md-inline ms-1">Delete</span>
            </button>
            `}
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Rebind event listeners to the new buttons
    bindActionEvents();
  }

  // ----------------------------------------------------------
  // BIND EVENT HANDLERS
  // ----------------------------------------------------------
  function bindActionEvents() {
    // View Action Click
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        window.location.href = `complaint_details.html?id=${id}`;
      });
    });

    // Update Action Click
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const complaint = complaints.find(c => c.id === id);
        if (complaint) {
          // Fill inputs
          document.getElementById('editKeyId').value = complaint.id;
          document.getElementById('editTitle').value = complaint.title;
          document.getElementById('editCategory').value = complaint.category;
          document.getElementById('editDescription').value = complaint.description;

          // Clear validation styling
          updateForm.classList.remove('was-validated');
          updateModal.show();
        }
      });
    });

    // Delete Action Click
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        document.getElementById('deleteKeyId').value = id;
        document.getElementById('deleteIdText').textContent = id;
        deleteModal.show();
      });
    });
  }

  // Save updates on submit
  updateForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const isValid = updateForm.checkValidity();
    updateForm.classList.add('was-validated');

    if (!isValid) return;

    const id = document.getElementById('editKeyId').value;
    const title = document.getElementById('editTitle').value.trim();
    const category = document.getElementById('editCategory').value;
    const description = document.getElementById('editDescription').value.trim();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in first.');
      window.location.href = 'login.html';
      return;
    }

    const submitBtn = updateForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    }

    fetch(`http://localhost:5000/api/complaints/my/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, category, description })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update complaint.');
      }
      return data;
    })
    .then(data => {
      updateModal.hide();
      updateForm.reset();
      updateForm.classList.remove('was-validated');
      // Reload directly from backend to ensure synchronized state
      fetchComplaints();
    })
    .catch(err => {
      console.error('Update complaint error:', err);
      alert(err.message || 'Failed to update complaint.');
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  });

  // Confirm deletion click handler
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = function () {
      const id = document.getElementById('deleteKeyId').value;
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in first.');
        window.location.href = 'login.html';
        return;
      }

      const originalBtnText = confirmDeleteBtn.innerHTML;
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

      fetch(`http://localhost:5000/api/complaints/my/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to delete complaint.');
        }
        return data;
      })
      .then(data => {
        deleteModal.hide();
        // Reload directly from backend to ensure synchronized state and update counts
        fetchComplaints();
      })
      .catch(err => {
        console.error('Delete complaint error:', err);
        alert(err.message || 'Failed to delete complaint.');
      })
      .finally(() => {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = originalBtnText;
      });
    };
  }

  // ----------------------------------------------------------
  // HELPER HELPERS
  // ----------------------------------------------------------
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  }

  function getStatusBadge(status) {
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
      default:
        badgeClass = 'bg-secondary';
    }
    return `<span class="badge ${badgeClass} fs-7 px-2.5 py-1.5">${status}</span>`;
  }

  // ----------------------------------------------------------
  // PROFILE EDITING LOGIC
  // ----------------------------------------------------------
  const profileModalElem = document.getElementById('profileModal');
  let profileModal;
  if (profileModalElem) {
    profileModal = new bootstrap.Modal(profileModalElem);
  }
  const profileForm = document.getElementById('profileForm');
  const openProfileBtn = document.getElementById('openProfileModalBtn');
  
  if (openProfileBtn) {
    openProfileBtn.addEventListener('click', function() {
      document.getElementById('profileErrorMsg').classList.add('d-none');
      document.getElementById('profileSuccessMsg').classList.add('d-none');
      if (profileForm) profileForm.classList.remove('was-validated');
      
      const token = localStorage.getItem('token');
      // Fetch latest profile from DB
      fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data._id) {
          document.getElementById('profileName').value = data.fullName || '';
          document.getElementById('profilePhone').value = data.phoneNumber || '';
          let addr = data.address || {};
          if (typeof addr === 'string') addr = { no: '', street: '', city: '', district: '' };
          document.getElementById('profileAddressNo').value = addr.no || '';
          document.getElementById('profileStreet').value = addr.street || '';
          document.getElementById('profileCity').value = addr.city || '';
          document.getElementById('profileDistrict').value = addr.district || '';
          
          // Also update local storage just in case
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr);
              userObj.phoneNumber = data.phoneNumber;
              userObj.address = data.address;
              userObj.fullName = data.fullName;
              localStorage.setItem('user', JSON.stringify(userObj));
            } catch(e) {}
          }
        }
      })
      .catch(e => console.error('Failed to fetch profile', e));
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const errorMsg = document.getElementById('profileErrorMsg');
      const successMsg = document.getElementById('profileSuccessMsg');
      errorMsg.classList.add('d-none');
      successMsg.classList.add('d-none');
      
      const isValid = profileForm.checkValidity();
      profileForm.classList.add('was-validated');
      if (!isValid) return;

      const token = localStorage.getItem('token');
      const fullName = document.getElementById('profileName').value;
      const phoneNumber = document.getElementById('profilePhone').value;
      const addressNo = document.getElementById('profileAddressNo').value;
      const street = document.getElementById('profileStreet').value;
      const city = document.getElementById('profileCity').value;
      const district = document.getElementById('profileDistrict').value;

      fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phoneNumber, addressNo, street, city, district })
      })
      .then(res => res.json().then(data => ({ status: res.status, body: data })))
      .then(res => {
        if (res.status === 200) {
          localStorage.setItem('user', JSON.stringify(res.body.user));
          const welcomeEl = document.getElementById('welcomeUserName');
          if (welcomeEl) welcomeEl.textContent = `Welcome Back, ${res.body.user.fullName}`;
          
          successMsg.textContent = 'Profile updated successfully!';
          successMsg.classList.remove('d-none');
          
          setTimeout(() => {
            if (profileModal) profileModal.hide();
          }, 1500);
        } else {
          errorMsg.textContent = res.body.message || 'Failed to update profile.';
          errorMsg.classList.remove('d-none');
        }
      })
      .catch(err => {
        console.error(err);
        errorMsg.textContent = 'Server error. Please try again later.';
        errorMsg.classList.remove('d-none');
      });
    });
  }

  // Initial draw execution
  // Initial data load
  fetchComplaints();
});
