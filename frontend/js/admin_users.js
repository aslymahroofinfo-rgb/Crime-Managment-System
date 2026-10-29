/* ============================================================
   Crime Complaint Management System - Admin Citizens Registry
   Author: Student Project
   Description: Renders citizen profiles database, view, delete.
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
  let citizens = [];
  let isViewingAdmins = false;
  
  const adminData = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = adminData.email === 'admin@ccms.com';
  
  function fetchCitizens() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('http://localhost:5000/api/users/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      citizens = data;
      renderCitizens();
    })
    .catch(err => console.error('Error fetching users:', err));
  }

  function fetchAdmins() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('http://localhost:5000/api/users/admins', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      citizens = data;
      renderCitizens();
    })
    .catch(err => console.error('Error fetching admins:', err));
  }

  function fetchTotalCount() {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:5000/api/users/count', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (totalCount) {
        totalCount.textContent = `Total Registered: ${data.total}`;
      }
    })
    .catch(err => console.error('Error fetching total count:', err));
  }

  const tableBody = document.getElementById('usersTableBody');
  const totalCount = document.getElementById('totalUsersCount');
  const viewModal = new bootstrap.Modal(document.getElementById('citizenViewModal'));

  // Live Server Time
  const serverTimeText = document.getElementById('serverTimeText');
  if (serverTimeText) {
    serverTimeText.textContent = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  function renderCitizens() {
    tableBody.innerHTML = '';
    // totalCount text is now handled by fetchTotalCount()
    const tableTitle = document.getElementById('tableTitle');
    if(tableTitle) tableTitle.innerHTML = `<i class="bi bi-people-fill text-primary me-2"></i>Active ${isViewingAdmins ? 'Administrators' : 'Citizens'}`;

    citizens.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="ps-4 fw-bold text-dark">${escapeHTML(user.id)}</td>
        <td>${escapeHTML(user.name)}</td>
        <td>${escapeHTML(user.email)}</td>
        <td>${escapeHTML(user.phone)}</td>
        <td class="font-monospace">${escapeHTML(user.nid)}</td>
        <td><span class="badge bg-primary px-2.5 py-1.5">${escapeHTML(user.cases)} Cases</span></td>
        <td class="text-end pe-4">
          <div class="btn-group gap-1">
            ${isSuperAdmin && !isViewingAdmins ? `
            <button class="btn btn-sm btn-outline-success rounded-2 btn-promote-user" data-id="${escapeHTML(user.dbId)}" title="Promote to Admin">
              <i class="bi bi-shield-check"></i> Promote
            </button>` : ''}
            <button class="btn btn-sm btn-outline-primary rounded-2 btn-view-user" data-id="${escapeHTML(user.id)}">
              <i class="bi bi-person-lines-fill"></i> View
            </button>
            <button class="btn btn-sm btn-outline-danger rounded-2 btn-delete-user" data-id="${escapeHTML(user.dbId)}">
              <i class="bi bi-trash"></i> Suspend
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    bindUserEvents();
  }

  function bindUserEvents() {
    // View Citizen Card
    document.querySelectorAll('.btn-view-user').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const user = citizens.find(c => c.id === id);
        if (user) {
          document.getElementById('detName').textContent = user.name;
          document.getElementById('detId').textContent = user.id;
          document.getElementById('detEmail').textContent = user.email;
          document.getElementById('detPhone').textContent = user.phone;
          document.getElementById('detNID').textContent = user.nid;
          document.getElementById('detCases').textContent = user.cases;
          document.getElementById('detAddress').textContent = user.address;
          viewModal.show();
        }
      });
    });

    // Suspend Citizen
    const deleteModalElem = document.getElementById('deleteModal');
    let deleteModal;
    if (deleteModalElem) {
      deleteModal = new bootstrap.Modal(deleteModalElem);
    }

    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            document.getElementById('deleteKeyId').value = userId;
            deleteModal.show();
        });
    });

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        // Use onclick so we don't accidentally stack event listeners when re-rendering
        confirmDeleteBtn.onclick = function() {
            const userId = document.getElementById('deleteKeyId').value;
            const token = localStorage.getItem('token');
            fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                deleteModal.hide();
                fetchTotalCount(); // Refresh absolute total
                if (isViewingAdmins) fetchAdmins();
                else fetchCitizens();
            })
            .catch(err => console.error(err));
        };
    }

    // Promote Citizen to Admin
    document.querySelectorAll('.btn-promote-user').forEach(btn => {
      btn.addEventListener('click', function() {
        const userId = this.getAttribute('data-id');
        if (confirm('Are you sure you want to promote this citizen to an Admin? They will have full administrative privileges.')) {
          const token = localStorage.getItem('token');
          fetch(`http://localhost:5000/api/users/${userId}/promote`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(async res => {
            const data = await res.json();
            if(!res.ok) throw new Error(data.message);
            alert(data.message);
            fetchCitizens(); // reload
          })
          .catch(err => alert(err.message));
        }
      });
    });
  }

  // Bind Super Admin Toggle
  if (isSuperAdmin) {
    const toggleGroup = document.getElementById('superAdminToggle');
    if (toggleGroup) {
      toggleGroup.classList.remove('d-none');
      const btnShowCitizens = document.getElementById('btnShowCitizens');
      const btnShowAdmins = document.getElementById('btnShowAdmins');

      if (btnShowCitizens && btnShowAdmins) {
        btnShowCitizens.addEventListener('click', () => {
          if (isViewingAdmins) {
            isViewingAdmins = false;
            btnShowCitizens.classList.replace('btn-outline-primary', 'btn-primary');
            btnShowAdmins.classList.replace('btn-primary', 'btn-outline-primary');
            fetchCitizens();
          }
        });

        btnShowAdmins.addEventListener('click', () => {
          if (!isViewingAdmins) {
            isViewingAdmins = true;
            btnShowAdmins.classList.replace('btn-outline-primary', 'btn-primary');
            btnShowCitizens.classList.replace('btn-primary', 'btn-outline-primary');
            fetchAdmins();
          }
        });
      }
    }
  }

  fetchTotalCount();
  fetchCitizens();
});
