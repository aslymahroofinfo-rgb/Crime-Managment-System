import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch(e) {}
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm py-2">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src="/images/logo.png" alt="Logo" className="brand-logo" style={{ height: '45px', marginRight: '10px' }} />
          <span>CRIME INVESTIGATION<br/><small style={{ fontWeight: 400, fontSize: '.78rem', opacity: .85 }}>WEBSITE</small></span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMenu" aria-controls="navbarMenu" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarMenu">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/"><i className="bi bi-house-fill me-1"></i>Home</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/complaint' ? 'active' : ''}`} to="/complaint"><i className="bi bi-file-earmark-text me-1"></i>File Complaint</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${location.pathname === '/track' ? 'active' : ''}`} to="/track"><i className="bi bi-search me-1"></i>Track Complaint</Link>
            </li>
            
            {!token ? (
              <>
                <li className="nav-item ms-lg-2">
                  <Link className="nav-link nav-btn-login px-3" to="/login"><i className="bi bi-box-arrow-in-right me-1"></i>Login</Link>
                </li>
                <li className="nav-item ms-lg-1">
                  <Link className="nav-link nav-btn-register px-3" to="/register"><i className="bi bi-person-plus-fill me-1"></i>Register</Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-lg-2">
                  <Link className="nav-link text-warning fw-semibold" to={user?.role === 'Admin' ? '/admin' : '/dashboard'}>
                    <i className="bi bi-person-circle me-1"></i> Dashboard
                  </Link>
                </li>
                <li className="nav-item ms-lg-1">
                  <button className="nav-link text-danger border-0 bg-transparent" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-1"></i> Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
