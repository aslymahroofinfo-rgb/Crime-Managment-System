import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale',
  'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
  'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
  'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
  'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, investigating: 0, resolved: 0 });
  const navigate = useNavigate();

  // Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: '', phoneNumber: '', addressNo: '', street: '', city: '', district: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Load User
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      setUser(u);
    } catch(e) {}

    // Fetch Complaints
    fetch('http://localhost:5000/api/complaints/my-complaints', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setComplaints(data);
      setStats({
        total: data.length,
        pending: data.filter(c => c.status === 'Pending').length,
        investigating: data.filter(c => c.status === 'Under Investigation').length,
        resolved: data.filter(c => c.status === 'Resolved').length
      });
    })
    .catch(err => console.error(err));
  }, [navigate]);

  const openProfileEdit = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      let addr = data.address || {};
      if (typeof addr === 'string') addr = { no: '', street: '', city: '', district: '' };
      setProfileData({
        fullName: data.fullName || '',
        phoneNumber: data.phoneNumber || '',
        addressNo: addr.no || '',
        street: addr.street || '',
        city: addr.city || '',
        district: addr.district || ''
      });
      setProfileError('');
      setProfileSuccess('');
      setShowProfileModal(true);
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setProfileSuccess('Profile updated successfully!');
        setProfileError('');
        setTimeout(() => setShowProfileModal(false), 1500);
      } else {
        setProfileError(data.message || 'Failed to update');
      }
    } catch (err) {
      setProfileError('Server error');
    }
  };

  const getStatusBadge = (status) => {
    let badgeClass = '';
    switch (status) {
      case 'Pending': badgeClass = 'bg-warning text-dark'; break;
      case 'Under Investigation': badgeClass = 'bg-info text-dark'; break;
      case 'Approved': badgeClass = 'bg-primary'; break;
      case 'Rejected': badgeClass = 'bg-danger'; break;
      case 'Resolved': badgeClass = 'bg-success'; break;
      default: badgeClass = 'bg-secondary';
    }
    return <span className={`badge ${badgeClass} fs-7 px-2.5 py-1.5`}>{status}</span>;
  };

  return (
    <div className="bg-light py-5">
      <div className="container py-3">
        {/* Header section */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-3">
          <div>
            <h2 className="fw-bold text-dark mb-1" id="welcomeUserName">Welcome Back, {user?.fullName || 'Citizen'}</h2>
            <p className="text-muted mb-0 small">Your personal dashboard to track and manage complaints.</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary px-4 py-2 fw-semibold" onClick={openProfileEdit}>
              <i className="bi bi-person-lines-fill me-1"></i> Edit Profile
            </button>
            <button className="btn btn-primary px-4 py-2 fw-semibold shadow-sm btn-hover-lift" onClick={() => navigate('/complaint')}>
              <i className="bi bi-plus-circle me-1"></i> File New Complaint
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="row g-4 mb-5">
          <div className="col-sm-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-primary">
              <span className="text-muted small fw-bold uppercase">Total Filed</span>
              <h3 className="fw-bold text-dark mt-1 mb-0">{stats.total}</h3>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-warning">
              <span className="text-muted small fw-bold uppercase">Pending</span>
              <h3 className="fw-bold text-dark mt-1 mb-0">{stats.pending}</h3>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-info">
              <span className="text-muted small fw-bold uppercase">Investigating</span>
              <h3 className="fw-bold text-dark mt-1 mb-0">{stats.investigating}</h3>
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 bg-white p-3 h-100 border-start border-4 border-success">
              <span className="text-muted small fw-bold uppercase">Resolved</span>
              <h3 className="fw-bold text-dark mt-1 mb-0">{stats.resolved}</h3>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
          <div className="card-header bg-white py-3 border-0 d-flex align-items-center px-4">
            <h5 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history text-primary me-2"></i>My Recent Complaints</h5>
          </div>
          <div className="card-body p-0">
            {complaints.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                <h5 className="fw-bold text-dark mt-3 mb-1">No Complaints Found</h5>
                <p className="text-muted small">You haven't filed any complaints yet.</p>
                <button className="btn btn-outline-primary mt-2" onClick={() => navigate('/complaint')}>File your first complaint</button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted uppercase small">
                    <tr>
                      <th className="ps-4">Reference ID</th>
                      <th>Category</th>
                      <th>Date Filed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map(c => (
                      <tr key={c._id}>
                        <td className="ps-4 fw-bold text-dark">{c.complaintId}</td>
                        <td><span className="badge bg-light text-dark border px-2 py-1.5">{c.category}</span></td>
                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td>{getStatusBadge(c.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Component */}
      {showProfileModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header text-white border-0 py-3 bg-dark">
                <h5 className="modal-title fw-bold"><i className="bi bi-person-lines-fill me-2"></i>Edit My Profile</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowProfileModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-white">
                {profileError && <div className="alert alert-danger py-2">{profileError}</div>}
                {profileSuccess && <div className="alert alert-success py-2">{profileSuccess}</div>}
                
                <form onSubmit={handleProfileSubmit}>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Full Name</label>
                      <input type="text" className="form-control bg-light" required
                             value={profileData.fullName} onChange={(e) => setProfileData({...profileData, fullName: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Phone Number</label>
                      <input type="text" className="form-control bg-light" required
                             value={profileData.phoneNumber} onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})} />
                    </div>
                  </div>
                  
                  <h6 className="fw-bold text-primary mb-2 mt-4">Address Details</h6>
                  <div className="row g-2 mb-4">
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">House No</label>
                      <input type="text" className="form-control bg-light" required
                             value={profileData.addressNo} onChange={(e) => setProfileData({...profileData, addressNo: e.target.value})} />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-dark">Street Name</label>
                      <input type="text" className="form-control bg-light" required
                             value={profileData.street} onChange={(e) => setProfileData({...profileData, street: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">City</label>
                      <input type="text" className="form-control bg-light" required
                             value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">District</label>
                      <select className="form-select bg-light" required 
                              value={profileData.district} onChange={(e) => setProfileData({...profileData, district: e.target.value})}>
                        <option value="">Select District...</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setShowProfileModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-4 py-2 shadow-sm">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
