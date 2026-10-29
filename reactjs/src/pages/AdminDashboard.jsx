import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, users: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch Complaints
    fetch('http://localhost:5000/api/complaints/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setComplaints(data);
        setStats(prev => ({
          ...prev,
          total: data.length,
          pending: data.filter(c => c.status === 'Pending').length,
          resolved: data.filter(c => c.status === 'Resolved').length
        }));
      }
    })
    .catch(err => console.error(err));

    // Fetch Users count
    fetch('http://localhost:5000/api/users/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setStats(prev => ({ ...prev, users: data.length }));
      }
    })
    .catch(err => console.error(err));
  }, [navigate]);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom g-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Administrative Overview</h2>
          <p className="text-muted mb-0 small">Welcome back, Admin. System operations status report and active complaints.</p>
        </div>
        <div className="bg-white rounded-3 px-3 py-2 shadow-sm border">
          <span className="text-muted small"><i className="bi bi-clock me-1 text-primary"></i>Server Time:</span>
          <strong className="text-dark small ms-1">{new Date().toLocaleTimeString()}</strong>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-primary">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold uppercase">Total Complaints</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{stats.total}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                <i className="bi bi-clipboard-data-fill fs-3"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-warning">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold uppercase">Pending Cases</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{stats.pending}</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3">
                <i className="bi bi-hourglass-split fs-3"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-success">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold uppercase">Resolved Cases</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{stats.resolved}</h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                <i className="bi bi-patch-check-fill fs-3"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-info">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-bold uppercase">Registered Users</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{stats.users}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-3">
                <i className="bi bi-people-fill fs-3"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
