import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link className="navbar-brand text-decoration-none d-flex align-items-center gap-2" to="/">
            <img src="/images/logo.png" alt="Logo" style={{ height: '35px' }} />
            <div className="text-white">
              <h6 className="mb-0 fw-bold">CIW Admin</h6>
              <small className="text-white-50" style={{ fontSize: '0.72rem' }}>Control Panel</small>
            </div>
          </Link>
        </div>
        <ul className="admin-sidebar-menu">
          <li>
            <Link to="/admin" className="admin-sidebar-link active">
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/complaints" className="admin-sidebar-link">
              <i className="bi bi-file-earmark-text-fill"></i>
              <span>Complaints</span>
            </Link>
          </li>
          <li>
            <Link to="/admin/users" className="admin-sidebar-link">
              <i className="bi bi-people-fill"></i>
              <span>Users</span>
            </Link>
          </li>
        </ul>
        <div className="admin-sidebar-footer">
          <button className="admin-sidebar-link text-danger border-0 bg-transparent w-100 text-start" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
