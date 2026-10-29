import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicNavbar() {
  const location = useLocation();
  const { isAuthenticated, user, isAdmin, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const displayName = user
    ? (user.email === 'admin@ccms.com' ? 'Super Administrator' : user.fullName || 'User')
    : '';

  const dashboardTarget = isAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm py-2">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src="/images/logo.png" alt="Logo" className="brand-logo" style={{ height: '45px', marginRight: '10px' }} />
          <span>
            CRIME INVESTIGATION<br />
            <small style={{ fontWeight: 400, fontSize: '.78rem', opacity: .85 }}>WEBSITE</small>
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMenu"
          aria-controls="navbarMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarMenu">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">
                <i className="bi bi-house-fill me-1"></i>Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/complaint') ? 'active' : ''}`} to="/complaint">
                <i className="bi bi-file-earmark-text me-1"></i>File Complaint
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/track') ? 'active' : ''}`} to="/track">
                <i className="bi bi-search me-1"></i>Track Complaint
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/about') ? 'active' : ''}`} to="/about">
                <i className="bi bi-info-circle me-1"></i>About Us
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/contact') ? 'active' : ''}`} to="/contact">
                <i className="bi bi-telephone-fill me-1"></i>Contact
              </Link>
            </li>

            {!isAuthenticated ? (
              <>
                <li className="nav-item ms-lg-2">
                  <Link className="nav-link nav-btn-login px-3" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>Login
                  </Link>
                </li>
                <li className="nav-item ms-lg-1">
                  <Link className="nav-link nav-btn-register px-3" to="/register">
                    <i className="bi bi-person-plus-fill me-1"></i>Register
                  </Link>
                </li>
              </>
            ) : (
              <li className="nav-item ms-lg-2 dropdown">
                <a
                  className="nav-link dropdown-toggle btn btn-outline-light px-3 py-1.5 text-white d-flex align-items-center gap-2"
                  href="#"
                  id="globalUserDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ color: 'var(--gold)', fontWeight: 600 }}
                >
                  <i className="bi bi-person-circle fs-5"></i>
                  <span>{displayName}</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end border-0 shadow mt-2" aria-labelledby="globalUserDropdown">
                  <li>
                    <span className="dropdown-item-text small text-muted">
                      Signed in as<br />
                      <strong>{user?.email}</strong>
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item py-2" to={dashboardTarget}>
                      <i className="bi bi-speedometer2 me-2 text-muted"></i>Dashboard
                    </Link>
                  </li>
                  {!isAdmin && (
                    <li>
                      <Link className="dropdown-item py-2" to="/profile">
                        <i className="bi bi-person-badge me-2 text-muted"></i>My Profile
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item py-2 text-danger border-0 bg-transparent w-100 text-start"
                      onClick={logout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>Sign Out
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

