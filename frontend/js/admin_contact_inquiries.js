/* ============================================================
   Crime Complaint Management System - Admin Contact Inquiries
   Author: Student Project
   Description: Management panel for public contact inquiries.
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
  let inquiries = [];
  let currentInquiryId = null;

  // 1. Verify Admin Authentication
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || !user || !user.role || (user.role.toLowerCase() !== 'admin')) {
    alert('Access restricted. Please log in as an Administrator.');
    window.location.href = '../../pages/login.html';
    return;
  }

  // 2. Clock updater
  function updateTime() {
    const el = document.getElementById('serverTimeText');
    if (el) {
      el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  updateTime();
  setInterval(updateTime, 30000);

  // 3. Elements
  const tableBody = document.getElementById('inquiriesTableBody');
  const emptyState = document.getElementById('inquiriesEmptyState');
  const countBadge = document.getElementById('inquiryCountBadge');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const btnRefresh = document.getElementById('btnRefresh');

  const inquiryModalEl = document.getElementById('inquiryDetailsModal');
  const inquiryModal = inquiryModalEl ? new bootstrap.Modal(inquiryModalEl) : null;

  // 4. Fetch Inquiries from Backend
  async function fetchInquiries() {
    try {
      let url = 'http://localhost:5000/api/contact';
      const params = new URLSearchParams();

      const searchVal = searchInput ? searchInput.value.trim() : '';
      const statusVal = statusFilter ? statusFilter.value : '';

      if (searchVal) params.append('search', searchVal);
      if (statusVal) params.append('status', statusVal);

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        alert('Your session has expired or is unauthorized. Please log in again.');
        window.location.href = '../../pages/login.html';
        return;
      }

      const data = await res.json();
      inquiries = Array.isArray(data) ? data : [];
      renderInquiries();
    } catch (err) {
      console.error('Error fetching contact inquiries:', err);
    }
  }

  // 5. Render Inquiries Table
  function renderInquiries() {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (inquiries.length === 0) {
      if (emptyState) emptyState.classList.remove('d-none');
      if (countBadge) countBadge.textContent = '0 total';
      return;
    }

    if (emptyState) emptyState.classList.add('d-none');
    if (countBadge) {
      const newCount = inquiries.filter(i => i.status === 'New').length;
      countBadge.textContent = `${inquiries.length} total (${newCount} new)`;
    }

    inquiries.forEach(inquiry => {
      const inqId = inquiry._id || inquiry.id;
      const tr = document.createElement('tr');

      let statusBadge = '';
      if (inquiry.status === 'New') {
        statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-bell-fill me-1"></i>New</span>';
      } else if (inquiry.status === 'Read') {
        statusBadge = '<span class="badge bg-info text-dark"><i class="bi bi-envelope-open me-1"></i>Read</span>';
      } else if (inquiry.status === 'Resolved') {
        statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>Resolved</span>';
      } else {
        statusBadge = `<span class="badge bg-secondary">${escapeHTML(inquiry.status)}</span>`;
      }

      const dateStr = inquiry.createdAt
        ? new Date(inquiry.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';

      tr.innerHTML = `
        <td class="ps-4 text-muted small">${escapeHTML(dateStr)}</td>
        <td class="fw-semibold text-dark">${escapeHTML(inquiry.name)}</td>
        <td class="text-muted small">${escapeHTML(inquiry.email)}</td>
        <td class="text-dark small">${escapeHTML(inquiry.subject)}</td>
        <td>${statusBadge}</td>
        <td class="text-end pe-4">
          <button class="btn btn-sm btn-outline-primary px-2.5 py-1 rounded-2 btn-view-inquiry" data-id="${escapeHTML(inqId)}">
            <i class="bi bi-eye me-1"></i>View
          </button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    // Attach click handlers to View buttons
    document.querySelectorAll('.btn-view-inquiry').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        openInquiryModal(id);
      });
    });
  }

  // 6. Open Inquiry Modal Details
  async function openInquiryModal(id) {
    currentInquiryId = id;
    const inquiry = inquiries.find(i => (i._id === id || i.id === id));
    if (!inquiry) return;

    // Fill Modal Data safely
    document.getElementById('modalSenderName').textContent = inquiry.name || '';
    document.getElementById('modalSenderEmail').textContent = inquiry.email || '';
    document.getElementById('modalSenderPhone').textContent = inquiry.phone || 'Not provided';
    document.getElementById('modalSubject').textContent = inquiry.subject || '';
    document.getElementById('modalMessageContent').textContent = inquiry.message || '';

    const dateStr = inquiry.createdAt
      ? new Date(inquiry.createdAt).toLocaleString()
      : 'N/A';
    document.getElementById('modalSubmittedDate').textContent = dateStr;

    renderModalStatus(inquiry.status);

    // If status is "New", auto-mark as "Read" upon opening details
    if (inquiry.status === 'New') {
      updateStatus(id, 'Read', false);
    }

    if (inquiryModal) {
      inquiryModal.show();
    }
  }

  function renderModalStatus(status) {
    const badgeContainer = document.getElementById('modalStatusBadge');
    const actionsContainer = document.getElementById('modalStatusActions');

    if (badgeContainer) {
      if (status === 'New') {
        badgeContainer.innerHTML = '<span class="badge bg-warning text-dark px-3 py-1.5"><i class="bi bi-bell-fill me-1"></i>New</span>';
      } else if (status === 'Read') {
        badgeContainer.innerHTML = '<span class="badge bg-info text-dark px-3 py-1.5"><i class="bi bi-envelope-open me-1"></i>Read</span>';
      } else if (status === 'Resolved') {
        badgeContainer.innerHTML = '<span class="badge bg-success px-3 py-1.5"><i class="bi bi-check-circle-fill me-1"></i>Resolved</span>';
      }
    }

    if (actionsContainer) {
      actionsContainer.innerHTML = '';

      if (status !== 'Read') {
        const markReadBtn = document.createElement('button');
        markReadBtn.type = 'button';
        markReadBtn.className = 'btn btn-outline-info btn-sm rounded-3';
        markReadBtn.innerHTML = '<i class="bi bi-envelope-open me-1"></i>Mark Read';
        markReadBtn.onclick = () => updateStatus(currentInquiryId, 'Read', true);
        actionsContainer.appendChild(markReadBtn);
      }

      if (status !== 'Resolved') {
        const resolveBtn = document.createElement('button');
        resolveBtn.type = 'button';
        resolveBtn.className = 'btn btn-success btn-sm rounded-3';
        resolveBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Mark Resolved';
        resolveBtn.onclick = () => updateStatus(currentInquiryId, 'Resolved', true);
        actionsContainer.appendChild(resolveBtn);
      }

      if (status === 'Resolved') {
        const reopenBtn = document.createElement('button');
        reopenBtn.type = 'button';
        reopenBtn.className = 'btn btn-outline-secondary btn-sm rounded-3';
        reopenBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise me-1"></i>Reopen as New';
        reopenBtn.onclick = () => updateStatus(currentInquiryId, 'New', true);
        actionsContainer.appendChild(reopenBtn);
      }
    }
  }

  // 7. Update Status API Call
  async function updateStatus(id, newStatus, updateModalView = true) {
    try {
      const res = await fetch(`http://localhost:5000/api/contact/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.inquiry;

        // Update in memory
        const idx = inquiries.findIndex(i => (i._id === id || i.id === id));
        if (idx !== -1) {
          inquiries[idx].status = newStatus;
          if (updated && updated.updatedAt) inquiries[idx].updatedAt = updated.updatedAt;
        }

        renderInquiries();
        if (updateModalView && currentInquiryId === id) {
          renderModalStatus(newStatus);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to update inquiry status.');
      }
    } catch (err) {
      console.error('Error updating inquiry status:', err);
      alert('Network error while updating inquiry status.');
    }
  }

  // 8. Filter and Search Listeners
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchInquiries, 300);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', fetchInquiries);
  }

  if (btnRefresh) {
    btnRefresh.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      if (statusFilter) statusFilter.value = '';
      fetchInquiries();
    });
  }

  // Initial load
  fetchInquiries();
});

