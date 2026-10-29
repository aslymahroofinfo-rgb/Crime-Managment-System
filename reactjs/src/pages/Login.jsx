import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Citizen');
  const [errorMsg, setErrorMsg] = useState('');
  const [validated, setValidated] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'Admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMsg(data.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg('Server error. Please try again.');
    }
  };

  return (
    <div className="bg-light py-5">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="bg-dark p-4 text-center">
                <img src="/images/logo.png" alt="Logo" style={{ height: '50px' }} className="mb-2" />
                <h4 className="text-white fw-bold mb-0">Secure Login</h4>
              </div>
              <div className="card-body p-4 p-md-5">
                {errorMsg && (
                  <div className="alert alert-danger py-2 px-3 small fw-bold mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errorMsg}
                  </div>
                )}
                
                <form noValidate className={validated ? 'was-validated' : ''} onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted uppercase">Login Category</label>
                    <div className="d-flex bg-light rounded-3 p-1">
                      <input type="radio" className="btn-check" name="role" id="roleCitizen" value="Citizen" 
                             checked={role === 'Citizen'} onChange={(e) => setRole(e.target.value)} />
                      <label className="btn btn-outline-primary border-0 w-50 rounded-2 py-2 fw-semibold" htmlFor="roleCitizen">Citizen</label>
                      
                      <input type="radio" className="btn-check" name="role" id="roleAdmin" value="Admin" 
                             checked={role === 'Admin'} onChange={(e) => setRole(e.target.value)} />
                      <label className="btn btn-outline-primary border-0 w-50 rounded-2 py-2 fw-semibold" htmlFor="roleAdmin">System Admin</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                      <input type="email" className="form-control border-start-0 bg-light py-2" placeholder="Enter your registered email" required 
                             value={email} onChange={(e) => setEmail(e.target.value)} />
                      <div className="invalid-feedback">Valid email is required.</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-dark d-flex justify-content-between">
                      Password <a href="#" className="text-decoration-none small text-primary fw-normal">Forgot?</a>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                      <input type="password" className="form-control border-start-0 bg-light py-2" placeholder="Enter your password" required 
                             value={password} onChange={(e) => setPassword(e.target.value)} />
                      <div className="invalid-feedback">Password is required.</div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 py-2.5 fw-bold rounded-3 shadow-sm mb-4 btn-hover-lift">
                    Sign In <i className="bi bi-box-arrow-in-right ms-1"></i>
                  </button>

                  <div className="text-center">
                    <p className="text-muted small mb-0">Don't have an account? <Link to="/register" className="fw-bold text-primary text-decoration-none">Register Now</Link></p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
