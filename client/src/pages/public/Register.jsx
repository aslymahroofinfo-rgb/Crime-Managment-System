import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import ToastAlert from '../../components/feedback/ToastAlert';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    nationalId: '',
    addressNo: '',
    street: '',
    city: '',
    district: '',
    password: '',
    confirmPassword: '',
    termsAgree: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { width: '0%', text: 'Too Weak', colorClass: 'bg-danger' };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass) || (/[A-Z]/.test(pass) && /[a-z]/.test(pass))) score += 25;

    if (score <= 25) return { width: '25%', text: 'Too Weak', colorClass: 'bg-danger' };
    if (score === 50) return { width: '50%', text: 'Weak', colorClass: 'bg-warning' };
    if (score === 75) return { width: '75%', text: 'Medium', colorClass: 'bg-info' };
    return { width: '100%', text: 'Strong', colorClass: 'bg-success' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertState(null);

    // Validations
    if (formData.fullName.trim().length < 3) {
      setAlertState({ type: 'danger', message: 'Full name must be at least 3 characters.' });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      setAlertState({ type: 'danger', message: 'Please enter a valid email address.' });
      return;
    }

    const phoneDigits = formData.phoneNumber.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setAlertState({ type: 'danger', message: 'Phone number must be between 10 and 15 digits.' });
      return;
    }

    if (formData.nationalId.trim().length < 5) {
      setAlertState({ type: 'danger', message: 'Please enter a valid National ID / IC number.' });
      return;
    }

    if (!formData.addressNo.trim() || !formData.street.trim() || !formData.city.trim() || !formData.district) {
      setAlertState({ type: 'danger', message: 'Please complete all residential address fields including District.' });
      return;
    }

    if (formData.password.length < 6) {
      setAlertState({ type: 'danger', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlertState({ type: 'danger', message: 'Passwords do not match. Please re-enter matching passwords.' });
      return;
    }

    if (!formData.termsAgree) {
      setAlertState({ type: 'danger', message: 'You must agree to the declaration statement before submitting.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        nationalId: formData.nationalId.trim(),
        addressNo: formData.addressNo.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        district: formData.district,
        password: formData.password
      };

      const res = await authService.register(payload);

      if (res.ok) {
        setAlertState({
          type: 'success',
          message: 'Citizen account registered successfully! Redirecting to login...'
        });
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        setAlertState({
          type: 'danger',
          message: res.data?.message || 'Registration failed. Please check your information.'
        });
      }
    } catch {
      setAlertState({
        type: 'danger',
        message: 'A network error occurred during registration. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container my-5 flex-grow-1 d-flex align-items-center justify-content-center">
      <div className="row w-100 justify-content-center">
        <div className="col-lg-8 col-md-10 col-12">
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
            <div className="row g-0">
              {/* Left Side Panel (Brand Visuals) */}
              <div
                className="col-md-5 d-none d-md-flex flex-column justify-content-between p-5 text-white"
                style={{ background: 'linear-gradient(135deg, #0f2447 0%, #1a3a6b 100%)' }}
              >
                <div>
                  <div
                    className="brand-icon mb-4"
                    style={{
                      background: 'var(--accent)',
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}
                  >
                    <i className="bi bi-shield-lock-fill"></i>
                  </div>
                  <h3 className="fw-bold">Join the Safe Community Initiative</h3>
                  <p className="small text-white-50 mt-3">
                    Registering an account allows you to securely submit reports, upload evidence, and track investigation updates in real time.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-top border-secondary">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-shield-fill-check text-warning"></i>
                    <span className="small fw-semibold">Government Standard Security</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-eye-slash-fill text-warning"></i>
                    <span className="small fw-semibold">Confidential Data Handling</span>
                  </div>
                </div>
              </div>

              {/* Right Side (Actual Register Form) */}
              <div className="col-md-7 p-4 p-sm-5 bg-white">
                <div className="text-center text-md-start mb-4">
                  <h4 className="fw-bold text-dark mb-1">Create Citizen Account</h4>
                  <p className="text-muted small">Please provide correct details for police verification purposes.</p>
                </div>

                {alertState && (
                  <ToastAlert
                    type={alertState.type}
                    message={alertState.message}
                    onClose={() => setAlertState(null)}
                    className="mb-3"
                  />
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Full Name */}
                  <div className="mb-3">
                    <label htmlFor="fullName" className="form-label small fw-semibold">Full Name (As per ID)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="bi bi-person-fill"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control bg-light border-start-0 ps-0"
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        minLength={3}
                      />
                    </div>
                  </div>

                  {/* Email & Phone Number */}
                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label htmlFor="email" className="form-label small fw-semibold">Email Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <i className="bi bi-envelope-fill"></i>
                        </span>
                        <input
                          type="email"
                          className="form-control bg-light border-start-0 ps-0"
                          id="email"
                          placeholder="example@domain.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="phoneNumber" className="form-label small fw-semibold">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <i className="bi bi-telephone-fill"></i>
                        </span>
                        <input
                          type="tel"
                          className="form-control bg-light border-start-0 ps-0"
                          id="phoneNumber"
                          placeholder="10-digit number"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* National ID */}
                  <div className="mb-3">
                    <label htmlFor="nationalId" className="form-label small fw-semibold">National ID / IC Number</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="bi bi-card-heading"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control bg-light border-start-0 ps-0"
                        id="nationalId"
                        placeholder="e.g. 199812345678"
                        value={formData.nationalId}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="col-12 mt-3 mb-2 border-top pt-3">
                    <h6 className="fw-bold text-primary mb-3">Residential Address</h6>
                    <div className="row g-3">
                      <div className="col-md-3">
                        <label htmlFor="addressNo" className="form-label small fw-semibold">House No</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          id="addressNo"
                          placeholder="No. 12"
                          value={formData.addressNo}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-9">
                        <label htmlFor="street" className="form-label small fw-semibold">Street Name</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          id="street"
                          placeholder="Temple Road"
                          value={formData.street}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="city" className="form-label small fw-semibold">City</label>
                        <input
                          type="text"
                          className="form-control bg-light"
                          id="city"
                          placeholder="Colombo"
                          value={formData.city}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="district" className="form-label small fw-semibold">District</label>
                        <select
                          className="form-select bg-light"
                          id="district"
                          value={formData.district}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select District...</option>
                          {DISTRICTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="row g-3 mb-2 mt-1">
                    <div className="col-sm-6">
                      <label htmlFor="password" className="form-label small fw-semibold">Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <i className="bi bi-lock-fill"></i>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control bg-light border-start-0 border-end-0 ps-0"
                          id="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                        />
                        <button
                          className="btn btn-outline-secondary border-start-0 bg-light text-muted"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                        </button>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <label htmlFor="confirmPassword" className="form-label small fw-semibold">Confirm Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0">
                          <i className="bi bi-lock-fill"></i>
                        </span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="form-control bg-light border-start-0 border-end-0 ps-0"
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <button
                          className="btn btn-outline-secondary border-start-0 bg-light text-muted"
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="mb-4">
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar ${strength.colorClass}`}
                        role="progressbar"
                        style={{ width: strength.width }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <small className="text-muted small">Password Strength: {strength.text}</small>
                      <small className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Min. 6 chars, mixed letters & numbers
                      </small>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="form-check mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="termsAgree"
                      checked={formData.termsAgree}
                      onChange={handleChange}
                      required
                    />
                    <label className="form-check-label small text-muted" htmlFor="termsAgree">
                      I declare that all information provided is true and correct. Falsifying reports is a criminal offense.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2.5 fw-bold mb-3 shadow-sm"
                    style={{ background: 'var(--primary)', border: 'none' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering Account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-check-fill me-2"></i>Create Citizen Account
                      </>
                    )}
                  </button>

                  <div className="text-center d-flex flex-column gap-1">
                    <span className="text-muted small">
                      Already registered?{' '}
                      <Link to="/login" className="fw-bold text-decoration-none" style={{ color: 'var(--primary)' }}>
                        Sign In Here
                      </Link>
                    </span>
                    <Link to="/" className="text-muted text-decoration-none small mt-2">
                      <i className="bi bi-arrow-left me-1"></i>Return to Homepage
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
