import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminSettings() {
  const { user, updateUser } = useAuth();

  // General Station Parameters State
  const [stationConfig, setStationConfig] = useState({
    deptName: 'Central Police Precinct 1',
    stationCode: 'CPP1-099',
    adminEmail: 'station-admin@precinct1.gov',
    triageLimit: '4',
    maxUploadSize: '10',
    autoDispatch: true,
    anonymityProtection: true,
  });

  const [stationSuccess, setStationSuccess] = useState('');
  const [stationError, setStationError] = useState('');

  // Credentials State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credSuccess, setCredSuccess] = useState('');
  const [credError, setCredError] = useState('');

  useEffect(() => {
    // Load station config from localStorage if present
    const savedConfig = localStorage.getItem('ciw_station_config');
    if (savedConfig) {
      try {
        setStationConfig(JSON.parse(savedConfig));
      } catch (err) {
        console.error('Failed to parse station config', err);
      }
    }

    // Populate credentials form from user
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const handleStationSubmit = (e) => {
    e.preventDefault();
    setStationSuccess('');
    setStationError('');

    try {
      localStorage.setItem('ciw_station_config', JSON.stringify(stationConfig));
      setStationSuccess('Station configuration parameters saved successfully!');
      setTimeout(() => setStationSuccess(''), 4000);
    } catch (err) {
      setStationError('Failed to save configuration settings.');
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredSuccess('');
    setCredError('');

    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName || trimmedName.length < 3) {
      setCredError('Admin full name must be at least 3 characters.');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setCredError('Admin phone number must be at least 10 characters.');
      return;
    }

    const payload = {
      fullName: trimmedName,
      phoneNumber: trimmedPhone,
    };

    if (newPassword) {
      if (!oldPassword) {
        setCredError('Current Password is required to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setCredError('New password must be at least 6 characters long.');
        return;
      }
      payload.oldPassword = oldPassword;
      payload.newPassword = newPassword;
    }

    setCredLoading(true);
    try {
      const response = await api.put('/auth/profile', payload);
      setCredSuccess(response.data?.message || 'Credentials updated successfully!');
      
      if (response.data?.user && updateUser) {
        updateUser(response.data.user);
      }

      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setCredSuccess(''), 4000);
    } catch (err) {
      setCredError(err.response?.data?.message || err.message || 'Failed to update credentials.');
    } finally {
      setCredLoading(false);
    }
  };

  return (
    <div>
      {/* Header Block */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom g-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Administrative System Configurations</h2>
          <p className="text-muted mb-0 small">Manage department settings, notification email triggers, and system credentials.</p>
        </div>
      </div>

      {/* Settings Card Layout */}
      <div className="row g-4">
        {/* Main Form Column */}
        <div className="col-lg-8">
          {/* General Station Parameters Card */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-sm-5">
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-sliders text-primary me-2"></i>General Station Parameters
            </h5>

            {stationSuccess && (
              <div className="alert alert-success small py-2 mb-3 fw-bold" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>{stationSuccess}
              </div>
            )}
            {stationError && (
              <div className="alert alert-danger small py-2 mb-3 fw-bold" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{stationError}
              </div>
            )}

            <form onSubmit={handleStationSubmit}>
              <div className="row g-3">
                {/* Dept Name */}
                <div className="col-md-6">
                  <label htmlFor="deptName" className="form-label small fw-semibold">
                    Department / Station Name
                  </label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    id="deptName"
                    value={stationConfig.deptName}
                    onChange={(e) => setStationConfig({ ...stationConfig, deptName: e.target.value })}
                    required
                  />
                </div>
                {/* Station Code */}
                <div className="col-md-6">
                  <label htmlFor="stationCode" className="form-label small fw-semibold">
                    Station Precinct Code
                  </label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    id="stationCode"
                    value={stationConfig.stationCode}
                    onChange={(e) => setStationConfig({ ...stationConfig, stationCode: e.target.value })}
                    required
                  />
                </div>

                {/* Officer Email */}
                <div className="col-md-12">
                  <label htmlFor="adminEmail" className="form-label small fw-semibold">
                    Central Admin Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control bg-light"
                    id="adminEmail"
                    value={stationConfig.adminEmail}
                    onChange={(e) => setStationConfig({ ...stationConfig, adminEmail: e.target.value })}
                    required
                  />
                </div>

                {/* Triage Dispatch Time limit */}
                <div className="col-md-6">
                  <label htmlFor="triageLimit" className="form-label small fw-semibold">
                    Triage Notice Warning Limit
                  </label>
                  <select
                    className="form-select bg-light"
                    id="triageLimit"
                    value={stationConfig.triageLimit}
                    onChange={(e) => setStationConfig({ ...stationConfig, triageLimit: e.target.value })}
                  >
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="8">8 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                </div>

                {/* Max evidence upload */}
                <div className="col-md-6">
                  <label htmlFor="maxUploadSize" className="form-label small fw-semibold">
                    Maximum File Size Upload
                  </label>
                  <select
                    className="form-select bg-light"
                    id="maxUploadSize"
                    value={stationConfig.maxUploadSize}
                    onChange={(e) => setStationConfig({ ...stationConfig, maxUploadSize: e.target.value })}
                  >
                    <option value="5">5 MB</option>
                    <option value="10">10 MB</option>
                    <option value="25">25 MB</option>
                    <option value="50">50 MB</option>
                  </select>
                </div>

                {/* Checkbox toggles */}
                <div className="col-12 mt-4">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoDispatch"
                      checked={stationConfig.autoDispatch}
                      onChange={(e) => setStationConfig({ ...stationConfig, autoDispatch: e.target.checked })}
                    />
                    <label className="form-check-label small text-muted" htmlFor="autoDispatch">
                      Enable automatic officer email notifications upon complaint routing
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="anonymityProtection"
                      checked={stationConfig.anonymityProtection}
                      onChange={(e) => setStationConfig({ ...stationConfig, anonymityProtection: e.target.checked })}
                    />
                    <label className="form-check-label small text-muted" htmlFor="anonymityProtection">
                      Enforce system-wide IP scrubbers for anonymous complaints
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary px-5 py-2.5 mt-4 fw-semibold shadow-sm"
                style={{ background: 'var(--primary)', border: 'none' }}
              >
                <i className="bi bi-save2-fill me-2"></i>Save Configuration
              </button>
            </form>
          </div>

          {/* CREDENTIAL SETTINGS CARD */}
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-sm-5 mt-4">
            <h5 className="fw-bold text-dark mb-4">
              <i className="bi bi-shield-lock-fill text-danger me-2"></i>Update Admin Credentials
            </h5>

            {credError && (
              <div className="alert alert-danger small py-2 mb-3 fw-bold" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{credError}
              </div>
            )}
            {credSuccess && (
              <div className="alert alert-success small py-2 mb-3 fw-bold" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>{credSuccess}
              </div>
            )}

            <form onSubmit={handleCredentialsSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="adminFullName" className="form-label small fw-semibold">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    id="adminFullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="adminPhone" className="form-label small fw-semibold">
                    Admin Phone Number
                  </label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    id="adminPhone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    minLength={10}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="adminOldPassword" className="form-label small fw-semibold">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control bg-light"
                    id="adminOldPassword"
                    placeholder="Required to change password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="adminNewPassword" className="form-label small fw-semibold">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control bg-light"
                    id="adminNewPassword"
                    placeholder="Leave blank to keep current"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  disabled={credLoading}
                  className="btn btn-primary px-4 py-2 shadow-sm"
                  style={{ background: 'var(--primary)', border: 'none' }}
                >
                  {credLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Credentials'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
