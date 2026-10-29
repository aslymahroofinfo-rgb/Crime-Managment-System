import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTransition } from '../../context/PageTransitionContext';
import { complaintService } from '../../services/complaintService';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const CATEGORIES = [
  'Theft', 'Assault', 'Cyber Crime', 'Domestic Violence',
  'Missing Person', 'Fraud', 'Other'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.mp4'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

export default function FileComplaint() {
  const navigate = useNavigate();
  const { navigateWithTransition } = usePageTransition();
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    district: '',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    suspectDetails: '',
    witnessDetails: '',
    isAnonymous: false
  });

  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [successComplaint, setSuccessComplaint] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cleanup object URLs on unmount or file change
  useEffect(() => {
    return () => {
      filePreviews.forEach(p => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
  }, [filePreviews]);

  // Handle Text/Select Inputs
  const handleInputChange = (e) => {
    const { id, name, value, type, checked } = e.target;
    const key = name || id;
    setFormData(prev => ({
      ...prev,
      [key]: type === 'checkbox' ? checked : value
    }));
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // Handle File Input Change
  const handleFileChange = (e) => {
    setErrorMsg('');
    const selectedFiles = Array.from(e.target.files || []);

    if (files.length + selectedFiles.length > MAX_FILES) {
      setErrorMsg(`Maximum of ${MAX_FILES} evidence files allowed in total.`);
      return;
    }

    const newFiles = [];
    const newPreviews = [];

    for (const file of selectedFiles) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMsg(`Unsupported file type: ${file.name}. Allowed: JPG, PNG, PDF, MP4.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(`File ${file.name} exceeds the 10 MB limit.`);
        return;
      }

      newFiles.push(file);
      const isImg = file.type.startsWith('image/');
      newPreviews.push({
        name: file.name,
        type: file.type,
        size: file.size,
        ext,
        url: isImg ? URL.createObjectURL(file) : null
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    setFilePreviews(prev => [...prev, ...newPreviews]);

    // Reset input value so same file can be re-selected if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a selected file
  const removeFile = (index) => {
    const previewToRemove = filePreviews[index];
    if (previewToRemove && previewToRemove.url) {
      URL.revokeObjectURL(previewToRemove.url);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Form Reset
  const handleReset = () => {
    filePreviews.forEach(p => {
      if (p.url) URL.revokeObjectURL(p.url);
    });
    setFormData({
      title: '',
      category: '',
      district: '',
      incidentDate: '',
      incidentTime: '',
      location: '',
      description: '',
      suspectDetails: '',
      witnessDetails: '',
      isAnonymous: false
    });
    setFiles([]);
    setFilePreviews([]);
    setErrorMsg('');
    setValidationErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Validate form before submission
  const validate = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      errs.title = 'Please enter a concise title (at least 5 characters).';
    }
    if (!formData.category) {
      errs.category = 'Please choose a category.';
    }
    if (!formData.district) {
      errs.district = 'Please select the district.';
    }
    if (!formData.incidentDate) {
      errs.incidentDate = 'Please select the incident date.';
    }
    if (!formData.incidentTime) {
      errs.incidentTime = 'Please select the approximate time.';
    }
    if (!formData.location.trim()) {
      errs.location = 'Please specify where the incident occurred.';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errs.description = 'Please provide a detailed description (at least 10 characters).';
    } else if (formData.description.length > 1000) {
      errs.description = 'Description cannot exceed 1000 characters.';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('category', formData.category);
      payload.append('district', formData.district);
      payload.append('incidentDate', formData.incidentDate);
      payload.append('incidentTime', formData.incidentTime);
      payload.append('location', formData.location.trim());
      payload.append('description', formData.description.trim());
      payload.append('suspectDetails', formData.suspectDetails.trim());
      payload.append('witnessDetails', formData.witnessDetails.trim());
      payload.append('isAnonymous', String(formData.isAnonymous));

      files.forEach(file => {
        payload.append('evidenceFiles', file);
      });

      const res = await complaintService.submitComplaint(payload);

      if (res.ok && (res.data?.complaintId || res.data?.complaint?.complaintId)) {
        const returnedComplaint = res.data.complaint || {};
        const authoritativeComplaint = {
          complaintId: res.data.complaintId || returnedComplaint.complaintId,
          title: returnedComplaint.title || formData.title.trim(),
          category: returnedComplaint.category || formData.category,
          district: returnedComplaint.district || formData.district,
          status: returnedComplaint.status || 'Pending',
          createdAt: returnedComplaint.createdAt || new Date().toISOString(),
          isAnonymous: returnedComplaint.isAnonymous !== undefined ? returnedComplaint.isAnonymous : formData.isAnonymous,
          evidenceCount: returnedComplaint.evidenceCount !== undefined ? returnedComplaint.evidenceCount : files.length
        };
        setSuccessComplaint(authoritativeComplaint);
        setShowSuccessModal(true);
        handleReset();
      } else {
        setErrorMsg(res.data?.message || 'Submission failed. Please check your information.');
      }
    } catch (err) {
      console.error('Complaint submission error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'A network or server error occurred. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Character counter styling
  const descLen = formData.description.length;
  let counterClass = 'text-muted small';
  if (descLen >= 900) counterClass = 'text-danger small fw-bold';
  else if (descLen >= 750) counterClass = 'text-warning small fw-bold';

  return (
    <main className="container my-5 flex-grow-1 position-relative">
      {/* Centered Submission Success Modal */}
      {showSuccessModal && successComplaint && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{
            backgroundColor: 'rgba(15, 36, 71, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1055
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header border-0 text-white px-4 pt-4 pb-3"
                style={{ background: 'var(--hero-gradient)' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center bg-white"
                    style={{ width: '48px', height: '48px', flexShrink: 0 }}
                  >
                    <i className="bi bi-check-circle-fill text-success fs-3"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0">Complaint Submitted Successfully</h5>
                    <p className="text-white-50 small mb-0">Official Law Enforcement Filing Record</p>
                  </div>
                </div>
              </div>

              <div className="modal-body p-4">
                <div className="alert alert-success border-0 bg-success-subtle text-success-emphasis rounded-3 d-flex align-items-center gap-3 mb-4">
                  <i className="bi bi-shield-check fs-2"></i>
                  <div>
                    <span className="fw-semibold d-block">Complaint Securely Logged</span>
                    <span className="small">
                      Your complaint has been permanently recorded in the Crime Investigation database and queued for investigation.
                    </span>
                  </div>
                </div>

                {/* Complaint ID Spotlight */}
                <div className="bg-light border rounded-3 p-3 text-center mb-4">
                  <span className="text-muted small text-uppercase fw-semibold d-block mb-1">
                    Complaint Reference ID
                  </span>
                  <span
                    className="font-monospace fw-bold fs-3 text-primary"
                    style={{ letterSpacing: '1px' }}
                  >
                    {successComplaint.complaintId}
                  </span>
                  <div className="mt-2">
                    <span className="badge bg-warning text-dark px-3 py-1">
                      Status: {successComplaint.status || 'Pending'}
                    </span>
                    {successComplaint.isAnonymous ? (
                      <span className="badge bg-secondary ms-2 px-3 py-1">
                        <i className="bi bi-incognito me-1"></i>Anonymous Filing
                      </span>
                    ) : (
                      <span className="badge bg-primary ms-2 px-3 py-1">
                        <i className="bi bi-person-check me-1"></i>Registered Citizen Filing
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Complaint Details */}
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 h-100 bg-white">
                      <span className="text-muted small d-block mb-1">Case Title</span>
                      <strong className="text-dark d-block text-truncate">
                        {successComplaint.title || 'Untitled'}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 h-100 bg-white">
                      <span className="text-muted small d-block mb-1">Crime Category</span>
                      <strong className="text-dark d-block">
                        {successComplaint.category || 'N/A'}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 h-100 bg-white">
                      <span className="text-muted small d-block mb-1">Jurisdiction / District</span>
                      <strong className="text-dark d-block">
                        {successComplaint.district || 'N/A'}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 h-100 bg-white">
                      <span className="text-muted small d-block mb-1">Submission Date & Time</span>
                      <strong className="text-dark d-block">
                        {successComplaint.createdAt
                          ? new Date(successComplaint.createdAt).toLocaleString()
                          : new Date().toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 border rounded-3 bg-white d-flex align-items-center justify-content-between">
                      <div>
                        <span className="text-muted small d-block">Evidence Files Uploaded</span>
                        <strong className="text-dark">
                          {successComplaint.evidenceCount || 0} file(s) attached
                        </strong>
                      </div>
                      <i className="bi bi-paperclip fs-4 text-muted"></i>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  Please note your Complaint Reference ID. You can track this case anytime using this ID. Click <strong>OK</strong> below to view the case details page.
                </div>
              </div>

              <div className="modal-footer bg-light px-4 py-3 border-0 d-flex justify-content-end">
                <button
                  type="button"
                  id="btn-confirm-complaint-success"
                  className="btn btn-primary px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
                  style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }}
                  onClick={() => {
                    const targetId = successComplaint.complaintId;
                    setShowSuccessModal(false);
                    setSuccessComplaint(null);
                    navigateWithTransition(`/complaints/${encodeURIComponent(targetId)}`);
                  }}
                >
                  <i className="bi bi-check-lg fs-5"></i>
                  <span>OK</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-9 col-12">

          {/* Back Link & Title */}
          <div className="mb-4">
            <Link to="/dashboard" className="text-decoration-none small fw-semibold" style={{ color: 'var(--primary)' }}>
              <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
            </Link>
            <h2 className="fw-bold text-dark mt-2 mb-1">Submit Crime Complaint</h2>
            <p className="text-muted">
              Fill out the official form below. Please provide as much accurate detail as possible.
            </p>
          </div>

          {/* Legal Warning */}
          <div className="alert alert-warning d-flex align-items-start gap-3 border-0 shadow-sm mb-4 rounded-3">
            <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
            <div>
              <strong className="text-dark">Legal Warning:</strong>
              <span className="text-dark-50 small d-block">
                Under Penal Code Section 182, filing a false police report or complaint is a criminal offense punishable by fines or imprisonment.
              </span>
            </div>
          </div>

          {/* General Error Banner */}
          {errorMsg && (
            <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm rounded-3 mb-4" role="alert">
              <i className="bi bi-exclamation-octagon-fill me-2"></i>
              <strong>Error:</strong> {errorMsg}
              <button type="button" className="btn-close" onClick={() => setErrorMsg('')} aria-label="Close"></button>
            </div>
          )}

          {/* Main Form Card */}
          <div className="card shadow border-0 rounded-4 overflow-hidden">
            <div
              className="card-header py-3 text-white border-0 d-flex align-items-center gap-2"
              style={{ background: 'var(--primary-dark)' }}
            >
              <i className="bi bi-file-earmark-plus-fill"></i>
              <h5 className="mb-0 fw-semibold">Incident Report Details</h5>
            </div>

            <div className="card-body p-4 p-sm-5 bg-white">
              <form onSubmit={handleSubmit} noValidate>

                {/* SECTION 1: General Info */}
                <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">
                  <i className="bi bi-info-circle-fill me-2"></i>General Information
                </h5>

                <div className="row g-3 mb-4">
                  {/* Complaint Title */}
                  <div className="col-md-8">
                    <label htmlFor="title" className="form-label small fw-semibold">
                      Complaint Title / Incident Summary <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control bg-light ${validationErrors.title ? 'is-invalid' : ''}`}
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Bicycle theft from front porch"
                      required
                      minLength={5}
                    />
                    {validationErrors.title && (
                      <div className="invalid-feedback">{validationErrors.title}</div>
                    )}
                  </div>

                  {/* Complaint Category */}
                  <div className="col-md-4">
                    <label htmlFor="category" className="form-label small fw-semibold">
                      Complaint Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select bg-light ${validationErrors.category ? 'is-invalid' : ''}`}
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Select Category</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <div className="invalid-feedback">{validationErrors.category}</div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: Time and Location */}
                <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">
                  <i className="bi bi-geo-alt-fill me-2"></i>Date, Time &amp; Location
                </h5>

                <div className="row g-3 mb-4">
                  {/* District */}
                  <div className="col-sm-6 col-md-3">
                    <label htmlFor="district" className="form-label small fw-semibold">
                      District <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select bg-light ${validationErrors.district ? 'is-invalid' : ''}`}
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>Select District</option>
                      {DISTRICTS.map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                    {validationErrors.district && (
                      <div className="invalid-feedback">{validationErrors.district}</div>
                    )}
                  </div>

                  {/* Incident Date */}
                  <div className="col-sm-6 col-md-3">
                    <label htmlFor="incidentDate" className="form-label small fw-semibold">
                      Incident Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control bg-light ${validationErrors.incidentDate ? 'is-invalid' : ''}`}
                      id="incidentDate"
                      name="incidentDate"
                      value={formData.incidentDate}
                      onChange={handleInputChange}
                      required
                    />
                    {validationErrors.incidentDate && (
                      <div className="invalid-feedback">{validationErrors.incidentDate}</div>
                    )}
                  </div>

                  {/* Incident Time */}
                  <div className="col-sm-6 col-md-3">
                    <label htmlFor="incidentTime" className="form-label small fw-semibold">
                      Incident Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      className={`form-control bg-light ${validationErrors.incidentTime ? 'is-invalid' : ''}`}
                      id="incidentTime"
                      name="incidentTime"
                      value={formData.incidentTime}
                      onChange={handleInputChange}
                      required
                    />
                    {validationErrors.incidentTime && (
                      <div className="invalid-feedback">{validationErrors.incidentTime}</div>
                    )}
                  </div>

                  {/* Incident Location */}
                  <div className="col-sm-6 col-md-3">
                    <label htmlFor="location" className="form-label small fw-semibold">
                      Location / Landmark <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control bg-light ${validationErrors.location ? 'is-invalid' : ''}`}
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Near Metro Station, Block C"
                      required
                    />
                    {validationErrors.location && (
                      <div className="invalid-feedback">{validationErrors.location}</div>
                    )}
                  </div>
                </div>

                {/* SECTION 3: Details & Description */}
                <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">
                  <i className="bi bi-pencil-square me-2"></i>Incident Narrative
                </h5>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="description" className="form-label small fw-semibold mb-0">
                      Detailed Description of Incident <span className="text-danger">*</span>
                    </label>
                    <small className={counterClass}>
                      {descLen} / 1000 characters
                    </small>
                  </div>
                  <textarea
                    className={`form-control bg-light ${validationErrors.description ? 'is-invalid' : ''}`}
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a chronological description of what happened..."
                    maxLength={1000}
                    required
                  ></textarea>
                  {validationErrors.description && (
                    <div className="invalid-feedback">{validationErrors.description}</div>
                  )}
                </div>

                {/* SECTION 4: Suspects & Witnesses (Optional) */}
                <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">
                  <i className="bi bi-people-fill me-2"></i>Suspects &amp; Witnesses{' '}
                  <span className="text-muted font-monospace small" style={{ fontWeight: 400 }}>(Optional)</span>
                </h5>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label htmlFor="suspectDetails" className="form-label small fw-semibold">
                      Suspect Details (Names, descriptions, vehicles...)
                    </label>
                    <textarea
                      className="form-control bg-light"
                      id="suspectDetails"
                      name="suspectDetails"
                      rows={3}
                      value={formData.suspectDetails}
                      onChange={handleInputChange}
                      placeholder="Enter physical description, vehicle details, nicknames..."
                    ></textarea>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="witnessDetails" className="form-label small fw-semibold">
                      Witness Details (Names, contact info, statements...)
                    </label>
                    <textarea
                      className="form-control bg-light"
                      id="witnessDetails"
                      name="witnessDetails"
                      rows={3}
                      value={formData.witnessDetails}
                      onChange={handleInputChange}
                      placeholder="Enter names, phone numbers, or addresses of any witnesses..."
                    ></textarea>
                  </div>
                </div>

                {/* SECTION 5: Evidence & Submission Mode */}
                <h5 className="fw-bold mb-3 border-bottom pb-2 text-primary">
                  <i className="bi bi-paperclip me-2"></i>Evidence &amp; Submission Mode
                </h5>

                <div className="row g-3 mb-4 align-items-start">
                  {/* Evidence Upload */}
                  <div className="col-md-6">
                    <label htmlFor="evidenceUpload" className="form-label small fw-semibold">
                      Upload Evidence (Photos / Docs / Videos)
                    </label>
                    <input
                      type="file"
                      className="form-control bg-light"
                      id="evidenceUpload"
                      ref={fileInputRef}
                      multiple
                      accept="image/jpeg,image/png,application/pdf,video/mp4"
                      onChange={handleFileChange}
                      disabled={files.length >= MAX_FILES}
                    />
                    <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                      Max file size: 10MB per file. Maximum 5 files. Supported: JPG, PNG, PDF, MP4.
                    </div>

                    {/* Previews List */}
                    {filePreviews.length > 0 && (
                      <div className="mt-3">
                        <h6 className="small fw-bold mb-2 text-dark">
                          Selected Files ({filePreviews.length}/{MAX_FILES}):
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {filePreviews.map((p, idx) => (
                            <div
                              key={idx}
                              className="card p-2 border bg-light position-relative d-flex flex-column align-items-center justify-content-center text-center shadow-sm"
                              style={{ width: '110px', minHeight: '115px' }}
                            >
                              <button
                                type="button"
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center shadow"
                                style={{ width: '20px', height: '20px', transform: 'translate(30%, -30%)' }}
                                onClick={() => removeFile(idx)}
                                title="Remove file"
                                aria-label={`Remove file ${p.name}`}
                              >
                                &times;
                              </button>

                              {p.url ? (
                                <img
                                  src={p.url}
                                  alt={p.name}
                                  className="img-fluid rounded border mb-1"
                                  style={{ maxHeight: '55px', maxWidth: '90px', objectFit: 'cover' }}
                                />
                              ) : p.ext === '.pdf' ? (
                                <i className="bi bi-file-earmark-pdf-fill text-danger fs-2"></i>
                              ) : p.ext === '.mp4' ? (
                                <i className="bi bi-file-earmark-play-fill text-primary fs-2"></i>
                              ) : (
                                <i className="bi bi-file-earmark-arrow-up-fill text-muted fs-2"></i>
                              )}

                              <span
                                className="text-truncate w-100 small mt-1 text-dark"
                                style={{ fontSize: '0.68rem' }}
                                title={p.name}
                              >
                                {p.name}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.62rem' }}>
                                {(p.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Anonymous Switch */}
                  <div className="col-md-6 pt-md-2">
                    <div className="card bg-light border-0 rounded-3 p-3">
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="isAnonymous"
                          name="isAnonymous"
                          checked={formData.isAnonymous}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label small fw-bold text-dark" htmlFor="isAnonymous">
                          <i className="bi bi-eye-slash-fill text-muted me-1"></i>Submit Report Anonymously
                        </label>
                      </div>
                      <p className="text-muted small mb-0 mt-2" style={{ fontSize: '0.78rem' }}>
                        Your IP and account profile details will be hidden from investigators. Note: Anonymous complaints might take longer to verify.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit & Reset Buttons */}
                <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 py-2.5 fw-bold"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>Reset Form
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2.5 fw-bold shadow-sm"
                    style={{ background: 'var(--primary)', border: 'none' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-2"></i>Submit Official Complaint
                      </>
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
