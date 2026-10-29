import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <section className="hero-section text-center position-relative overflow-hidden">
        <div className="container position-relative z-1">
          <span className="badge bg-danger bg-opacity-25 text-white px-3 py-2 rounded-pill mb-3 border border-danger fw-normal">
            <i className="bi bi-shield-fill-check me-1"></i> Official Citizen Portal
          </span>
          <h1 className="display-4 fw-bolder text-white mb-3 text-shadow">
            Report Crimes <span className="text-highlight">Safely</span> & <span className="text-highlight">Anonymously</span>
          </h1>
          <p className="lead text-white-50 mb-5 mx-auto" style={{ maxWidth: '700px' }}>
            A secure bridge between citizens and law enforcement. File complaints, upload evidence, and track investigation progress in real-time.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/complaint" className="btn btn-primary btn-lg rounded-pill px-4 shadow-lg btn-hover-lift">
              File a Complaint <i className="bi bi-arrow-right ms-1"></i>
            </Link>
            <Link to="/track" className="btn btn-outline-light btn-lg rounded-pill px-4 btn-hover-lift">
              Track Status <i className="bi bi-search ms-1"></i>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">How It Works</h2>
            <div className="heading-underline mx-auto"></div>
            <p className="text-muted mt-3">Three simple steps to register your complaint securely.</p>
          </div>
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="feature-card p-4 rounded-4 h-100 border bg-light">
                <div className="icon-circle bg-primary text-white mx-auto mb-4 shadow">
                  <i className="bi bi-file-earmark-text fs-3"></i>
                </div>
                <h5 className="fw-bold text-dark">1. Submit Details</h5>
                <p className="text-muted small mb-0">Fill out the incident form with description, time, and location. You can choose to remain anonymous.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card p-4 rounded-4 h-100 border bg-light">
                <div className="icon-circle bg-warning text-dark mx-auto mb-4 shadow">
                  <i className="bi bi-cloud-arrow-up fs-3"></i>
                </div>
                <h5 className="fw-bold text-dark">2. Upload Evidence</h5>
                <p className="text-muted small mb-0">Securely attach photos, videos, or documents to strengthen your complaint.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card p-4 rounded-4 h-100 border bg-light">
                <div className="icon-circle bg-success text-white mx-auto mb-4 shadow">
                  <i className="bi bi-activity fs-3"></i>
                </div>
                <h5 className="fw-bold text-dark">3. Track Progress</h5>
                <p className="text-muted small mb-0">Use your unique Reference ID to monitor the investigation status in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
