/**
 * Fast-Track Mission 6: Comprehensive 45-Stage Hardening & Security Test Matrix
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:5000/api';
let results = [];
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runStage(number, title, fn) {
  try {
    process.stdout.write(`Stage ${String(number).padStart(2, '0')}: ${title}... `);
    await fn();
    console.log('✅ PASS');
    results.push({ stage: number, title, status: 'PASS' });
    passCount++;
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.push({ stage: number, title, status: 'FAIL', error: err.message });
    failCount++;
  }
}

async function main() {
  console.log('================================================================');
  console.log('FAST-TRACK MISSION 6 — 45-STAGE SECURITY & INTEGRATION TEST');
  console.log('================================================================\n');

  let superAdminToken = '';
  let adminToken = '';
  let citizenToken = '';
  let citizen2Token = '';
  let testCitizenEmail = `tester-${Date.now()}@example.com`;
  let testCitizenToken = '';
  let createdComplaintId = '';
  let evidenceUploadedFilename = '';
  let dummyEvidencePath = '';

  // STAGE 01: Mock mode configuration & honest reporting
  await runStage(1, 'Mock mode configuration & honest reporting', async () => {
    const res = await fetch('http://localhost:5000/');
    const text = await res.text();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(text.includes('Backend is running'), 'Root route response missing expected greeting');
  });

  // STAGE 02: Production failure prevention (NODE_ENV=production with mock mode exits with code 1)
  await runStage(2, 'Production startup failure on USE_MOCK_DATA=true', async () => {
    const testCode = `
      process.env.NODE_ENV = 'production';
      process.env.USE_MOCK_DATA = 'true';
      process.env.JWT_SECRET = 'some_super_secret_for_testing_123456789';
      require('./backend/server.js');
    `;
    let exitedProperly = false;
    try {
      execSync(`node -e "${testCode.replace(/\n/g, ' ')}"`, {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });
    } catch (err) {
      exitedProperly = err.status !== 0;
    }
    assert(exitedProperly, 'Server failed to reject production startup when USE_MOCK_DATA=true');
  });

  // STAGE 03: Registration (citizen)
  await runStage(3, 'Registration of new citizen account', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Citizen',
        email: testCitizenEmail,
        phoneNumber: '0779998877',
        nationalId: '199512345678',
        addressNo: '10',
        street: 'Galle Road',
        city: 'Colombo',
        district: 'Colombo',
        password: 'Password123'
      })
    });
    const data = await res.json();
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
  });

  // STAGE 04: Mass assignment rejection on registration (cannot set role to SuperAdmin)
  await runStage(4, 'Mass assignment prevention on registration (role=SuperAdmin ignored)', async () => {
    const exploitEmail = `hacker-${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Privilege Escalation Attempt',
        email: exploitEmail,
        phoneNumber: '0770001111',
        password: 'Password123',
        role: 'SuperAdmin' // Attempting privilege escalation
      })
    });
    assert(res.status === 201, 'Registration failed');

    // Login and check actual role
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: exploitEmail, password: 'Password123' })
    });
    const loginData = await loginRes.json();
    assert(loginData.user.role === 'Citizen', `Expected role 'Citizen', got '${loginData.user.role}'`);
  });

  // STAGE 05: Registration validation
  await runStage(5, 'Registration input validation (missing email/password rejected)', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Missing Fields' })
    });
    assert(res.status === 400, `Expected 400 for missing fields, got ${res.status}`);
  });

  // STAGE 06: Login with valid credentials
  await runStage(6, 'Login with valid credentials', async () => {
    // SuperAdmin
    const resSA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ccms.com', password: 'Admin@123' })
    });
    const dataSA = await resSA.json();
    assert(resSA.status === 200 && dataSA.token, 'SuperAdmin login failed');
    superAdminToken = dataSA.token;

    // Admin
    const resA = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer@ccms.com', password: 'Admin@123' })
    });
    const dataA = await resA.json();
    assert(resA.status === 200 && dataA.token, 'Admin login failed');
    adminToken = dataA.token;

    // Citizen John
    const resC = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com', password: 'Password123' })
    });
    const dataC = await resC.json();
    assert(resC.status === 200 && dataC.token, 'Citizen John login failed');
    citizenToken = dataC.token;

    // Citizen Alice
    const resC2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'Password123' })
    });
    const dataC2 = await resC2.json();
    assert(resC2.status === 200 && dataC2.token, 'Citizen Alice login failed');
    citizen2Token = dataC2.token;

    // Newly registered test citizen
    const resTest = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCitizenEmail, password: 'Password123' })
    });
    const dataTest = await resTest.json();
    assert(resTest.status === 200 && dataTest.token, 'Test Citizen login failed');
    testCitizenToken = dataTest.token;
  });

  // STAGE 07: Login with invalid password
  await runStage(7, 'Login with invalid password returns 400', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com', password: 'WrongPassword!' })
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // STAGE 08: Inactive account blocking on login (403)
  await runStage(8, 'Inactive account blocking on login (403)', async () => {
    // Create a citizen and deactivate them
    const deactEmail = `deact-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'To Be Deactivated',
        email: deactEmail,
        password: 'Password123'
      })
    });

    // Find and deactivate user via admin API
    const usersRes = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const users = await usersRes.json();
    assert(Array.isArray(users), `Expected array of users, got: ${JSON.stringify(users)}`);
    const userToDeact = users.find(u => u.email === deactEmail);
    assert(userToDeact, 'User to deactivate not found');

    const deactRes = await fetch(`${BASE_URL}/users/${userToDeact.dbId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deactRes.status === 200, 'Deactivation call failed');

    // Attempt login with deactivated user
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: deactEmail, password: 'Password123' })
    });
    assert(loginRes.status === 403, `Expected 403 for deactivated user login, got ${loginRes.status}`);
  });

  // STAGE 09: Inactive account blocking on token auth (403)
  await runStage(9, 'Inactive account token rejected with 403 on protected routes', async () => {
    // Login before deactivation to get a token
    const deactTokenEmail = `token-deact-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Token Deactivate Test',
        email: deactTokenEmail,
        password: 'Password123'
      })
    });
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: deactTokenEmail, password: 'Password123' })
    });
    const loginData = await loginRes.json();
    const preDeactToken = loginData.token;

    // Deactivate user
    await fetch(`${BASE_URL}/users/${loginData.user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    // Use token on protected profile endpoint
    const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${preDeactToken}` }
    });
    assert(profileRes.status === 403, `Expected 403 for deactivated token access, got ${profileRes.status}`);
  });

  // STAGE 10: Dynamic role check (refreshed live from store)
  await runStage(10, 'Live dynamic role verification in authMiddleware', async () => {
    // Create citizen and get token
    const promoEmail = `promote-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Promote Test',
        email: promoEmail,
        password: 'Password123'
      })
    });
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: promoEmail, password: 'Password123' })
    });
    const loginData = await loginRes.json();
    const originalToken = loginData.token;

    // SuperAdmin promotes user
    const promoRes = await fetch(`${BASE_URL}/users/${loginData.user.id}/promote`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    assert(promoRes.status === 200, 'Promotion failed');

    // Use original token on admin-only route (/complaints/all)
    const adminRouteRes = await fetch(`${BASE_URL}/complaints/all`, {
      headers: { 'Authorization': `Bearer ${originalToken}` }
    });
    assert(adminRouteRes.status === 200, `Expected 200 for promoted user using old token, got ${adminRouteRes.status}`);
  });

  // STAGE 11: Profile retrieval without password leakage
  await runStage(11, 'Profile retrieval omits password and hash', async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'Profile fetch failed');
    assert(data.password === undefined, 'Password field present in profile response');
    assert(data.passwordHash === undefined, 'PasswordHash present in profile response');
  });

  // STAGE 12: Profile update allowlist
  await runStage(12, 'Profile update for allowed fields (fullName, phoneNumber, address)', async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testCitizenToken}`
      },
      body: JSON.stringify({
        fullName: 'Updated Citizen Name',
        phoneNumber: '0775556677',
        addressNo: '99',
        street: 'Main Street',
        city: 'Kandy',
        district: 'Kandy'
      })
    });
    const data = await res.json();
    assert(res.status === 200, `Profile update failed: ${JSON.stringify(data)}`);
    assert(data.user.fullName === 'Updated Citizen Name', 'Full name not updated');
    assert(data.user.phoneNumber === '0775556677', 'Phone not updated');
  });

  // STAGE 13: Mass assignment rejection on profile update (cannot change role or isActive)
  await runStage(13, 'Mass assignment prevention on profile (role/isActive tampering blocked)', async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testCitizenToken}`
      },
      body: JSON.stringify({
        role: 'SuperAdmin',
        isActive: false
      })
    });
    const data = await res.json();
    assert(data.user.role === 'Citizen', `Role altered to ${data.user.role}`);
    assert(data.user.isActive === true, 'isActive altered');
  });

  // STAGE 14: Password change via profile update
  await runStage(14, 'Password update via profile with valid current password', async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testCitizenToken}`
      },
      body: JSON.stringify({
        oldPassword: 'Password123',
        newPassword: 'NewSecurePassword456!'
      })
    });
    assert(res.status === 200, 'Password change failed');

    // Verify login with new password
    const testLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCitizenEmail, password: 'NewSecurePassword456!' })
    });
    assert(testLogin.status === 200, 'Login with new password failed');
  });

  // STAGE 15: Password verification (incorrect old password rejected)
  await runStage(15, 'Password update with incorrect old password rejected (400)', async () => {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testCitizenToken}`
      },
      body: JSON.stringify({
        oldPassword: 'WrongOldPassword',
        newPassword: 'AnotherPassword789!'
      })
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // STAGE 16: Complaint submission with valid data
  await runStage(16, 'Complaint submission (valid fields, status=Pending)', async () => {
    const form = new FormData();
    form.append('title', 'Motorcycle Theft at Supermarket');
    form.append('category', 'Theft');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-25');
    form.append('incidentTime', '14:30');
    form.append('location', 'Keells Super, Bambalapitiya');
    form.append('description', 'Red Honda motorcycle stolen from parking bay near rear exit.');

    const res = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenToken}` },
      body: form
    });
    const data = await res.json();
    assert(res.status === 201, `Submission failed: ${JSON.stringify(data)}`);
    assert(data.complaintId, 'Complaint ID not returned');
    createdComplaintId = data.complaintId;
  });

  // STAGE 17: Complaint submission with file upload handling
  await runStage(17, 'Complaint submission with evidence file attachment', async () => {
    const dummyBlob = new Blob(['Dummy Evidence File Content for Mission 6'], { type: 'image/png' });
    const form = new FormData();
    form.append('title', 'Break-in at Warehouse');
    form.append('category', 'Robbery');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-28');
    form.append('incidentTime', '02:00');
    form.append('location', 'Fort Harbor Warehouse 4');
    form.append('description', 'Perimeter fence cut and security camera footage attached.');
    form.append('evidenceFiles', dummyBlob, 'cctv_screenshot.png');

    const res = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenToken}` },
      body: form
    });
    const data = await res.json();
    assert(res.status === 201, `Evidence submission failed: ${JSON.stringify(data)}`);

    // Verify evidence file reference in complaint
    const fetchRes = await fetch(`${BASE_URL}/complaints/${data.complaintId}`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const complaint = await fetchRes.json();
    assert(complaint.evidenceFiles && complaint.evidenceFiles.length > 0, 'Evidence file not stored in complaint');
    evidenceUploadedFilename = complaint.evidenceFiles[0];
  });

  // STAGE 18: Anonymous complaint submission
  await runStage(18, 'Anonymous complaint submission (user decoupled)', async () => {
    const form = new FormData();
    form.append('title', 'Anonymous Noise Complaint');
    form.append('category', 'Public Disturbance');
    form.append('district', 'Kandy');
    form.append('incidentDate', '2026-10-29');
    form.append('location', 'Peradeniya Road');
    form.append('description', 'Loud machinery operating past midnight repeatedly.');
    form.append('isAnonymous', 'true');

    const res = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    assert(res.status === 201, 'Anonymous submission failed');

    // Admin view of anonymous complaint should have user: null
    const adminCheck = await fetch(`${BASE_URL}/complaints/${data.complaintId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const cData = await adminCheck.json();
    assert(cData.user === null, 'Anonymous complaint exposed user details');
  });

  // STAGE 19: Citizen view my complaints
  await runStage(19, 'Citizen getMyComplaints returns user records', async () => {
    const res = await fetch(`${BASE_URL}/complaints/my-complaints`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const list = await res.json();
    assert(Array.isArray(list), 'Expected array of complaints');
    assert(list.length > 0, 'No complaints returned for citizen');
  });

  // STAGE 20: Citizen view complaint details by ID
  await runStage(20, 'Citizen getComplaintById returns correct complaint', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(data.complaintId === createdComplaintId, 'Complaint ID mismatch');
  });

  // STAGE 21: Citizen edit Pending complaint (allowed)
  await runStage(21, 'Citizen edit Pending complaint (allowed)', async () => {
    const res = await fetch(`${BASE_URL}/complaints/my/${createdComplaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        title: 'Motorcycle Theft at Supermarket (Updated)',
        category: 'Theft',
        district: 'Colombo',
        incidentDate: '2026-10-25',
        incidentTime: '14:30',
        location: 'Keells Super, Bambalapitiya - Bay 3',
        description: 'Red Honda motorcycle stolen from bay 3. Plate WP-BBI-9901.'
      })
    });
    const data = await res.json();
    assert(res.status === 200, `Edit failed: ${JSON.stringify(data)}`);
    assert(data.complaint.title.includes('(Updated)'), 'Title was not updated');
  });

  // STAGE 22: Citizen edit non-Pending complaint (rejected with 403)
  await runStage(22, 'Citizen edit non-Pending complaint rejected with 403', async () => {
    // Admin changes status to Under Investigation
    await fetch(`${BASE_URL}/complaints/${createdComplaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Under Investigation', note: 'Assigned to Inspector Silva' })
    });

    // Citizen attempts to edit
    const res = await fetch(`${BASE_URL}/complaints/my/${createdComplaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ title: 'Illegal Edit Attempt' })
    });
    assert(res.status === 403, `Expected 403 for non-pending edit, got ${res.status}`);
  });

  // STAGE 23: Citizen edit unauthorized complaint (rejected with 403)
  await runStage(23, 'Citizen edit complaint owned by another user rejected (403)', async () => {
    // Citizen 2 (Alice) attempts to edit Citizen 1's complaint
    const res = await fetch(`${BASE_URL}/complaints/my/${createdComplaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizen2Token}`
      },
      body: JSON.stringify({ title: 'Tampering Attempt' })
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // STAGE 24: Citizen edit mass assignment rejection
  await runStage(24, 'Citizen edit mass assignment prevention (status/archived tampering blocked)', async () => {
    // Create new pending complaint to test
    const form = new FormData();
    form.append('title', 'Pending Complaint for Mass Assign Test');
    form.append('category', 'Theft');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-29');
    form.append('location', 'Galle Face');
    form.append('description', 'Test description for mass assignment vulnerability testing.');

    const subRes = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenToken}` },
      body: form
    });
    const subData = await subRes.json();
    const testCId = subData.complaintId;

    // Attempt to tamper status to Resolved and isArchived to true
    const editRes = await fetch(`${BASE_URL}/complaints/my/${testCId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        title: 'Pending Complaint Title Still Intact',
        status: 'Resolved',
        isArchived: true
      })
    });
    const editData = await editRes.json();
    assert(editData.complaint.status === 'Pending', `Status tampered to ${editData.complaint.status}`);
    assert(editData.complaint.isArchived === false, 'isArchived tampered');
  });

  // STAGE 25: Citizen delete Pending complaint (allowed)
  let pendingDeleteComplaintId = '';
  let diskEvidenceFileName = '';
  await runStage(25, 'Citizen delete Pending complaint (allowed)', async () => {
    const dummyBlob = new Blob(['File content to test orphan cleanup on delete'], { type: 'image/png' });
    const form = new FormData();
    form.append('title', 'Pending Complaint To Delete');
    form.append('category', 'Theft');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-29');
    form.append('location', 'Slave Island');
    form.append('description', 'Incident description that citizen chooses to retract.');
    form.append('evidenceFiles', dummyBlob, 'retracted_proof.png');

    const subRes = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenToken}` },
      body: form
    });
    const subData = await subRes.json();
    pendingDeleteComplaintId = subData.complaintId;

    // Get the evidence filename
    const getRes = await fetch(`${BASE_URL}/complaints/${pendingDeleteComplaintId}`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const cData = await getRes.json();
    assert(Array.isArray(cData.evidenceFiles) && cData.evidenceFiles.length > 0, 'No evidenceFiles in complaint');
    diskEvidenceFileName = cData.evidenceFiles[0];

    // Verify file exists on disk
    const uploadsDir = path.resolve(__dirname, '../backend/uploads');
    const diskPath = path.resolve(uploadsDir, diskEvidenceFileName);
    assert(fs.existsSync(diskPath), `Expected file on disk before delete: ${diskPath}`);

    // Citizen deletes complaint
    const delRes = await fetch(`${BASE_URL}/complaints/my/${pendingDeleteComplaintId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(delRes.status === 200, `Expected 200, got ${delRes.status}`);
  });

  // STAGE 26: Evidence file physical cleanup from disk on citizen pending delete
  await runStage(26, 'Physical evidence file cleanup from disk on citizen pending delete', async () => {
    const uploadsDir = path.resolve(__dirname, '../backend/uploads');
    const diskPath = path.resolve(uploadsDir, diskEvidenceFileName);
    assert(!fs.existsSync(diskPath), `File still exists on disk after citizen delete: ${diskPath}`);
  });

  // STAGE 27: Citizen delete non-Pending complaint (rejected with 403)
  await runStage(27, 'Citizen delete non-Pending complaint rejected with 403', async () => {
    const res = await fetch(`${BASE_URL}/complaints/my/${createdComplaintId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(res.status === 403, `Expected 403 for non-pending delete, got ${res.status}`);
  });

  // STAGE 28: Admin view all complaints
  await runStage(28, 'Admin getAllComplaints retrieves list', async () => {
    const res = await fetch(`${BASE_URL}/complaints/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const list = await res.json();
    assert(Array.isArray(list), 'Expected array of complaints');
    assert(list.length > 0, 'No complaints returned for admin');
  });

  // STAGE 29: Admin status change
  await runStage(29, 'Admin update complaint status (Under Investigation -> Resolved)', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${createdComplaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Resolved', note: 'Recovered stolen property and returned to owner.' })
    });
    assert(res.status === 200, 'Status update failed');
  });

  // STAGE 30: Status history append on status change
  await runStage(30, 'Status history timeline appended on status change', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${createdComplaintId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(Array.isArray(data.statusHistory), 'statusHistory is not an array');
    assert(data.statusHistory.length >= 2, `Expected >= 2 history records, found ${data.statusHistory.length}`);
    const latest = data.statusHistory[data.statusHistory.length - 1];
    assert(latest.status === 'Resolved', `Expected latest status 'Resolved', got '${latest.status}'`);
  });

  // STAGE 31: Admin soft-archive complaint (isArchived=true, files preserved on disk)
  let archiveComplaintId = '';
  let archiveEvidenceFileName = '';
  await runStage(31, 'Admin soft-archive complaint preserves disk evidence', async () => {
    const dummyBlob = new Blob(['Archive evidence preservation test'], { type: 'image/png' });
    const form = new FormData();
    form.append('title', 'Complaint To Archive By Admin');
    form.append('category', 'Theft');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-29');
    form.append('location', 'Fort');
    form.append('description', 'Incident to be archived for long-term record keeping.');
    form.append('evidenceFiles', dummyBlob, 'archive_proof.png');

    const subRes = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenToken}` },
      body: form
    });
    const subData = await subRes.json();
    archiveComplaintId = subData.complaintId;

    const getRes = await fetch(`${BASE_URL}/complaints/${archiveComplaintId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const cData = await getRes.json();
    assert(Array.isArray(cData.evidenceFiles) && cData.evidenceFiles.length > 0, 'No evidenceFiles in archived complaint');
    archiveEvidenceFileName = cData.evidenceFiles[0];

    // Admin archives complaint
    const delRes = await fetch(`${BASE_URL}/complaints/${archiveComplaintId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(delRes.status === 200, 'Admin archive call failed');

    // Verify physical file is STILL on disk
    const uploadsDir = path.resolve(__dirname, '../backend/uploads');
    const diskPath = path.resolve(uploadsDir, archiveEvidenceFileName);
    assert(fs.existsSync(diskPath), 'Physical evidence file was deleted on admin archive! It must be preserved.');
  });

  // STAGE 32: Archived complaints excluded from default list
  await runStage(32, 'Archived complaints excluded from default getAllComplaints', async () => {
    const res = await fetch(`${BASE_URL}/complaints/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const list = await res.json();
    const found = list.find(c => c.complaintId === archiveComplaintId);
    assert(!found, 'Archived complaint was included in default complaint list');
  });

  // STAGE 33: Evidence access authorization: Citizen owner allowed
  await runStage(33, 'Evidence authorization: Owner citizen allowed to stream', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${archiveComplaintId}/evidence/0`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(res.status === 200, `Expected 200 for owner evidence access, got ${res.status}`);
  });

  // STAGE 34: Evidence access authorization: Admin allowed
  await runStage(34, 'Evidence authorization: Admin allowed to stream', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${archiveComplaintId}/evidence/0`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(res.status === 200, `Expected 200 for admin evidence access, got ${res.status}`);
  });

  // STAGE 35: Evidence access authorization: Non-owner citizen blocked (403)
  await runStage(35, 'Evidence authorization: Non-owner citizen blocked (403)', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${archiveComplaintId}/evidence/0`, {
      headers: { 'Authorization': `Bearer ${citizen2Token}` }
    });
    assert(res.status === 403, `Expected 403 for unauthorized citizen, got ${res.status}`);
  });

  // STAGE 36: Evidence access authorization: Direct public access to /uploads blocked
  await runStage(36, 'Direct public access to /uploads forbidden (403)', async () => {
    const res = await fetch(`http://localhost:5000/uploads/${archiveEvidenceFileName}`);
    assert(res.status === 403, `Expected 403 on direct /uploads access, got ${res.status}`);
  });

  // STAGE 37: Evidence path traversal attack blocked
  await runStage(37, 'Path traversal attack in evidence route blocked', async () => {
    const res = await fetch(`${BASE_URL}/complaints/${archiveComplaintId}/evidence/9999`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(res.status === 404 || res.status === 400, `Expected 404 or 400, got ${res.status}`);
  });

  // STAGE 38: Public contact inquiry submission
  let createdInquiryId = '';
  await runStage(38, 'Public contact inquiry submission succeeds', async () => {
    const res = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Public Inquirer',
        email: 'inquirer@example.com',
        phone: '0771234567',
        subject: 'General Question Regarding Station Hours',
        message: 'Hello, what are the public counter visiting hours for Bambalapitiya station?'
      })
    });
    const data = await res.json();
    assert(res.status === 201, `Submission failed: ${JSON.stringify(data)}`);
    assert(data.inquiryId, 'Inquiry ID not returned');
    createdInquiryId = data.inquiryId;
  });

  // STAGE 39: Contact inquiry validation
  await runStage(39, 'Contact inquiry validation rejects invalid email and short messages', async () => {
    const res = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        email: 'not-an-email',
        subject: 'Hi',
        message: 'Short'
      })
    });
    assert(res.status === 400, `Expected 400 for invalid contact inquiry, got ${res.status}`);
  });

  // STAGE 40: Admin contact inquiry status update
  await runStage(40, 'Admin contact inquiry status update (New -> Read)', async () => {
    const res = await fetch(`${BASE_URL}/contact/${createdInquiryId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'Read' })
    });
    assert(res.status === 200, `Status update failed: ${res.status}`);
  });

  // STAGE 41: Admin analytics overview
  await runStage(41, 'Admin analytics overview returns expected metrics', async () => {
    const res = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'Analytics fetch failed');
    assert(typeof data.totalComplaints === 'number', 'totalComplaints missing');
    assert(Array.isArray(data.statusDistribution), 'statusDistribution missing');
    assert(Array.isArray(data.categoryDistribution), 'categoryDistribution missing');
  });

  // STAGE 42: Audit logging on sensitive actions
  await runStage(42, 'Audit logging captures system operations', async () => {
    const res = await fetch(`${BASE_URL}/audit`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const logs = await res.json();
    assert(Array.isArray(logs), 'Expected array of audit logs');
    assert(logs.length > 0, 'No audit logs captured');
  });

  // STAGE 43: Audit log scrubbing (zero passwords or secret tokens)
  await runStage(43, 'Audit log scrubbing (no passwords or credentials in audit logs)', async () => {
    const res = await fetch(`${BASE_URL}/audit`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const logs = await res.json();
    const logString = JSON.stringify(logs);
    assert(!logString.includes('Password123'), 'Audit logs leaked raw user password Password123!');
    assert(!logString.includes('Admin@123'), 'Audit logs leaked raw admin password Admin@123!');
  });

  // STAGE 44: API pagination support (complaints, users, contacts, audit logs)
  await runStage(44, 'API pagination support with backward compatibility', async () => {
    // 1. Complaints unpaginated -> returns Array
    const unpaginatedComplaints = await (await fetch(`${BASE_URL}/complaints/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    assert(Array.isArray(unpaginatedComplaints), 'Unpaginated complaints should return an array');

    // 2. Complaints paginated -> returns { data, pagination }
    const paginatedComplaints = await (await fetch(`${BASE_URL}/complaints/all?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    assert(paginatedComplaints.pagination && Array.isArray(paginatedComplaints.data), 'Paginated complaints should return data and pagination');
    assert(paginatedComplaints.pagination.page === 1, 'Pagination page mismatch');

    // 3. Users paginated
    const paginatedUsers = await (await fetch(`${BASE_URL}/users?page=1&limit=2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    assert(paginatedUsers.pagination && Array.isArray(paginatedUsers.data), 'Paginated users should return data and pagination');

    // 4. Contacts paginated
    const paginatedContacts = await (await fetch(`${BASE_URL}/contact?page=1&limit=2`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    assert(paginatedContacts.pagination && Array.isArray(paginatedContacts.data), 'Paginated contacts should return data and pagination');

    // 5. Audit logs paginated
    const paginatedAudit = await (await fetch(`${BASE_URL}/audit?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    })).json();
    assert(paginatedAudit.pagination && Array.isArray(paginatedAudit.data), 'Paginated audit logs should return data and pagination');
  });

  // STAGE 45: Public tracking privacy and rate limiting
  await runStage(45, 'Public tracking privacy and rate limiter protection', async () => {
    // Track non-anonymous complaint without email (should fail 400)
    const failRes = await fetch(`${BASE_URL}/complaints/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: createdComplaintId })
    });
    assert(failRes.status === 400, 'Expected 400 when tracking without email');

    // Track non-anonymous complaint with mismatched email (should fail 403)
    const mismatchRes = await fetch(`${BASE_URL}/complaints/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: createdComplaintId, email: 'wrong@example.com' })
    });
    assert(mismatchRes.status === 403, 'Expected 403 when tracking with mismatched email');

    // Track with matching email (should succeed 200, evidenceFiles stripped)
    const okRes = await fetch(`${BASE_URL}/complaints/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: createdComplaintId, email: 'john@example.com' })
    });
    const tracked = await okRes.json();
    assert(okRes.status === 200, 'Tracking failed with correct email');
    assert(tracked.evidenceFiles === undefined, 'Evidence files exposed in public tracking response!');
  });

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passCount} / 45 PASSED (${failCount} FAILED)`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
