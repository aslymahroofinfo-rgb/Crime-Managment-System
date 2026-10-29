document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');
  const adminDataString = localStorage.getItem('user');

  if (!token || !adminDataString) {
    window.location.href = '../login.html';
    return;
  }

  let adminData = null;
  try {
    adminData = JSON.parse(adminDataString);
  } catch (e) {
    console.error('Invalid user data in local storage', e);
  }

  // Populate form with current data
  const nameInput = document.getElementById('adminFullName');
  const phoneInput = document.getElementById('adminPhone');
  
  if (adminData && adminData.fullName) {
    nameInput.value = adminData.fullName;
  }
  if (adminData && adminData.phoneNumber) {
    phoneInput.value = adminData.phoneNumber;
  }

  const credentialsForm = document.getElementById('credentialsForm');
  const errorMsg = document.getElementById('settingsErrorMsg');
  const successMsg = document.getElementById('settingsSuccessMsg');

  if (credentialsForm) {
    credentialsForm.addEventListener('submit', function (e) {
      e.preventDefault();
      errorMsg.classList.add('d-none');
      successMsg.classList.add('d-none');

      const fullName = nameInput.value.trim();
      const phoneNumber = phoneInput.value.trim();
      const oldPassword = document.getElementById('adminOldPassword').value;
      const newPassword = document.getElementById('adminNewPassword').value;

      // Build payload
      const payload = { fullName, phoneNumber };
      
      // Only add password fields if user is trying to update it
      if (newPassword) {
        if (!oldPassword) {
          errorMsg.textContent = 'Current Password is required to set a new password.';
          errorMsg.classList.remove('d-none');
          return;
        }
        payload.oldPassword = oldPassword;
        payload.newPassword = newPassword;
      }

      fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update credentials.');
        return data;
      })
      .then(data => {
        successMsg.textContent = 'Credentials updated successfully!';
        successMsg.classList.remove('d-none');
        
        // Update local storage
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        // Clear password fields
        document.getElementById('adminOldPassword').value = '';
        document.getElementById('adminNewPassword').value = '';
      })
      .catch(err => {
        errorMsg.textContent = err.message;
        errorMsg.classList.remove('d-none');
      });
    });
  }
});
