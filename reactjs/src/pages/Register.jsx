import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale',
  'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
  'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
  'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
  'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
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
    confirmPassword: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [validated, setValidated] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match!");
      setValidated(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          nationalId: formData.nationalId,
          addressNo: formData.addressNo,
          street: formData.street,
          city: formData.city,
          district: formData.district,
          password: formData.password,
          role: 'Citizen'
        })
      });
      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setErrorMsg(data.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg('Server error. Please try again.');
    }
  };

  return (
    <div className="bg-light py-5">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="bg-primary p-4 text-center">
                <h3 className="text-white fw-bold mb-1">Citizen Registration</h3>
                <p className="text-white-50 small mb-0">Create your secure account to file and track complaints.</p>
              </div>
              <div className="card-body p-4 p-md-5">
                {errorMsg && (
                  <div className="alert alert-danger py-2 px-3 small fw-bold mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {errorMsg}
                  </div>
                )}

                <form noValidate className={validated ? 'was-validated' : ''} onSubmit={handleRegister}>
                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Full Legal Name</label>
                      <input type="text" className="form-control bg-light py-2" name="fullName" required 
                             value={formData.fullName} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Email Address</label>
                      <input type="email" className="form-control bg-light py-2" name="email" required 
                             value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Phone Number</label>
                      <input type="text" className="form-control bg-light py-2" name="phoneNumber" required 
                             value={formData.phoneNumber} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">National ID / SSN</label>
                      <input type="text" className="form-control bg-light py-2" name="nationalId" required 
                             value={formData.nationalId} onChange={handleChange} />
                    </div>
                    
                    {/* Address Section */}
                    <div className="col-12 mt-4 mb-2 border-top pt-4">
                      <h6 className="fw-bold text-primary mb-3">Residential Address</h6>
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label className="form-label small fw-bold text-dark">House No</label>
                          <input type="text" className="form-control bg-light py-2" name="addressNo" required 
                                 value={formData.addressNo} onChange={handleChange} />
                        </div>
                        <div className="col-md-9">
                          <label className="form-label small fw-bold text-dark">Street Name</label>
                          <input type="text" className="form-control bg-light py-2" name="street" required 
                                 value={formData.street} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark">City</label>
                          <input type="text" className="form-control bg-light py-2" name="city" required 
                                 value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark">District</label>
                          <select className="form-select bg-light py-2" name="district" required 
                                  value={formData.district} onChange={handleChange}>
                            <option value="">Select District...</option>
                            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 mt-4 mb-2 border-top pt-4">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark">Password</label>
                          <input type="password" className="form-control bg-light py-2" name="password" required minLength="6"
                                 value={formData.password} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-dark">Confirm Password</label>
                          <input type="password" className="form-control bg-light py-2" name="confirmPassword" required minLength="6"
                                 value={formData.confirmPassword} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-check mb-4">
                    <input className="form-check-input" type="checkbox" id="termsCheck" required />
                    <label className="form-check-label small text-muted" htmlFor="termsCheck">
                      I agree to the <a href="#">Terms of Service</a> and confirm that all provided information is accurate and truthful.
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm mb-4 btn-hover-lift fs-5">
                    Register Account <i className="bi bi-person-check-fill ms-1"></i>
                  </button>
                  <div className="text-center">
                    <p className="text-muted small mb-0">Already have an account? <Link to="/login" className="fw-bold text-primary text-decoration-none">Sign In</Link></p>
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
