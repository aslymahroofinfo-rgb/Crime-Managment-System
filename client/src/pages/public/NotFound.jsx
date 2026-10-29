import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container my-5 py-5 text-center">
      <div className="p-5 bg-white rounded-4 shadow-sm border mx-auto" style={{ maxWidth: '550px' }}>
        <i className="bi bi-exclamation-octagon text-danger" style={{ fontSize: '4rem' }}></i>
        <h1 className="fw-bold text-dark mt-3 mb-2">404 - Page Not Found</h1>
        <p className="text-muted small mb-4">
          The requested portal page could not be located. It may have moved or the address is incorrect.
        </p>
        <Link to="/" className="btn btn-primary px-4 py-2 rounded-3 shadow-sm" style={{ background: 'var(--primary)', border: 'none' }}>
          <i className="bi bi-house-door-fill me-2"></i>Return to Home
        </Link>
      </div>
    </div>
  );
}

