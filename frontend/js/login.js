/* ============================================================
   Crime Complaint Management System - Login Validation Logic
   Author: Student Project
   Description: Password visibility toggle and form validation.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');

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
  // 2. FORM SUBMISSION VALIDATION
  // ----------------------------------------------------------
  loginForm.addEventListener('submit', function (event) {
    const errorDiv = document.getElementById('loginErrorMsg');
    if (errorDiv) errorDiv.classList.add('d-none'); // Hide previous error

    const isValid = loginForm.checkValidity();

    if (!isValid) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const role = document.getElementById('loginRole').value;

      fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })
      .then(response => response.json().then(data => ({ status: response.status, body: data })))
      .then(res => {
        if (res.status === 200) {
          localStorage.setItem('token', res.body.token);
          localStorage.setItem('user', JSON.stringify(res.body.user));
          if (res.body.user.role === 'Admin') {
            window.location.href = 'admin_dashboard.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        } else {
          if (errorDiv) {
            errorDiv.textContent = 'Email or Password is wrong';
            errorDiv.classList.remove('d-none');
          } else {
            alert('Email or Password is wrong');
          }
        }
      })
      .catch(err => {
        console.error(err);
        alert('Server error. Make sure the backend is running.');
      });
    }

    loginForm.classList.add('was-validated');
  }, false);
});
