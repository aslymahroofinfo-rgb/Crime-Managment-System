/* Admin Emergencies - Fetch and render only Emergency category complaints */
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
  const tableBody = document.getElementById('emergenciesTableBody');
  const emptyState = document.getElementById('emergenciesEmptyState');

  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  }

  function getStatusBadge(status) {
    let badgeClass = '';
    switch (status) {
      case 'Pending': badgeClass = 'bg-warning text-dark'; break;
      case 'Under Investigation': badgeClass = 'bg-info text-dark'; break;
      case 'Approved': badgeClass = 'bg-primary'; break;
      case 'Rejected': badgeClass = 'bg-danger'; break;
      case 'Resolved': badgeClass = 'bg-success'; break;
      default: badgeClass = 'bg-secondary';
    }
    return `<span class="badge ${badgeClass} fs-7 px-2.5 py-1.5">${status}</span>`;
  }

  function fetchEmergencies() {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/complaints/all', {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    .then(res => res.json())
    .then(data => {
      const emergencies = data.filter(c => (c.category || '').toLowerCase() === 'emergency');
      render(emergencies);
    })
    .catch(err => console.error('Error fetching emergencies', err));
  }

  function render(items) {
    tableBody.innerHTML = '';
    if (!items || items.length === 0) {
      emptyState.classList.remove('d-none');
      return;
    }
    emptyState.classList.add('d-none');

    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="ps-4 fw-bold text-dark">${escapeHTML(item.complaintId)}</td>
        <td>${escapeHTML(item.user ? item.user.fullName : 'Anonymous')}</td>
        <td>${escapeHTML(item.district || '')}</td>
        <td>${formatDate(item.incidentDate)}</td>
        <td>${getStatusBadge(item.status)}</td>
        <td class="text-end pe-4">
          <div class="btn-group gap-1">
            <button class="btn btn-sm btn-outline-primary btn-view" data-id="${escapeHTML(item.complaintId)}"><i class="bi bi-eye-fill"></i> View</button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // bind view buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        window.location.href = `complaint_details.html?id=${id}`;
      });
    });
  }

  fetchEmergencies();
});
