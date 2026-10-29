import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar() {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleText = isSuperAdmin ? 'Super Administrator' : 'Control Panel';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <NavLink className="navbar-brand text-decoration-none d-flex align-items-center gap-2" to="/">
          <img src="/images/logo.png" alt="Logo" style={{ height: '35px' }} />
          <div className="text-white">
            <h6 className="mb-0 fw-bold">CIW Admin</h6>
            <small className="text-white-50" style={{ fontSize: '0.72rem' }}>{roleText}</small>
          </div>
        </NavLink>
      </div>

      <ul className="admin-sidebar-menu">
        <li>
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/complaints"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-file-earmark-text-fill"></i>
            <span>Complaints</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/emergencies"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>Emergency</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/users"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-people-fill"></i>
            <span>Users</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/contacts"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-envelope-paper-fill"></i>
            <span>Inquiries</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-bar-chart-line-fill"></i>
            <span>Reports</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <i className="bi bi-gear-fill"></i>
            <span>Settings</span>
          </NavLink>
        </li>
        {isSuperAdmin && (
          <li>
            <NavLink
              to="/admin/audit"
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <i className="bi bi-shield-shaded"></i>
              <span>Audit Logs</span>
            </NavLink>
          </li>
        )}
      </ul>

      <div className="admin-sidebar-footer">
        <button
          type="button"
          className="admin-sidebar-link text-danger border-0 bg-transparent w-100 text-start"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

