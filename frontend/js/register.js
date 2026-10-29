/* ============================================================
   Crime Complaint Management System - Register Validation Logic
   Author: Student Project
   Description: Password visibility toggle, live password strength
                meter, and client-side form validation.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordStrengthBar = document.getElementById('passwordStrengthBar');
  const passwordStrengthText = document.getElementById('passwordStrengthText');
  const confirmPasswordFeedback = document.getElementById('confirmPasswordFeedback');

  // ----------------------------------------------------------
  // 1. SHOW/HIDE PASSWORD TOGGLE
  // ----------------------------------------------------------
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const inputField = document.getElementById(targetId);
      const icon = this.querySelector('i');

      if (inputField.type === 'password') {
        inputField.type = 'text';
        icon.classList.remove('bi-eye-slash-fill');
        icon.classList.add('bi-eye-fill');
      } else {
        inputField.type = 'password';
        icon.classList.remove('bi-eye-fill');
        icon.classList.add('bi-eye-slash-fill');
      }
    });
  });

  // ----------------------------------------------------------
  // 2. LIVE PASSWORD STRENGTH METER
  // ----------------------------------------------------------
  passwordInput.addEventListener('input', function () {
    const val = passwordInput.value;
    let strength = 0;
    
    if (val.length === 0) {
      updateStrengthMeter(0, 'Too Weak', 'bg-danger');
      return;
    }

    // Criteria 1: Length
    if (val.length >= 6) strength += 20;
    if (val.length >= 10) strength += 20;

    // Criteria 2: Contains numbers
    if (/[0-9]/.test(val)) strength += 20;

    // Criteria 3: Contains mixed case (lower & upper)
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) strength += 20;

    // Criteria 4: Contains special characters
    if (/[^a-zA-Z0-9]/.test(val)) strength += 20;

    // Update Bar UI based on score
    if (strength <= 20) {
      updateStrengthMeter(20, 'Too Weak', 'bg-danger');
    } else if (strength <= 60) {
      updateStrengthMeter(60, 'Medium', 'bg-warning');
    } else {
      updateStrengthMeter(100, 'Strong', 'bg-success');
    }

    // Call confirm password check on keypress to keep in sync
    checkPasswordsMatch();
  });

  function updateStrengthMeter(width, text, bgClass) {
    passwordStrengthBar.style.width = width + '%';
    // Reset all colors
    passwordStrengthBar.className = 'progress-bar ' + bgClass;
    passwordStrengthText.textContent = 'Password Strength: ' + text;
  }

  // ----------------------------------------------------------
  // 3. PASSWORDS MATCH VALIDATION
  // ----------------------------------------------------------
  function checkPasswordsMatch() {
    const pass = passwordInput.value;
    const confirmPass = confirmPasswordInput.value;

    if (confirmPass.length === 0) {
      confirmPasswordInput.setCustomValidity('Please confirm your password.');
      confirmPasswordFeedback.textContent = 'Please confirm your password.';
      return false;
    }

    if (pass !== confirmPass) {
      // Set Custom Validity so browser knows it's invalid
      confirmPasswordInput.setCustomValidity('Passwords do not match.');
      confirmPasswordFeedback.textContent = 'Passwords do not match.';
      confirmPasswordInput.classList.add('is-invalid');
      confirmPasswordInput.classList.remove('is-valid');
      return false;
    } else {
      // Clear Custom Validity
      confirmPasswordInput.setCustomValidity('');
      confirmPasswordInput.classList.remove('is-invalid');
      confirmPasswordInput.classList.add('is-valid');
      return true;
    }
  }

  confirmPasswordInput.addEventListener('input', checkPasswordsMatch);

  // ----------------------------------------------------------
  // 4. FORM SUBMISSION VALIDATION
  // ----------------------------------------------------------
  registerForm.addEventListener('submit', function (event) {
    // Perform standard HTML5 validity checks and custom password match checks
    const matches = checkPasswordsMatch();
    const isValid = registerForm.checkValidity();

    if (!isValid || !matches) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      
      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('emailAddress').value;
      const phoneNumber = document.getElementById('phoneNumber').value;
      const nationalId = document.getElementById('nationalId').value;
      const addressNo = document.getElementById('addressNo').value;
      const street = document.getElementById('street').value;
      const city = document.getElementById('city').value;
      const district = document.getElementById('district').value;
      const password = passwordInput.value;

      fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phoneNumber, nationalId, addressNo, street, city, district, password, role: 'Citizen' })
      })
      .then(response => response.json().then(data => ({ status: response.status, body: data })))
      .then(res => {
        if (res.status === 201) {
          alert('Registration successful! Redirecting to login page...');
          window.location.href = 'login.html';
        } else {
          alert('Registration failed: ' + (res.body.message || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Server error. Make sure the backend is running.');
      });
    }

    // Add Bootstrap validation styling class
    registerForm.classList.add('was-validated');
  }, false);
});
