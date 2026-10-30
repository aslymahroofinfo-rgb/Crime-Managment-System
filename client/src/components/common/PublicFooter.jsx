import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="footer py-5 mt-auto bg-dark text-white-50">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6 pe-lg-5">
            <h5 className="text-white fw-bold mb-3 d-flex align-items-center">
              <img src="/images/logo.png" alt="Logo" style={{ height: '30px', marginRight: '10px' }} />
              CIW Portal
            </h5>
            <p className="text-white-50 small mb-4">
              Empowering citizens to safely report and track criminal incidents. Together we can build a safer community through transparent, effective law enforcement communication.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white-50 hover-white" aria-label="Facebook"><i className="bi bi-facebook fs-5"></i></a>
              <a href="#" className="text-white-50 hover-white" aria-label="Twitter"><i className="bi bi-twitter-x fs-5"></i></a>
              <a href="#" className="text-white-50 hover-white" aria-label="Instagram"><i className="bi bi-instagram fs-5"></i></a>
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-bold mb-3 uppercase">Quick Links</h6>
            <ul className="list-unstyled footer-links mb-0 small">
              <li className="mb-2"><Link to="/">Home Page</Link></li>
              <li className="mb-2"><Link to="/complaint">File a Complaint</Link></li>
              <li className="mb-2"><Link to="/track">Track Status</Link></li>
              <li className="mb-2"><Link to="/about">About System</Link></li>
              <li className="mb-2"><Link to="/contact">Contact Support</Link></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 uppercase">Legal & Help</h6>
            <ul className="list-unstyled footer-links mb-0 small">
              <li className="mb-2"><a href="#">Privacy Policy</a></li>
              <li className="mb-2"><a href="#">Terms of Service</a></li>
              <li className="mb-2"><a href="#">Cyber Safety Guidelines</a></li>
              <li className="mb-2"><a href="#">FAQs</a></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 uppercase">National Helplines</h6>
            <div className="bg-dark bg-opacity-50 p-3 rounded-3 border border-secondary border-opacity-25">
              <div className="d-flex flex-column gap-2 mb-2">
                <a href="tel:119" className="text-white text-decoration-none d-flex align-items-center justify-content-between small">
                  <span><i className="bi bi-telephone-fill text-danger me-2"></i>Police Emergency</span>
                  <strong className="badge bg-danger">119</strong>
                </a>
                <a href="tel:1990" className="text-white text-decoration-none d-flex align-items-center justify-content-between small">
                  <span><i className="bi bi-telephone-fill text-success me-2"></i>Suwa Seriya Ambulance</span>
                  <strong className="badge bg-success">1990</strong>
                </a>
                <a href="tel:110" className="text-white text-decoration-none d-flex align-items-center justify-content-between small">
                  <span><i className="bi bi-telephone-fill text-warning me-2"></i>Fire & Rescue</span>
                  <strong className="badge bg-warning text-dark">110</strong>
                </a>
              </div>
              <p className="text-white-50 small mb-0" style={{ fontSize: '0.72rem' }}>
                Available 24/7 island-wide for immediate emergency response.
              </p>
            </div>
          </div>
        </div>
        <hr className="border-secondary mt-5 mb-4" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center text-white-50 small">
          <p className="mb-2 mb-md-0">&copy; {new Date().getFullYear()} Crime Investigation Website. All Rights Reserved. | Educational Student Project</p>
          <p className="mb-0">
            Secure & Encrypted Connection <i className="bi bi-shield-lock-fill text-success ms-1"></i>
          </p>
        </div>
      </div>
    </footer>
  );
}

