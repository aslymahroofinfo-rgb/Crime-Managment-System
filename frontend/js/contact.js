/* ============================================================
   Crime Complaint Management System - Contact Page Logic
   Author: Student Project
   Description: Public contact form submission & validation.
   ============================================================ */

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contactForm');
  const contactAlert = document.getElementById('contactAlert');
  const submitBtn = document.getElementById('contactSubmitBtn') || (contactForm ? contactForm.querySelector('button[type="submit"]') : null);

  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  const subjectInput = document.getElementById('contactSubject');
  const messageInput = document.getElementById('contactMessage');

  function showAlert(type, message, iconClass) {
    if (!contactAlert) return;
    contactAlert.className = `alert alert-${type} d-flex align-items-center mb-4 shadow-sm rounded-3`;
    contactAlert.innerHTML = `
      <i class="bi ${iconClass} me-2 fs-5 flex-shrink-0"></i>
      <div>${escapeHTML(message)}</div>
    `;
    contactAlert.classList.remove('d-none');
    contactAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    if (!contactAlert) return;
    contactAlert.classList.add('d-none');
    contactAlert.innerHTML = '';
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      hideAlert();

      const isValid = contactForm.checkValidity();
      contactForm.classList.add('was-validated');

      if (!isValid) {
        return;
      }

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const subject = subjectInput ? subjectInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      // Frontend validation safeguards
      if (name.length < 2 || name.length > 100) {
        showAlert('danger', 'Please enter a valid full name (between 2 and 100 characters).', 'bi-exclamation-triangle-fill');
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        showAlert('danger', 'Please enter a valid email address.', 'bi-exclamation-triangle-fill');
        return;
      }

      if (subject.length < 3 || subject.length > 150) {
        showAlert('danger', 'Please specify a subject between 3 and 150 characters.', 'bi-exclamation-triangle-fill');
        return;
      }

      if (message.length < 10 || message.length > 3000) {
        showAlert('danger', 'Please provide message details between 10 and 3000 characters.', 'bi-exclamation-triangle-fill');
        return;
      }

      // Button loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
      }

      try {
        const response = await fetch('http://localhost:5000/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, subject, message })
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 201) {
          showAlert(
            'success',
            'Your message has been sent successfully. Our support team will review your inquiry shortly.',
            'bi-check-circle-fill'
          );
          contactForm.reset();
          contactForm.classList.remove('was-validated');
        } else {
          // Failure: DO NOT RESET THE FORM, so the user never loses their typed message
          const errorMsg = data.message || 'We could not send your message. Please check your information and try again.';
          showAlert('danger', errorMsg, 'bi-exclamation-triangle-fill');
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        // Network/server failure: DO NOT RESET THE FORM
        showAlert('danger', 'A network connection error occurred. Please try again.', 'bi-wifi-off');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-send-fill me-2"></i>Send Message';
        }
      }
    });
  }
});
