export default function Footer() {
  return (
    <footer className="footer py-5 mt-auto">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6 pe-lg-5">
            <h5 className="text-white fw-bold mb-3 d-flex align-items-center">
              <img src="/images/logo.png" alt="Logo" style={{ height: '30px', marginRight: '10px' }} /> CIW Portal
            </h5>
            <p className="text-white-50 small mb-4">Empowering citizens to safely report and track criminal incidents. Together we can build a safer community through transparent, effective law enforcement communication.</p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white-50 hover-white"><i className="bi bi-facebook fs-5"></i></a>
              <a href="#" className="text-white-50 hover-white"><i className="bi bi-twitter-x fs-5"></i></a>
              <a href="#" className="text-white-50 hover-white"><i className="bi bi-instagram fs-5"></i></a>
            </div>
          </div>
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-bold mb-3 uppercase">Quick Links</h6>
            <ul className="list-unstyled footer-links mb-0 small">
              <li className="mb-2"><a href="/">Home Page</a></li>
              <li className="mb-2"><a href="/complaint">File a Complaint</a></li>
              <li className="mb-2"><a href="/track">Track Status</a></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 uppercase">Legal & Help</h6>
            <ul className="list-unstyled footer-links mb-0 small">
              <li className="mb-2"><a href="#">Privacy Policy</a></li>
              <li className="mb-2"><a href="#">Terms of Service</a></li>
              <li className="mb-2"><a href="#">FAQs</a></li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 uppercase">Emergency Contact</h6>
            <div className="bg-dark bg-opacity-50 p-3 rounded-3 border border-secondary border-opacity-25">
              <p className="text-white mb-1"><i className="bi bi-telephone-fill text-danger me-2"></i>Police: <strong className="fs-5">911</strong></p>
              <p className="text-white-50 small mb-0 mt-2">Available 24/7 for immediate life-threatening emergencies.</p>
            </div>
          </div>
        </div>
        <hr className="border-secondary mt-5 mb-4" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center text-white-50 small">
          <p className="mb-2 mb-md-0">&copy; {new Date().getFullYear()} Crime Investigation Website. All Rights Reserved.</p>
          <p className="mb-0">Secure & Encrypted Connection <i className="bi bi-shield-lock-fill text-success ms-1"></i></p>
        </div>
      </div>
    </footer>
  );
}
