import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePageTransition } from '../../context/PageTransitionContext';
import { authService } from '../../services/authService';
import ToastAlert from '../../components/feedback/ToastAlert';

export default function Login() {
  const [roleCategory, setRoleCategory] = useState('Citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { navigateWithTransition } = usePageTransition();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertState(null);

    if (!email.trim() || !password) {
      setAlertState({ type: 'danger', message: 'Please enter both your registered email and password.' });
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email.trim(), password);

      if (res.ok && res.data?.token) {
        const returnedUser = res.data.user;
        const returnedRole = String(returnedUser?.role || '').toLowerCase();

        // Optional advisory category match warning if user selected opposite role
        const selectedRoleLower = roleCategory.toLowerCase();
        if (selectedRoleLower === 'admin' && returnedRole !== 'admin' && returnedRole !== 'superadmin') {
          setAlertState({ type: 'danger', message: 'This account does not have administrative privileges.' });
          setLoading(false);
          return;
        }

        login(res.data.token, returnedUser);

        // Authoritative redirection based on backend role
        if (returnedRole === 'admin' || returnedRole === 'superadmin') {
          navigateWithTransition('/admin/dashboard', { replace: true });
        } else {
          navigateWithTransition(from === '/login' ? '/dashboard' : from, { replace: true });
        }
      } else {
        setAlertState({
          type: 'danger',
          message: res.data?.message || 'Invalid email or password. Please verify your credentials and try again.'
        });
      }
    } catch {
      setAlertState({
        type: 'danger',
        message: 'A network connection failure occurred. Please check your connection and try again.'
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
                  <h3 className="fw-bold">Secure Access</h3>
                  <p className="small text-white-50 mt-3">
                    Access your personalized portal to check complaint progress, submit additional files, and communicate with investigators securely.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-top border-secondary">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-patch-check-fill text-warning"></i>
                    <span className="small fw-semibold">2-Way Data Encryption</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-shield-fill-check text-warning"></i>
                    <span className="small fw-semibold">Law Enforcement Verified</span>
                  </div>
                </div>
              </div>

              {/* Right Side (Actual Login Form) */}
              <div className="col-md-7 p-4 p-sm-5 bg-white">
                <div className="text-center text-md-start mb-4">
                  <h4 className="fw-bold text-dark mb-1">Welcome Back</h4>
                  <p className="text-muted small">Enter your credentials to access your citizen account.</p>
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
                  {/* Login Category Select */}
                  <div className="mb-3">
                    <label htmlFor="loginRole" className="form-label small fw-semibold">Login Category</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="bi bi-person-badge-fill"></i>
                      </span>
                      <select
                        className="form-select bg-light border-start-0 ps-0 text-muted"
                        id="loginRole"
                        value={roleCategory}
                        onChange={(e) => setRoleCategory(e.target.value)}
                      >
                        <option value="Citizen">Citizen / Reporter</option>
                        <option value="Admin">System Administrator</option>
                      </select>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="mb-3">
                    <label htmlFor="loginEmail" className="form-label small fw-semibold">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="bi bi-envelope-fill"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control bg-light border-start-0 ps-0"
                        id="loginEmail"
                        placeholder="example@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label htmlFor="loginPassword" className="form-label small fw-semibold mb-0">Password</label>
                      <a href="#" className="small text-decoration-none" style={{ color: 'var(--primary)', fontSize: '0.82rem' }}>
                        Forgot Password?
                      </a>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted border-end-0">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control bg-light border-start-0 border-end-0 ps-0"
                        id="loginPassword"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        className="btn btn-outline-secondary border-start-0 bg-light text-muted"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="form-check mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label small text-muted" htmlFor="rememberMe">
                      Remember me on this device
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
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>Login to Account
                      </>
                    )}
                  </button>

                  {/* Redirect to Register */}
                  <div className="text-center d-flex flex-column gap-1">
                    <span className="text-muted small">
                      Don't have a registered account?{' '}
                      <Link to="/register" className="fw-bold text-decoration-none" style={{ color: 'var(--primary)' }}>
                        Register Here
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
