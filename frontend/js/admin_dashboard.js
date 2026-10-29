/* ============================================================
   Crime Complaint Management System - Admin Control Logic
   Author: Student Project
   Description: Implements CRUD/state transitions (Approve, Reject,
                Update Status, View details) for complaints.
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
  // ADMIN DATABASE STATE
  // ----------------------------------------------------------
  let complaints = [];
  
  function fetchAdminComplaints() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in as Admin.');
      window.location.href = '../pages/login.html';
      return;
    }

    fetch('http://localhost:5000/api/complaints/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if(res.status === 403) throw new Error('Access denied. Admin only.');
      return res.json();
    })
    .then(data => {
      complaints = data.map(c => ({
        id: c.complaintId,
        citizen: c.user ? c.user.fullName : 'Anonymous',
        category: c.category,
        district: c.district || '',
        title: c.title,
        date: c.incidentDate,
        status: c.status,
        description: c.description,
        dbId: c._id // keep db id for updates
      }));
      renderAdminPanel();
    })
    .catch(err => {
      console.error(err);
      alert(err.message || 'Error loading complaints');
    });
  }
  
  function updateComplaintStatus(complaint, newStatus) {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/complaints/${complaint.dbId}/status`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
      complaint.status = newStatus;
      renderAdminPanel();
    })
    .catch(err => {
      console.error(err);
      alert('Failed to update status');
    });
  }



  // Bootstrap Modals
  const viewModal = new bootstrap.Modal(document.getElementById('adminViewModal'));
  const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));

  // DOM Elements
  const tableBody = document.getElementById('adminTableBody');
  const emptyState = document.getElementById('adminEmptyState');
  const statusForm = document.getElementById('statusForm');

  // Stats Counters
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statResolved = document.getElementById('statResolved');
  const statUsers = document.getElementById('statUsers');

  // Server Time Display
  const serverTimeText = document.getElementById('serverTimeText');
  if (serverTimeText) {
    serverTimeText.textContent = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // ----------------------------------------------------------
  // INITIAL RENDER & COUNT CALCULATION
  // ----------------------------------------------------------
  function renderAdminPanel() {
    // 1. Calculate stats counters
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statResolved.textContent = resolved;
    
    // Fetch real registered users count if statUsers exists
    if (statUsers) {
      const token = localStorage.getItem('token');
      fetch('http://localhost:5000/api/users/count', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        statUsers.textContent = data.total;
      })
      .catch(err => {
        console.error('Error fetching user count:', err);
        statUsers.textContent = '0';
      });
    }

    // --- Filter Logic ---
    let filteredComplaints = complaints;
    const filterSearch = document.getElementById('filterSearch');
    const filterCategory = document.getElementById('filterCategory');
    const filterStatus = document.getElementById('filterStatus');
    const filterDistrict = document.getElementById('filterDistrict');
    const filterDay = document.getElementById('filterDay');
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');

    if (filterSearch || filterCategory || filterStatus || filterDistrict || filterDay || filterMonth || filterYear) {
      const searchVal = (filterSearch && filterSearch.value) ? filterSearch.value.toLowerCase() : '';
      const catVal = (filterCategory && filterCategory.value) ? filterCategory.value : '';
      const statVal = (filterStatus && filterStatus.value) ? filterStatus.value : '';
      const districtVal = (filterDistrict && filterDistrict.value) ? filterDistrict.value : '';
      const dayVal = (filterDay && filterDay.value) ? filterDay.value : '';
      const monthVal = (filterMonth && filterMonth.value) ? filterMonth.value : '';
      const yearVal = (filterYear && filterYear.value) ? filterYear.value : '';

      filteredComplaints = complaints.filter(c => {
        // Search matches Name, ID or Title
        let matchSearch = true;
        if (searchVal) {
          const idStr = (c.id || '').toLowerCase();
          const nameStr = (c.citizen || '').toLowerCase();
          const titleStr = (c.title || '').toLowerCase();
          matchSearch = idStr.includes(searchVal) || nameStr.includes(searchVal) || titleStr.includes(searchVal);
        }

        let matchCat = true;
        if (catVal) matchCat = (c.category === catVal);

        let matchStatus = true;
        if (statVal) matchStatus = (c.status === statVal);

        let matchDistrict = true;
        if (districtVal) matchDistrict = (c.district === districtVal);

        let matchDate = true;
        if (dayVal || monthVal || yearVal) {
          const cDate = new Date(c.date);
          const cDay = String(cDate.getDate()).padStart(2, '0');
          const cMonth = String(cDate.getMonth() + 1).padStart(2, '0');
          const cYear = String(cDate.getFullYear());

          if (dayVal) matchDate = matchDate && (cDay === dayVal);
          if (monthVal) matchDate = matchDate && (cMonth === monthVal);
          if (yearVal) matchDate = matchDate && (cYear === yearVal);
        }

        return matchSearch && matchCat && matchStatus && matchDistrict && matchDate;
      });
    }
    
    // 2. Clear table content
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (filteredComplaints.length === 0) {
      if (emptyState) emptyState.classList.remove('d-none');
      return;
    } else {
      if (emptyState) emptyState.classList.add('d-none');
    }

    // 3. Populate rows
    filteredComplaints.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="ps-4 fw-bold text-dark">${escapeHTML(item.id)}</td>
        <td>${escapeHTML(item.citizen)}</td>
        <td><span class="badge bg-light text-dark border px-2 py-1.5">${escapeHTML(item.category)}</span></td>
        <td>${formatDate(item.date)}</td>
        <td>${getStatusBadge(item.status)}</td>
        <td class="text-end pe-4">
          <div class="btn-group gap-1">
            <button class="btn btn-sm btn-outline-primary rounded-2 btn-view" data-id="${escapeHTML(item.id)}" title="Review Details">
              <i class="bi bi-eye-fill"></i> View
            </button>
            <button class="btn btn-sm btn-success rounded-2 btn-approve" data-id="${escapeHTML(item.id)}" title="Approve">
              <i class="bi bi-check-lg"></i> Approve
            </button>
            <button class="btn btn-sm btn-danger rounded-2 btn-reject" data-id="${escapeHTML(item.id)}" title="Reject">
              <i class="bi bi-x-lg"></i> Reject
            </button>
            <button class="btn btn-sm btn-outline-danger rounded-2 btn-delete" data-id="${escapeHTML(item.dbId)}" title="Delete">
              <i class="bi bi-trash-fill"></i> Delete
            </button>
            <button class="btn btn-sm btn-outline-warning rounded-2 btn-status" data-id="${escapeHTML(item.id)}" title="Change Status">
              <i class="bi bi-arrow-repeat"></i> Status
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    bindAdminEvents();
  }

  // --- Bind Filter Event ---
  const btnApplyFilter = document.getElementById('btnApplyFilter');
  if (btnApplyFilter) {
    btnApplyFilter.addEventListener('click', () => {
      renderAdminPanel();
    });
  }

  // Also bind Enter key on search
  const filterSearch = document.getElementById('filterSearch');
  if (filterSearch) {
    filterSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderAdminPanel();
      }
    });
  }
  
  // Optionally auto-filter on select changes
  const filterSelects = document.querySelectorAll('#filterCategory, #filterStatus, #filterDistrict, #filterDay, #filterMonth, #filterYear');
  filterSelects.forEach(sel => {
    sel.addEventListener('change', () => {
      renderAdminPanel();
    });
  });

  // ----------------------------------------------------------
  // EVENT DELEGATION
  // ----------------------------------------------------------
  function bindAdminEvents() {
    // View Action
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const pathPrefix = window.location.pathname.includes('admin_related_pages') ? '../' : '';
        window.location.href = `${pathPrefix}complaint_details.html?id=${id}`;
      });
    });

    // Quick Approve Action
    document.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const complaint = complaints.find(c => c.id === id);
        if (complaint) {
          updateComplaintStatus(complaint, 'Approved');
        }
      });
    });

    // Quick Reject Action
    document.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const complaint = complaints.find(c => c.id === id);
        if (complaint) {
          updateComplaintStatus(complaint, 'Rejected');
        }
      });
    });

    // Custom Status Dropdown Action Trigger
    document.querySelectorAll('.btn-status').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const complaint = complaints.find(c => c.id === id);
        if (complaint) {
          document.getElementById('statusKeyId').value = complaint.id;
          document.getElementById('selectStatus').value = complaint.status;
          statusModal.show();
        }
      });
    });

    // Delete Action
    const deleteModalElem = document.getElementById('deleteModal');
    let deleteModal;
    if (deleteModalElem) {
      deleteModal = new bootstrap.Modal(deleteModalElem);
    }
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        document.getElementById('deleteKeyId').value = id;
        if (deleteModal) deleteModal.show();
      });
    });

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.onclick = function() {
        const id = document.getElementById('deleteKeyId').value;
        const token = localStorage.getItem('token');
        fetch(`http://localhost:5000/api/complaints/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (deleteModal) deleteModal.hide();
          fetchAdminComplaints(); // reload complaints
        })
        .catch(err => console.error(err));
      };
    }
  }

  // Status Change Submit Handler
  statusForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const id = document.getElementById('statusKeyId').value;
    const newStatus = document.getElementById('selectStatus').value;

    const complaint = complaints.find(c => c.id === id);
    if (complaint) {
      statusModal.hide();
      updateComplaintStatus(complaint, newStatus);
    }
  });

  // ----------------------------------------------------------
  // UTILITY HELPERS
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

  // Initial draw panel
  // Initial data load
  fetchAdminComplaints();
});
