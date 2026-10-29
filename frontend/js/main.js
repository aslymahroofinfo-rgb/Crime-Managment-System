/* ============================================================
   Crime Complaint Management System - Main JavaScript
   Description: Simple, beginner-friendly scripts for
   scroll-to-top and animated stat counters.
   ============================================================ */

/* ----------------------------------------------------------
   1. SCROLL-TO-TOP BUTTON
   Show the button when user scrolls down 300px.
   Clicking it smoothly scrolls back to the top.
   ---------------------------------------------------------- */
const scrollTopBtn = document.getElementById('scrollTopBtn');

window.addEventListener('scroll', function () {
  if (window.scrollY > 300) {
    scrollTopBtn.classList.add('show');   // make button visible
  } else {
    scrollTopBtn.classList.remove('show'); // hide button
  }
});

scrollTopBtn.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ----------------------------------------------------------
   2. ANIMATED COUNTER (Statistics Section)
   When the stats section enters the viewport,
   numbers count up from 0 to their target value.
   ---------------------------------------------------------- */
function animateCounter(element, target, suffix) {
  let current = 0;
  const increment = Math.ceil(target / 80); // speed: 80 steps
  const timer = setInterval(function () {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer); // stop when we reach target
    }
    element.textContent = current.toLocaleString() + suffix;
  }, 20); // update every 20ms
}

/* Use IntersectionObserver to trigger animation when visible */
const statsSection = document.getElementById('statsSection');

if (statsSection) {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        // Find all counter elements and animate each one
        const counters = statsSection.querySelectorAll('.stat-number');
        counters.forEach(function (counter) {
          const target = parseInt(counter.getAttribute('data-target'), 10);
          const suffix = counter.getAttribute('data-suffix') || '';
          animateCounter(counter, target, suffix);
        });
        observer.disconnect(); // only animate once
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statsSection);
}


/* ----------------------------------------------------------
   3. NAVBAR ACTIVE LINK HIGHLIGHT
   Adds 'active' class to the nav link matching the
   current page section in the URL hash.
   ---------------------------------------------------------- */
const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

navLinks.forEach(function (link) {
  if (link.href === window.location.href) {
    link.classList.add('active');
  }
});


/* ----------------------------------------------------------
   4. SMOOTH SCROLL for anchor links
   Ensures all anchor (#) links scroll smoothly.
   ---------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return; // skip empty hashes
    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/* ----------------------------------------------------------
   5. EMERGENCY COMPLAINT MODAL
   Opens a beautiful dialog for urgent complaint submission.
   ---------------------------------------------------------- */
const emergencyOpenButtons = document.querySelectorAll('[data-emergency-open="true"]');
const emergencyModalElement = document.getElementById('emergencyComplaintModal');
const emergencyForm = document.getElementById('emergencyComplaintForm');
const emergencyStatus = document.getElementById('emergencyFormStatus');

if (emergencyModalElement) {
  const emergencyModal = new bootstrap.Modal(emergencyModalElement);

  emergencyOpenButtons.forEach(function (button) {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      emergencyModal.show();
    });
  });

  if (emergencyForm) {
    emergencyForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const details = document.getElementById('emergencyDetails').value.trim();
      const nic = document.getElementById('emergencyNic').value.trim();
      const phone = document.getElementById('emergencyPhone').value.trim();
      const district = document.getElementById('emergencyDistrict') ? document.getElementById('emergencyDistrict').value.trim() : '';
      const location = document.getElementById('emergencyLocation') ? document.getElementById('emergencyLocation').value.trim() : '';
      const urgency = document.getElementById('emergencyUrgency') ? document.getElementById('emergencyUrgency').value : '';

      if (!details || !nic || !phone || !district || !location) {
        emergencyStatus.textContent = 'Please fill in complaint details, NIC, phone, district and location.';
        return;
      }

      // Build form data similar to the regular complaint submission
      const formData = new FormData();
      formData.append('title', 'Emergency Report');
      formData.append('category', 'Emergency');
      formData.append('district', district);
      formData.append('incidentDate', new Date().toISOString());
      formData.append('incidentTime', new Date().toTimeString().split(' ')[0]);
      formData.append('location', location);
      formData.append('description', details + '\n\nContact NIC: ' + nic + '\nPhone: ' + phone + (urgency ? ('\nUrgency: ' + urgency) : ''));

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      emergencyStatus.textContent = 'Submitting emergency report...';

      fetch('http://localhost:5000/api/complaints/submit', {
        method: 'POST',
        headers: headers,
        body: formData
      })
      .then(res => res.json().then(body => ({ status: res.status, body })))
      .then(res => {
        if (res.status === 201) {
          emergencyStatus.textContent = 'Emergency report submitted. Our team will contact you shortly.';
          emergencyForm.reset();
          setTimeout(() => emergencyModal.hide(), 1200);
        } else {
          emergencyStatus.textContent = 'Submission failed: ' + (res.body.message || 'Server error');
        }
      })
      .catch(err => {
        console.error(err);
        emergencyStatus.textContent = 'Server error. Make sure backend is running.';
      });
    });
  }
}
