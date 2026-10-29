import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editable Profile Data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    addressNo: '',
    street: '',
    city: '',
    district: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Read-only Immutable Fields
  const [immutableData, setImmutableData] = useState({
    email: '',
    role: 'Citizen',
    nationalId: '',
    id: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authService.getProfile();
      if (res.ok && res.data) {
        const d = res.data;
        const addr = d.address || {};
        setFormData({
          fullName: d.fullName || '',
          phoneNumber: d.phoneNumber || '',
          addressNo: addr.no || addr.addressNo || '',
          street: addr.street || '',
          city: addr.city || '',
          district: addr.district || '',
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        setImmutableData({
          email: d.email || '',
          role: d.role || 'Citizen',
          nationalId: d.nationalId || 'N/A',
          id: d._id || d.id || ''
        });
      } else {
        setErrorMsg(res.data?.message || 'Failed to fetch profile information.');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setErrorMsg('Network error connecting to backend service.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      setErrorMsg('Full name must be at least 3 characters long.');
      return;
    }
    if (!formData.phoneNumber.trim() || formData.phoneNumber.trim().length < 10) {
      setErrorMsg('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    if (!formData.district) {
      setErrorMsg('Please select your registered district.');
      return;
    }

    // Password validation if attempting change
    if (formData.newPassword || formData.oldPassword || formData.confirmPassword) {
      if (!formData.oldPassword) {
        setErrorMsg('Please provide your current password to set a new password.');
        return;
      }
      if (!formData.newPassword || formData.newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        addressNo: formData.addressNo.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        district: formData.district
      };

      if (formData.newPassword && formData.oldPassword) {
        payload.oldPassword = formData.oldPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await authService.updateProfile(payload);

      if (res.ok && res.data?.user) {
        setSuccessMsg('Profile updated successfully!');
        // Synchronize with AuthContext & localStorage
        updateUser(res.data.user);

        // Reset password fields
        setFormData(prev => ({
          ...prev,
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setErrorMsg(res.data?.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorMsg('Server error occurred during profile update.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="container my-5 flex-grow-1 text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <h5 className="fw-bold text-dark">Loading Citizen Profile...</h5>
      </main>
    );
  }

  return (
    <main className="container my-5 flex-grow-1">

      {/* Top Breadcrumb */}
      <div className="mb-4">
        <Link to="/dashboard" className="text-decoration-none small fw-semibold" style={{ color: 'var(--primary)' }}>
          <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
        </Link>
        <h2 className="fw-bold text-dark mt-2 mb-1">Citizen Profile Settings</h2>
        <p className="text-muted small">Manage your verified civic identity, contact info, and credentials.</p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Success:</strong> {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} aria-label="Close"></button>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2"></i>
          <strong>Error:</strong> {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg('')} aria-label="Close"></button>
        </div>
      )}

      <div className="row g-4">

        {/* LEFT COLUMN: Identity Verification Overview (Read-Only) */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4 text-center">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3 text-white"
              style={{ width: '80px', height: '80px', background: 'var(--primary-dark)', fontSize: '2.5rem' }}
            >
              <i className="bi bi-person-fill"></i>
            </div>
            <h5 className="fw-bold text-dark mb-1">{formData.fullName || user?.fullName || 'Citizen'}</h5>
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1.5 rounded-pill mb-3">
              <i className="bi bi-patch-check-fill me-1"></i>Verified Citizen
            </span>

            <div className="border-top pt-3 text-start small">
              <div className="mb-2">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>NATIONAL IDENTITY NUMBER (NIC)</span>
                <strong className="text-dark font-monospace">{immutableData.nationalId}</strong>
              </div>
              <div className="mb-2">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>EMAIL ADDRESS</span>
                <strong className="text-dark">{immutableData.email}</strong>
              </div>
              <div className="mb-2">
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>ACCOUNT ROLE</span>
                <span className="badge bg-light text-dark border">{immutableData.role}</span>
              </div>
              <div>
                <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>CITIZEN RECORD ID</span>
                <span className="font-monospace text-muted small">{immutableData.id}</span>
              </div>
            </div>
          </div>

          <div className="card bg-light border-0 rounded-4 p-3 text-muted small">
            <i className="bi bi-shield-lock-fill text-primary mb-2 fs-5"></i>
            <strong className="text-dark d-block mb-1">Identity Security Policy</strong>
            National ID and email addresses are cryptographically locked to ensure valid police report jurisdiction. If your civic credentials have changed, contact support.
          </div>
        </div>

        {/* RIGHT COLUMN: Editable Form Details */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
            <div className="card-header bg-white py-3 border-0 px-4 border-bottom d-flex align-items-center gap-2">
              <i className="bi bi-person-lines-fill text-primary"></i>
              <h5 className="fw-bold text-dark mb-0">Personal &amp; Contact Details</h5>
            </div>

            <div className="card-body p-4 p-sm-5">
              <form onSubmit={handleSubmit}>

                {/* Section 1: Basic Info */}
                <h6 className="fw-bold text-primary mb-3">General Information</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label htmlFor="fullName" className="form-label small fw-semibold">
                      Full Legal Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      minLength={3}
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="phoneNumber" className="form-label small fw-semibold">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      minLength={10}
                    />
                  </div>
                </div>

                {/* Section 2: Residential Address */}
                <h6 className="fw-bold text-primary mb-3 border-top pt-4">Residential Address</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label htmlFor="addressNo" className="form-label small fw-semibold">
                      House / Unit No
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      id="addressNo"
                      name="addressNo"
                      value={formData.addressNo}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-8">
                    <label htmlFor="street" className="form-label small fw-semibold">
                      Street Name
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="city" className="form-label small fw-semibold">
                      City
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="district" className="form-label small fw-semibold">
                      District <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select bg-light"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Select District...</option>
                      {DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section 3: Credentials / Password Change */}
                <h6 className="fw-bold text-primary mb-3 border-top pt-4">
                  Security &amp; Password <span className="text-muted font-monospace small" style={{ fontWeight: 400 }}>(Optional)</span>
                </h6>
                <p className="text-muted small mb-3">Leave blank if you do not want to change your password.</p>

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label htmlFor="oldPassword" className="form-label small fw-semibold">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="form-control bg-light"
                      id="oldPassword"
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="newPassword" className="form-label small fw-semibold">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="form-control bg-light"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="col-md-4">
                    <label htmlFor="confirmPassword" className="form-label small fw-semibold">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="form-control bg-light"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                  <Link to="/dashboard" className="btn btn-outline-secondary px-4 py-2">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2 shadow-sm"
                    style={{ background: 'var(--primary)', border: 'none' }}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving Changes...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>

      </div>

    </main>
  );
}
