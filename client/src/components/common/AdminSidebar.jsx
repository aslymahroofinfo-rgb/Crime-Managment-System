import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePageTransition } from '../../context/PageTransitionContext';

export default function AdminSidebar() {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { navigateWithTransition } = usePageTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigateWithTransition('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const roleText = isSuperAdmin ? 'Super Administrator' : 'Control Panel';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header d-flex align-items-center justify-content-between">
        <NavLink className="navbar-brand text-decoration-none d-flex align-items-center gap-2" to="/">
          <img src="/images/logo.png" alt="Logo" style={{ height: '35px' }} />
          <div className="text-white">
            <h6 className="mb-0 fw-bold">CIW Admin</h6>
            <small className="text-white-50" style={{ fontSize: '0.72rem' }}>{roleText}</small>
          </div>
        </NavLink>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="btn btn-sm btn-outline-light d-lg-none d-flex align-items-center justify-content-center"
          style={{ width: '44px', height: '44px', padding: 0 }}
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label="Toggle admin navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <i className={`bi bi-${mobileMenuOpen ? 'x-lg' : 'list'} fs-5`}></i>
        </button>
      </div>

      <div className={`admin-sidebar-collapse ${mobileMenuOpen ? 'show' : ''}`}>
        <ul className="admin-sidebar-menu">
          <li>
            <NavLink
              to="/admin/dashboard"
              end
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/complaints"
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="bi bi-file-earmark-text-fill"></i>
              <span>Complaints</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/emergencies"
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>Emergency</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="bi bi-people-fill"></i>
              <span>Users</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/contacts"
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="bi bi-envelope-paper-fill"></i>
              <span>Inquiries</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/reports"
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="bi bi-bar-chart-line-fill"></i>
              <span>Reports</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className="bi bi-gear-fill"></i>
              <span>Settings</span>
            </NavLink>
          </li>
          {isSuperAdmin && (
            <>
              <li>
                <NavLink
                  to="/admin/administrators"
                  className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <i className="bi bi-person-gear"></i>
                  <span>Admin Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/audit"
                  className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <i className="bi bi-shield-shaded"></i>
                  <span>Audit Logs</span>
                </NavLink>
              </li>
            </>
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
      </div>
    </aside>
  );
}

