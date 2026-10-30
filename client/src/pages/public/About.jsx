import { Link } from 'react-router-dom';

export default function About() {
  return (
    <>
      {/* ============================================================
           ABOUT HERO HEADER
           ============================================================ */}
      <header className="py-5 text-white" style={{ background: 'var(--hero-gradient)', position: 'relative', overflow: 'hidden' }}>
        <div className="container py-4 text-center position-relative" style={{ zIndex: 2 }}>
          <span className="badge mb-3 px-3 py-2 text-uppercase fw-bold text-white bg-danger" style={{ letterSpacing: '1.5px' }}>
            Public Safety Portal
          </span>
          <h1 className="fw-bold display-5">About Our System</h1>
          <p className="lead mx-auto text-white-50" style={{ maxWidth: '650px' }}>
            A transparent digital platform dedicated to securing public safety, streamlining reporting, and building stronger community partnerships.
          </p>
        </div>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(230,57,70,0.08)' }}></div>
      </header>

      {/* ============================================================
           MAIN CONTENT BODY
           ============================================================ */}
      <main className="container my-5 flex-grow-1">
        {/* Section 1: Mission & Vision */}
        <section className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 bg-white h-100 p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                  <i className="bi bi-shield-shaded fs-3"></i>
                </div>
                <h4 className="fw-bold text-dark mb-0">Our Mission</h4>
              </div>
              <p className="text-muted mb-0" style={{ lineHeight: 1.7 }}>
                To empower citizens with a safe, secure, and easily accessible online platform to report incidents, track case progression, and foster trust and transparency between the public and local law enforcement bodies.
              </p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 bg-white h-100 p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3">
                  <i className="bi bi-eye-fill fs-3"></i>
                </div>
                <h4 className="fw-bold text-dark mb-0">Our Vision</h4>
              </div>
              <p className="text-muted mb-0" style={{ lineHeight: 1.7 }}>
                To build a safer, crime-resilient nation where technology connects communities and safety services, providing instantaneous support, real-time tracking, and verified justice for every individual.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Objectives */}
        <section className="mb-5">
          <div className="text-center mb-4">
            <span className="badge bg-light text-primary border px-3 py-2 text-uppercase fw-semibold mb-2">Core Drivers</span>
            <h3 className="fw-bold text-dark">System Objectives</h3>
            <p className="text-muted mx-auto small" style={{ maxWidth: '500px' }}>
              The primary structural goals governing the development of the Crime Investigation Website.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white p-3 text-center h-100">
                <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 mx-auto mb-3" style={{ width: 'fit-content' }}>
                  <i className="bi bi-person-fill-lock fs-4"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Secure Anonymity</h6>
                <p className="text-muted small mb-0">Allowing victims or whistleblowers to report incidents anonymously with top-tier data security encryption.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white p-3 text-center h-100">
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-3 mx-auto mb-3" style={{ width: 'fit-content' }}>
                  <i className="bi bi-lightning-charge-fill fs-4"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Accelerated Triage</h6>
                <p className="text-muted small mb-0">Minimizing paper filing bottlenecks by routing citizen complaints directly to dispatch officers.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white p-3 text-center h-100">
                <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3 mx-auto mb-3" style={{ width: 'fit-content' }}>
                  <i className="bi bi-bar-chart-fill fs-4"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Progress Accountability</h6>
                <p className="text-muted small mb-0">Providing continuous digital logs so citizens stay informed of each milestone in investigations.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white p-3 text-center h-100">
                <div className="p-3 bg-info bg-opacity-10 text-info rounded-3 mx-auto mb-3" style={{ width: 'fit-content' }}>
                  <i className="bi bi-shield-check fs-4"></i>
                </div>
                <h6 className="fw-bold text-dark mb-2">Data Integrity</h6>
                <p className="text-muted small mb-0">Eliminating file tampering and loss through unified, immutable digital database registries.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Why Use & Benefits */}
        <section className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
              <h4 className="fw-bold text-dark mb-3"><i className="bi bi-question-circle-fill text-primary me-2"></i>Why Use CIW?</h4>
              <p className="text-muted small mb-4">Traditional crime reporting requires physically visiting station houses, standing in queues, and filling out offline forms. CIW digitizes this workflow to solve safety reporting bottlenecks:</p>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                <li className="d-flex align-items-start gap-2 text-muted small">
                  <i className="bi bi-check-circle-fill text-success mt-0.5"></i>
                  <span><strong>Instant Filing:</strong> Bypass lines. Submit comprehensive statements and location details from any device in under five minutes.</span>
                </li>
                <li className="d-flex align-items-start gap-2 text-muted small">
                  <i className="bi bi-check-circle-fill text-success mt-0.5"></i>
                  <span><strong>Unified Evidence Uploads:</strong> Directly attach CCTV still captures, voice recordings, document files, or photos.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
              <h4 className="fw-bold text-dark mb-3"><i className="bi bi-award-fill text-danger me-2"></i>Benefits for Citizens</h4>
              <p className="text-muted small mb-4">Our portal is designed with the safety, comfort, and accessibility requirements of general citizens in mind:</p>
              <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                <li className="d-flex align-items-start gap-2 text-muted small">
                  <i className="bi bi-patch-check-fill text-primary mt-0.5"></i>
                  <span><strong>Real-Time Case Notifications:</strong> Know exactly when your case gets approved, which officer is assigned, and when it is resolved.</span>
                </li>
                <li className="d-flex align-items-start gap-2 text-muted small">
                  <i className="bi bi-patch-check-fill text-primary mt-0.5"></i>
                  <span><strong>Guaranteed Anonymity:</strong> Citizens can hide their identifying profile to protect personal safety while still reporting public hazards.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Contact Information */}
        <section className="card border-0 shadow-sm rounded-4 bg-white p-4 p-sm-5">
          <div className="row g-4 align-items-center">
            <div className="col-md-6">
              <h4 className="fw-bold text-dark mb-2">Get In Touch</h4>
              <p className="text-muted small mb-4">For system support, citizen queries, or reporting technical issues, reach out through the official support lines below.</p>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-danger bg-opacity-10 text-danger rounded-3"><i className="bi bi-telephone-fill fs-5"></i></div>
                  <div>
                    <span className="text-muted small d-block">Police Emergency</span>
                    <a href="tel:119" className="text-danger fw-bold text-decoration-none">119 (Immediate Response)</a>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-success bg-opacity-10 text-success rounded-3"><i className="bi bi-heart-pulse-fill fs-5"></i></div>
                  <div>
                    <span className="text-muted small d-block">Emergency Ambulance</span>
                    <a href="tel:1990" className="text-success fw-bold text-decoration-none">1990 Suwa Seriya</a>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-primary bg-opacity-10 text-primary rounded-3"><i className="bi bi-building fs-5"></i></div>
                  <div>
                    <span className="text-muted small d-block">Government Information Centre</span>
                    <a href="tel:1919" className="text-primary fw-bold text-decoration-none">1919 (GIC Hotline)</a>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-info bg-opacity-10 text-info rounded-3"><i className="bi bi-envelope-at-fill fs-5"></i></div>
                  <div>
                    <span className="text-muted small d-block">Official Inquiry Email</span>
                    <strong className="text-dark">support@ccms-portal.gov</strong>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2.5 bg-success bg-opacity-10 text-success rounded-3"><i className="bi bi-geo-alt-fill fs-5"></i></div>
                  <div>
                    <span className="text-muted small d-block">Central Registry Office</span>
                    <strong className="text-dark">Public Safety Headquarters, Sector 12, City Capital</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 text-center">
              <div className="p-4 bg-light rounded-4 border d-inline-block w-100 text-center">
                <div className="text-primary mb-3" style={{ fontSize: '3rem' }}><i className="bi bi-chat-left-dots-fill"></i></div>
                <h5 className="fw-bold text-dark mb-2">Online Feedback Box</h5>
                <p className="text-muted small px-3">Have ideas to improve public reporting? Send system optimization requests directly to our software maintenance team.</p>
                <Link to="/contact" className="btn btn-primary px-4 py-2 mt-2 fw-semibold" style={{ background: 'var(--primary)', border: 'none' }}>
                  <i className="bi bi-send-fill me-2"></i>Send Feedback Message
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
