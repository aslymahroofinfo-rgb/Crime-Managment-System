import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import ToastAlert from '../../components/feedback/ToastAlert';

const SRI_LANKA_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

export default function Home() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    details: '',
    nic: '',
    phone: '',
    district: '',
    town: '',
    landmarkDescription: '',
    address: '',
    additionalNotes: ''
  });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [publicStats, setPublicStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/public/stats')
      .then(res => {
        if (mounted && res.ok && res.data) {
          setPublicStats(res.data);
          setStatsLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load public stats:', err);
        if (mounted) setStatsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4'];
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newFiles = [...evidenceFiles];
    let alertMsg = null;

    for (const file of selected) {
      if (newFiles.length >= maxFiles) {
        alertMsg = 'Maximum 5 evidence files allowed.';
        break;
      }

      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
        alertMsg = `File "${file.name}" has an unsupported format. Allowed: JPG, PNG, PDF, MP4.`;
        continue;
      }

      if (file.size > maxSize) {
        alertMsg = `File "${file.name}" exceeds the 10 MB limit.`;
        continue;
      }

      if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }

    setEvidenceFiles(newFiles);
    if (alertMsg) {
      setEmergencyAlert({ type: 'warning', message: alertMsg });
    }
    // Reset file input
    e.target.value = '';
  };

  const removeFile = (indexToRemove) => {
    setEvidenceFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setEmergencyAlert(null);

    const { details, district, town, landmarkDescription, nic, phone, address, additionalNotes } = emergencyForm;

    // Required fields validation
    if (!details.trim() || !district || !town.trim() || !landmarkDescription.trim()) {
      setEmergencyAlert({
        type: 'danger',
        message: 'District, Town/City, Nearby Landmark/Location Description, and Incident Details are required.'
      });
      return;
    }

    // Optional NIC validation
    if (nic && nic.trim()) {
      const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
      if (!nicRegex.test(nic.trim())) {
        setEmergencyAlert({
          type: 'danger',
          message: 'Invalid NIC format. Please enter a valid 9-digit (with V/X) or 12-digit National ID.'
        });
        return;
      }
    }

    // Optional Phone validation
    if (phone && phone.trim()) {
      const strippedPhone = phone.trim().replace(/[\s\-()]/g, '');
      const phoneRegex = /^\+?[0-9]{9,15}$/;
      if (!phoneRegex.test(strippedPhone)) {
        setEmergencyAlert({
          type: 'danger',
          message: 'Invalid phone format. Please enter a valid contact number (9-15 digits).'
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('isEmergency', 'true');
      formData.append('title', 'Emergency: Priority Incident Report');
      formData.append('category', 'Emergency');
      formData.append('district', district);
      formData.append('town', town.trim());
      formData.append('landmarkDescription', landmarkDescription.trim());
      if (address.trim()) formData.append('address', address.trim());
      if (additionalNotes.trim()) formData.append('additionalNotes', additionalNotes.trim());
      if (nic.trim()) formData.append('nic', nic.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      formData.append('description', details.trim());
      formData.append('incidentDate', new Date().toISOString().split('T')[0]);
      formData.append('incidentTime', new Date().toTimeString().split(' ')[0].substring(0, 5));
      formData.append('isAnonymous', 'false');

      evidenceFiles.forEach((file) => {
        formData.append('evidenceFiles', file);
      });

      const res = await api.post('/complaints/submit', formData);

      if (res.ok) {
        const generatedId = res.data?.complaintId || res.data?.complaint?.complaintId || 'Submitted';
        setEmergencyAlert({
          type: 'success',
          message: `Emergency complaint recorded successfully! Reference ID: ${generatedId}. Dispatch teams have been alerted.`
        });
        setEmergencyForm({
          details: '',
          nic: '',
          phone: '',
          district: '',
          town: '',
          landmarkDescription: '',
          address: '',
          additionalNotes: ''
        });
        setEvidenceFiles([]);
        setTimeout(() => setShowEmergencyModal(false), 3000);
      } else {
        setEmergencyAlert({
          type: 'danger',
          message: res.data?.message || 'Emergency dispatch recording failed. Please call 119 or 118 directly.'
        });
      }
    } catch {
      setEmergencyAlert({
        type: 'danger',
        message: 'Network error. Please call 119 or 118 immediately for life-threatening emergencies.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ============================================================
           HERO SECTION
           ============================================================ */}
      <section className="hero-section" id="home">
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Left: Text content */}
            <div className="col-lg-7">
              <span className="hero-badge">
                <i className="bi bi-shield-lock me-1"></i>Official Complaint Portal
              </span>
              <h1 className="hero-title">
                Report Crime <span>Safely</span> and <span>Securely</span>
              </h1>
              <p className="hero-subtitle">
                Submit complaints online, track case progress, and help build a safer community. Your voice matters — report incidents anytime, anywhere.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/complaint" className="btn-hero-primary">
                  <i className="bi bi-file-earmark-plus me-2"></i>File Complaint
                </Link>
                <Link to="/track" className="btn-hero-outline">
                  <i className="bi bi-search me-2"></i>Track Complaint
                </Link>
                <button
                  type="button"
                  className="btn-hero-emergency"
                  onClick={() => setShowEmergencyModal(true)}
                >
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Emergency Complaint
                </button>
              </div>

              {/* Mini stats strip */}
              <div className="hero-stats">
                <div className="hero-stat-item">
                  <span className="hero-stat-number">
                    {statsLoading ? '...' : (publicStats?.totalComplaints ?? 0)}
                  </span>
                  <span className="hero-stat-label">Complaints Filed</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-number">
                    {statsLoading ? '...' : (publicStats?.resolvedComplaints ?? 0)}
                  </span>
                  <span className="hero-stat-label">Cases Resolved</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-number">
                    {statsLoading ? '...' : (publicStats?.registeredCitizens ?? 0)}
                  </span>
                  <span className="hero-stat-label">Registered Citizens</span>
                </div>
              </div>
            </div>

            {/* Right: Visual panel */}
            <div className="col-lg-5 d-none d-lg-block">
              <div className="hero-visual">
                <i className="bi bi-shield-fill-check"></i>
                <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: '10px' }}>Secure & Confidential</h4>
                <p>Your complaint data is encrypted and handled with strict confidentiality by trained law enforcement officers.</p>
                <div className="mt-3 d-flex justify-content-center gap-3 flex-wrap">
                  <span className="badge" style={{ background: 'rgba(255,255,255,.15)', fontSize: '.8rem', padding: '8px 14px', borderRadius: '20px' }}>
                    <i className="bi bi-lock-fill me-1"></i>Encrypted
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,.15)', fontSize: '.8rem', padding: '8px 14px', borderRadius: '20px' }}>
                    <i className="bi bi-eye-slash-fill me-1"></i>Anonymous
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,.15)', fontSize: '.8rem', padding: '8px 14px', borderRadius: '20px' }}>
                    <i className="bi bi-clock-fill me-1"></i>24/7 Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           FEATURES SECTION
           ============================================================ */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">What We Offer</span>
            <h2>System Features</h2>
            <p>A comprehensive platform designed to make crime reporting simple, transparent, and effective.</p>
            <div className="section-divider"></div>
          </div>

          <div className="row g-4">
            <div className="col-sm-6 col-lg-4">
              <Link to="/complaint" className="text-decoration-none text-dark d-block h-100">
                <div className="feature-card">
                  <div className="feature-icon-wrap icon-blue"><i className="bi bi-file-earmark-text-fill"></i></div>
                  <h5>File Crime Complaint</h5>
                  <p>Submit detailed crime complaints online 24/7. Our guided form ensures all necessary information is captured accurately.</p>
                </div>
              </Link>
            </div>

            <div className="col-sm-6 col-lg-4">
              <Link to="/track" className="text-decoration-none text-dark d-block h-100">
                <div className="feature-card">
                  <div className="feature-icon-wrap icon-green"><i className="bi bi-graph-up-arrow"></i></div>
                  <h5>Track Complaint Status</h5>
                  <p>Monitor your case in real-time. Get live updates on investigation progress directly from the assigned authority.</p>
                </div>
              </Link>
            </div>

            <div className="col-sm-6 col-lg-4">
              <div className="feature-card">
                <div className="feature-icon-wrap icon-purple"><i className="bi bi-cloud-upload-fill"></i></div>
                <h5>Upload Evidence</h5>
                <p>Attach photos, videos, and documents as supporting evidence to strengthen your complaint and aid investigation.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-4">
              <div className="feature-card">
                <div className="feature-icon-wrap icon-orange"><i className="bi bi-person-fill-slash"></i></div>
                <h5>Anonymous Reporting</h5>
                <p>Report suspicious activities without revealing your identity. Your safety is our top priority at all times.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-4">
              <div className="feature-card">
                <div className="feature-icon-wrap icon-red"><i className="bi bi-patch-check-fill"></i></div>
                <h5>Police Verification</h5>
                <p>All complaints are reviewed and verified by certified law enforcement officers ensuring legitimate action is taken.</p>
              </div>
            </div>

            <div className="col-sm-6 col-lg-4">
              <div className="feature-card">
                <div className="feature-icon-wrap icon-teal"><i className="bi bi-database-lock-fill"></i></div>
                <h5>Secure Data Management</h5>
                <p>End-to-end encryption protects your personal data. Compliant with national data protection standards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           EMERGENCY CONTACTS SECTION
           ============================================================ */}
      <section className="emergency-section" id="emergency">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Helplines</span>
            <h2>Emergency Contacts</h2>
            <p>Reach the right authority instantly. Save these numbers for emergencies.</p>
            <div className="section-divider"></div>
          </div>

          <div className="row g-4">
            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon text-primary"><i className="bi bi-shield-fill-check"></i></div>
                <h6>Police Emergency</h6>
                <span className="emergency-number">100</span>
                <a href="tel:100" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon" style={{ color: '#d63384' }}><i className="bi bi-gender-female"></i></div>
                <h6>Women's Safety Helpline</h6>
                <span className="emergency-number">1091</span>
                <a href="tel:1091" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon" style={{ color: '#fd7e14' }}><i className="bi bi-person-hearts"></i></div>
                <h6>Child Protection</h6>
                <span className="emergency-number">1098</span>
                <a href="tel:1098" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon" style={{ color: '#198754' }}><i className="bi bi-heart-pulse-fill"></i></div>
                <h6>Ambulance Service</h6>
                <span className="emergency-number">108</span>
                <a href="tel:108" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon" style={{ color: '#dc3545' }}><i className="bi bi-fire"></i></div>
                <h6>Fire & Rescue</h6>
                <span className="emergency-number">101</span>
                <a href="tel:101" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon" style={{ color: '#6f42c1' }}><i className="bi bi-laptop-fill"></i></div>
                <h6>Cyber Crime Helpline</h6>
                <span className="emergency-number">1930</span>
                <a href="tel:1930" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon" style={{ color: '#e07b2a' }}><i className="bi bi-house-exclamation-fill"></i></div>
                <h6>Domestic Violence</h6>
                <span className="emergency-number">181</span>
                <a href="tel:181" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="emergency-card">
                <div className="emergency-icon" style={{ color: '#20b2aa' }}><i className="bi bi-person-cane"></i></div>
                <h6>Senior Citizen Helpline</h6>
                <span className="emergency-number">14567</span>
                <a href="tel:14567" className="btn-call"><i className="bi bi-telephone-fill"></i> Call Now</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           HOW IT WORKS SECTION
           ============================================================ */}
      <section className="how-section" id="howItWorks">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Simple Process</span>
            <h2>How It Works</h2>
            <p>File and track your complaint in just 4 easy steps.</p>
            <div className="section-divider"></div>
          </div>

          <div className="row justify-content-center align-items-center g-0 mt-2">
            <div className="col-6 col-md-3">
              <div className="step-card">
                <div className="step-number">1</div>
                <h5>Register Account</h5>
                <p>Create a free account with your valid ID and contact details to get started.</p>
              </div>
            </div>

            <div className="col d-none d-md-flex step-arrow"><i className="bi bi-arrow-right"></i></div>

            <div className="col-6 col-md-3">
              <div className="step-card">
                <div className="step-number">2</div>
                <h5>Submit Complaint</h5>
                <p>Fill the complaint form with incident details and upload supporting evidence.</p>
              </div>
            </div>

            <div className="col d-none d-md-flex step-arrow"><i className="bi bi-arrow-right"></i></div>

            <div className="col-6 col-md-3">
              <div className="step-card">
                <div className="step-number">3</div>
                <h5>Police Review</h5>
                <p>Law enforcement reviews your complaint, assigns an officer, and begins investigation.</p>
              </div>
            </div>

            <div className="col d-none d-md-flex step-arrow"><i className="bi bi-arrow-right"></i></div>

            <div className="col-6 col-md-3">
              <div className="step-card">
                <div className="step-number">4</div>
                <h5>Track Status</h5>
                <p>Monitor case progress live. Receive notifications on every update until resolution.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           STATISTICS SECTION
           ============================================================ */}
      <section className="stats-section" id="statsSection">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Our Impact</span>
            <h2>System Statistics</h2>
            <p>Real numbers reflecting our commitment to public safety.</p>
            <div className="section-divider"></div>
          </div>

          <div className="row g-4">
            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-icon"><i className="bi bi-file-earmark-check-fill"></i></div>
                <span className="stat-number">
                  {statsLoading ? '...' : (publicStats?.totalComplaints ?? 0)}
                </span>
                <span className="stat-label">Complaints Submitted</span>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-icon" style={{ color: '#198754' }}><i className="bi bi-check-circle-fill"></i></div>
                <span className="stat-number">
                  {statsLoading ? '...' : (publicStats?.resolvedComplaints ?? 0)}
                </span>
                <span className="stat-label">Cases Resolved</span>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-icon" style={{ color: '#fd7e14' }}><i className="bi bi-hourglass-split"></i></div>
                <span className="stat-number">
                  {statsLoading ? '...' : (publicStats?.activeInvestigations ?? 0)}
                </span>
                <span className="stat-label">Active Investigations</span>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="stat-card">
                <div className="stat-icon" style={{ color: '#6f42c1' }}><i className="bi bi-people-fill"></i></div>
                <span className="stat-number">
                  {statsLoading ? '...' : (publicStats?.registeredCitizens ?? 0)}
                </span>
                <span className="stat-label">Registered Citizens</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           PUBLIC AWARENESS SECTION
           ============================================================ */}
      <section className="awareness-section" id="awareness">
        <div className="container">
          <div className="section-heading">
            <span className="section-badge">Stay Safe</span>
            <h2>Public Awareness & Safety Tips</h2>
            <p>Follow these essential safety practices to protect yourself and your community.</p>
            <div className="section-divider"></div>
          </div>

          <div className="row g-4">
            <div className="col-sm-6 col-lg-3">
              <div className="awareness-card">
                <div className="awareness-icon"><i className="bi bi-shield-lock-fill"></i></div>
                <div>
                  <h6>Never Share OTPs</h6>
                  <p>No bank, government agency, or officer will ever ask for your OTP. Keep it strictly private.</p>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="awareness-card">
                <div className="awareness-icon"><i className="bi bi-eye-fill"></i></div>
                <div>
                  <h6>Report Suspicious Activity</h6>
                  <p>If you notice something unusual in your area, report it immediately to local authorities.</p>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="awareness-card">
                <div className="awareness-icon"><i className="bi bi-person-fill-lock"></i></div>
                <div>
                  <h6>Protect Personal Info</h6>
                  <p>Avoid sharing National ID or bank details with unknown callers or websites.</p>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="awareness-card">
                <div className="awareness-icon"><i className="bi bi-credit-card-2-front-fill"></i></div>
                <div>
                  <h6>Verify Online Transactions</h6>
                  <p>Always verify the seller's identity before making any online payment or transfer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           EMERGENCY COMPLAINT MODAL
           ============================================================ */}
      {showEmergencyModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content emergency-modal-card">
              <div className="modal-header border-0 pb-3">
                <div>
                  <p className="emergency-modal-badge mb-1">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>Priority Distress Dispatch
                  </p>
                  <h4 className="modal-title mb-0" style={{ color: '#fff', fontWeight: 700 }}>
                    Emergency Incident Report
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setShowEmergencyModal(false)}
                ></button>
              </div>

              <div className="modal-body py-4 px-4 px-md-5">
                <div className="alert alert-danger bg-danger bg-opacity-10 border border-danger-subtle rounded-3 py-2 px-3 mb-4 d-flex align-items-center">
                  <i className="bi bi-shield-exclamation text-danger fs-4 me-3 flex-shrink-0"></i>
                  <span className="small text-danger fw-medium">
                    This priority channel alerts rapid-response dispatchers. For active life-threatening danger, also call <strong>119</strong> or <strong>118</strong> immediately.
                  </span>
                </div>

                {emergencyAlert && (
                  <ToastAlert
                    type={emergencyAlert.type}
                    message={emergencyAlert.message}
                    onClose={() => setEmergencyAlert(null)}
                    className="mb-3"
                  />
                )}

                <form onSubmit={handleEmergencySubmit} className="emergency-form">
                  {/* Location Information Group */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-geo-alt-fill text-danger"></i>
                      <span>Emergency Location Details</span>
                    </h6>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-dark small fw-semibold">
                          District <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          value={emergencyForm.district}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, district: e.target.value })}
                          required
                        >
                          <option value="" disabled>Select District</option>
                          {SRI_LANKA_DISTRICTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-dark small fw-semibold">
                          Town / City <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Nugegoda, Negombo, Kaduwela"
                          value={emergencyForm.town}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, town: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label text-dark small fw-semibold">
                          Nearby Landmark / Location Description <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="e.g. Near clock tower, behind central bus terminal, opposite supermarket"
                          value={emergencyForm.landmarkDescription}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, landmarkDescription: e.target.value })}
                          required
                        ></textarea>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-dark small fw-semibold">
                          Street / Exact Address <span className="text-muted fw-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. No. 45, Temple Road"
                          value={emergencyForm.address}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, address: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-dark small fw-semibold">
                          Additional Location Notes <span className="text-muted fw-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 2nd floor, blue iron gate, alley entrance"
                          value={emergencyForm.additionalNotes}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, additionalNotes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Incident Details */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark-text-fill text-danger"></i>
                      <span>Incident Narrative</span>
                    </h6>

                    <div>
                      <label className="form-label text-dark small fw-semibold">
                        Emergency Situation Details <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="State clearly what is happening right now, any weapons observed, or individuals needing medical/police help..."
                        value={emergencyForm.details}
                        onChange={(e) => setEmergencyForm({ ...emergencyForm, details: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>

                  {/* Reporter Contact Information (Optional) */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-person-badge-fill text-danger"></i>
                        <span>Reporter Contact Information</span>
                      </h6>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border small">Strictly Optional</span>
                    </div>

                    <p className="text-muted small mb-3">
                      Contact information is optional for emergency assistance. Providing a phone number enables dispatchers to call back for quick on-scene verification.
                    </p>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-dark small fw-semibold">
                          NIC / National ID <span className="text-muted fw-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 200012345678 or 987654321V"
                          value={emergencyForm.nic}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, nic: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-dark small fw-semibold">
                          Contact Phone Number <span className="text-muted fw-normal">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="e.g. 0771234567"
                          value={emergencyForm.phone}
                          onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Supporting Evidence */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-paperclip text-danger"></i>
                        <span>Supporting Evidence</span>
                      </h6>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border small">Optional (Max 5 files)</span>
                    </div>

                    <div className="p-3 bg-light rounded-3 border">
                      <label className="form-label text-dark small fw-semibold d-block">
                        Upload Photos, Videos or Documents <span className="text-muted fw-normal">(JPG, PNG, PDF, MP4 up to 10MB)</span>
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf,.mp4"
                        onChange={handleFileChange}
                        disabled={evidenceFiles.length >= 5}
                      />

                      {evidenceFiles.length > 0 && (
                        <div className="mt-3 d-flex flex-wrap gap-2">
                          {evidenceFiles.map((f, idx) => (
                            <div
                              key={idx}
                              className="d-flex align-items-center bg-white border rounded-pill px-3 py-1 shadow-sm small text-dark"
                            >
                              <i className="bi bi-file-earmark-check-fill text-success me-2"></i>
                              <span className="fw-semibold text-truncate me-2" style={{ maxWidth: '180px' }}>
                                {f.name}
                              </span>
                              <span className="text-muted me-2 small">
                                ({(f.size / (1024 * 1024)).toFixed(1)} MB)
                              </span>
                              <button
                                type="button"
                                className="btn-close"
                                style={{ fontSize: '0.65rem' }}
                                onClick={() => removeFile(idx)}
                                aria-label="Remove file"
                              ></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-secondary px-4 rounded-3"
                      onClick={() => setShowEmergencyModal(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger px-4 rounded-3 fw-semibold shadow-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting Emergency Report...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send-fill me-2"></i>
                          Submit Emergency Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
