import { useState } from 'react';
import { contactService } from '../../services/contactService';
import ToastAlert from '../../components/feedback/ToastAlert';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertState(null);

    // Validation
    const cleanName = formData.name.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      setAlertState({ type: 'danger', message: 'Full name must be between 2 and 100 characters.' });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = formData.email.trim();
    if (!emailPattern.test(cleanEmail)) {
      setAlertState({ type: 'danger', message: 'Please enter a valid email address.' });
      return;
    }

    const cleanPhone = formData.phone.trim();
    if (cleanPhone && cleanPhone.length > 30) {
      setAlertState({ type: 'danger', message: 'Phone number format is invalid (max 30 characters).' });
      return;
    }

    const cleanSubject = formData.subject.trim();
    if (cleanSubject.length < 3 || cleanSubject.length > 150) {
      setAlertState({ type: 'danger', message: 'Subject must be between 3 and 150 characters.' });
      return;
    }

    const cleanMessage = formData.message.trim();
    if (cleanMessage.length < 10 || cleanMessage.length > 3000) {
      setAlertState({ type: 'danger', message: 'Message details must be between 10 and 3000 characters.' });
      return;
    }

    setLoading(true);
    try {
      const res = await contactService.submitInquiry({
        name: cleanName,
        email: cleanEmail.toLowerCase(),
        phone: cleanPhone,
        subject: cleanSubject,
        message: cleanMessage
      });

      if (res.ok) {
        setAlertState({
          type: 'success',
          message: 'Your message has been submitted successfully. Our support team will review your inquiry shortly.'
        });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        // Form content remains preserved
        setAlertState({
          type: 'danger',
          message: res.data?.message || 'Failed to send message. Please check your information and try again.'
        });
      }
    } catch {
      setAlertState({
        type: 'danger',
        message: 'A network error occurred while sending your message. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="row g-4">
        {/* Left Column: Form */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-sm-5 h-100">
            <h3 className="fw-bold text-dark mb-2">Send Us a Message</h3>
            <p className="text-muted small mb-4">Fill out the form below. Our support team typically replies to queries within 24 business hours.</p>

            {alertState && (
              <ToastAlert
                type={alertState.type}
                message={alertState.message}
                onClose={() => setAlertState(null)}
                className="mb-4"
              />
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="name" className="form-label small fw-semibold">Your Full Name <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0"><i className="bi bi-person"></i></span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      id="name"
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="email" className="form-label small fw-semibold">Email Address <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0"><i className="bi bi-envelope"></i></span>
                    <input
                      type="email"
                      className="form-control bg-light border-start-0 ps-0"
                      id="email"
                      placeholder="e.g. john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="phone" className="form-label small fw-semibold">Phone Number <small className="text-muted">(Optional)</small></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0"><i className="bi bi-telephone"></i></span>
                    <input
                      type="tel"
                      className="form-control bg-light border-start-0 ps-0"
                      id="phone"
                      placeholder="e.g. 0771234567"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="subject" className="form-label small fw-semibold">Message Subject <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted border-end-0"><i className="bi bi-bookmark"></i></span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      id="subject"
                      placeholder="e.g. System Inquiry, Account Help"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label htmlFor="message" className="form-label small fw-semibold">Write Message Details <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control bg-light"
                    id="message"
                    rows="5"
                    placeholder="Enter your detailed query here (min 10 characters)..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary px-5 py-2.5 fw-semibold mt-4 shadow-sm w-100 w-sm-auto"
                style={{ background: 'var(--primary)', border: 'none' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill me-2"></i>Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Contact Info */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4 p-sm-5 h-100">
            <h3 className="fw-bold text-dark mb-4">Official Information</h3>

            <div className="d-flex flex-column gap-4">
              <div className="d-flex align-items-start gap-3 border-bottom pb-3">
                <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3"><i className="bi bi-telephone-fill fs-4"></i></div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Emergency Numbers</h6>
                  <p className="text-danger fw-bold mb-0">911 (Immediate Assistance)</p>
                  <span className="text-muted small">Hotline Support: 1-800-555-CRIME</span>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 border-bottom pb-3">
                <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3"><i className="bi bi-geo-alt-fill fs-4"></i></div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Central Office Address</h6>
                  <address className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    Public Safety Headquarters,<br />
                    Sector 12, City Capital,<br />
                    Building B, Suite 400
                  </address>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 border-bottom pb-3">
                <div className="p-3 bg-info bg-opacity-10 text-info rounded-3"><i className="bi bi-envelope-at-fill fs-4"></i></div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Email Inquiries</h6>
                  <strong className="text-dark small d-block">support@ccms-portal.gov</strong>
                  <span className="text-muted small">info@ccms-registry.gov</span>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-3 bg-success bg-opacity-10 text-success rounded-3"><i className="bi bi-clock-fill fs-4"></i></div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Working Hours</h6>
                  <p className="text-muted small mb-0">Monday – Friday: 09:00 AM – 05:00 PM</p>
                  <p className="text-muted small mb-0">Saturday: 09:00 AM – 01:00 PM</p>
                  <span className="badge bg-light text-dark border mt-1">Closed Sundays & Holidays</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
