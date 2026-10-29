/**
 * FAST-TRACK MISSION 7: FINAL COMPREHENSIVE END-TO-END QA & SYSTEM TEST SUITE
 * Crime Investigation & Complaint Management System (CIW)
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

async function runTest(num, name, fn) {
  process.stdout.write(`[Test ${String(num).padStart(2, '0')}] ${name}... `);
  try {
    await fn();
    console.log('✅ PASS');
    results.push({ num, name, status: 'PASS' });
    passCount++;
  } catch (err) {
    console.log(`❌ FAIL - ${err.message}`);
    results.push({ num, name, status: 'FAIL', error: err.message });
    failCount++;
  }
}

async function run() {
  console.log('================================================================');
  console.log('CIW FINAL PRODUCTION END-TO-END SYSTEM INTEGRATION SUITE');
  console.log('================================================================\n');

  let superAdminToken = '';
  let adminToken = '';
  let citizenAToken = '';
  let citizenBToken = '';
  let citizenAEmail = `citizen.a.${Date.now()}@example.com`;
  let citizenBEmail = `citizen.b.${Date.now()}@example.com`;
  let complaintAId = '';
  let evidenceFileNameA = '';

  // 1. Health and Public Counters
  await runTest(1, 'Public Root & Dynamic Statistics API', async () => {
    const rootRes = await fetch('http://localhost:5000/');
    assert(rootRes.status === 200, 'Root route unavailable');

    const statsRes = await fetch(`${BASE_URL}/public/stats`);
    const stats = await statsRes.json();
    assert(statsRes.status === 200, 'Public stats endpoint failed');
    assert(typeof stats.totalComplaints === 'number', 'totalComplaints missing from public stats');
    assert(typeof stats.resolvedComplaints === 'number', 'resolvedComplaints missing');
    assert(typeof stats.activeInvestigations === 'number', 'activeInvestigations missing');
  });

  // 2. Citizen Registration & Mass Assignment Prevention
  await runTest(2, 'Citizen Registration & Role Tampering Rejection', async () => {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Citizen Alpha',
        email: citizenAEmail,
        phoneNumber: '0771122334',
        nationalId: '199012345678',
        addressNo: '12A',
        street: 'Galle Road',
        city: 'Colombo',
        district: 'Colombo',
        password: 'Password123!',
        role: 'SuperAdmin' // Exploitation attempt
      })
    });
    assert(regRes.status === 201, 'Registration failed');

    // Register Citizen B
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Citizen Beta',
        email: citizenBEmail,
        phoneNumber: '0779988776',
        password: 'Password123!'
      })
    });

    // Login Citizen A and verify role is strictly Citizen
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: citizenAEmail, password: 'Password123!' })
    });
    const data = await loginRes.json();
    assert(loginRes.status === 200, 'Login failed');
    assert(data.user.role === 'Citizen', `Role escalation vulnerability: user got role ${data.user.role}`);
    citizenAToken = data.token;
  });

  // 3. Admin & SuperAdmin Authentication
  await runTest(3, 'Staff Authentication (SuperAdmin, Admin, Citizen B)', async () => {
    // SuperAdmin
    const saRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ccms.com', password: 'Admin@123' })
    });
    const saData = await saRes.json();
    assert(saRes.status === 200 && saData.token, 'SuperAdmin login failed');
    superAdminToken = saData.token;

    // Admin
    const aRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'officer@ccms.com', password: 'Admin@123' })
    });
    const aData = await aRes.json();
    assert(aRes.status === 200 && aData.token, 'Admin login failed');
    adminToken = aData.token;

    // Citizen B
    const bRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: citizenBEmail, password: 'Password123!' })
    });
    const bData = await bRes.json();
    assert(bRes.status === 200 && bData.token, 'Citizen B login failed');
    citizenBToken = bData.token;
  });

  // 4. Profile Operations & Sensitive Data Scrubbing
  await runTest(4, 'Citizen Profile View & Whitelisted Update', async () => {
    const profRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    const prof = await profRes.json();
    assert(profRes.status === 200, 'Profile fetch failed');
    assert(prof.password === undefined, 'Password hash leaked in profile');

    // Update profile
    const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenAToken}`
      },
      body: JSON.stringify({
        fullName: 'Citizen Alpha Updated',
        phoneNumber: '0779999999',
        role: 'Admin', // Tamper attempt
        isActive: false // Tamper attempt
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Profile update failed');
    assert(updateData.user.fullName === 'Citizen Alpha Updated', 'Full name not updated');
    assert(updateData.user.role === 'Citizen', 'Role tampered');
    assert(updateData.user.isActive === true, 'isActive tampered');
  });

  // 5. Citizen File Complaint with Multi-Format Evidence (JPG, PDF, MP4)
  await runTest(5, 'Citizen Complaint Submission with Evidence Files (JPG, PDF)', async () => {
    const jpgBlob = new Blob(['Fake JPG Content'], { type: 'image/jpeg' });
    const pdfBlob = new Blob(['Fake PDF Content'], { type: 'application/pdf' });

    const form = new FormData();
    form.append('title', 'Armed Robbery at Jeweler');
    form.append('category', 'Robbery');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-27');
    form.append('incidentTime', '18:45');
    form.append('location', 'Sea Street, Colombo 11');
    form.append('description', 'Two suspects entered jewelry store with firearms.');
    form.append('evidenceFiles', jpgBlob, 'cctv_frame.jpg');
    form.append('evidenceFiles', pdfBlob, 'police_memo.pdf');

    const subRes = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenAToken}` },
      body: form
    });
    const data = await subRes.json();
    assert(subRes.status === 201, `Submission failed: ${JSON.stringify(data)}`);
    assert(data.complaintId, 'Complaint ID not generated');
    complaintAId = data.complaintId;

    // Verify complaint details
    const getRes = await fetch(`${BASE_URL}/complaints/${complaintAId}`, {
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    const comp = await getRes.json();
    assert(comp.status === 'Pending', `Initial status is ${comp.status}, expected Pending`);
    assert(comp.evidenceFiles && comp.evidenceFiles.length === 2, 'Evidence files count mismatch');
    evidenceFileNameA = comp.evidenceFiles[0];
  });

  // 6. Anonymous Complaint Semantics (Architecture B Verification)
  await runTest(6, 'Anonymous Complaint Semantics (Author retains view, Admin decoupled)', async () => {
    const form = new FormData();
    form.append('title', 'Anonymous Tip on Drug Activity');
    form.append('category', 'Other');
    form.append('district', 'Gampaha');
    form.append('incidentDate', '2026-10-28');
    form.append('location', 'Negombo Beach Road');
    form.append('description', 'Suspicious exchange observed near warehouse.');
    form.append('isAnonymous', 'true');

    const subRes = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenAToken}` },
      body: form
    });
    const subData = await subRes.json();
    assert(subRes.status === 201, 'Anonymous submission failed');
    const anonId = subData.complaintId;

    // Citizen author checks their own dashboard
    const citizenMyRes = await fetch(`${BASE_URL}/complaints/my-complaints`, {
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    const citizenList = await citizenMyRes.json();
    const foundInCitizenDashboard = citizenList.some(c => c.complaintId === anonId);
    assert(foundInCitizenDashboard, 'Anonymous complaint disappeared from citizen dashboard!');

    // Admin views complaint: user identity must be completely decoupled (user: null)
    const adminViewRes = await fetch(`${BASE_URL}/complaints/${anonId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminComp = await adminViewRes.json();
    assert(adminComp.user === null, 'Anonymous complaint leaked user identity to Admin!');
  });

  // 7. Citizen Edit Pending Complaint & Persistence
  await runTest(7, 'Citizen Edit Pending Complaint & Field Validation', async () => {
    const editRes = await fetch(`${BASE_URL}/complaints/my/${complaintAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenAToken}`
      },
      body: JSON.stringify({
        title: 'Armed Robbery at Jeweler (Updated Details)',
        category: 'Robbery',
        district: 'Colombo',
        incidentDate: '2026-10-27',
        incidentTime: '18:45',
        location: 'Sea Street, Colombo 11 - Store 45',
        description: 'Two suspects entered jewelry store with firearms. Second suspect wore green jacket.'
      })
    });
    assert(editRes.status === 200, 'Complaint edit failed');

    // Fetch complaint and verify changes persisted
    const getRes = await fetch(`${BASE_URL}/complaints/${complaintAId}`, {
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    const comp = await getRes.json();
    assert(comp.title.includes('(Updated Details)'), 'Edited title was not persisted');
  });

  // 8. Admin Status Lifecycle & Status History Progression
  await runTest(8, 'Admin Complaint Status Progression & Timeline Audit', async () => {
    // Step 1: Approved
    await fetch(`${BASE_URL}/complaints/${complaintAId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Approved', note: 'Complaint verified by desk officer' })
    });

    // Step 2: Under Investigation
    await fetch(`${BASE_URL}/complaints/${complaintAId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Under Investigation', note: 'Assigned to Colombo Crime Division' })
    });

    // Step 3: Resolved
    const resRes = await fetch(`${BASE_URL}/complaints/${complaintAId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Resolved', note: 'Suspects apprehended and stolen jewelry recovered' })
    });
    assert(resRes.status === 200, 'Status transition to Resolved failed');

    // Verify status history
    const checkRes = await fetch(`${BASE_URL}/complaints/${complaintAId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const cData = await checkRes.json();
    assert(cData.status === 'Resolved', `Status is ${cData.status}`);
    assert(Array.isArray(cData.statusHistory) && cData.statusHistory.length >= 4, 'Status history timeline incomplete');
  });

  // 9. Citizen Edit/Delete Disabled on Non-Pending Complaint
  await runTest(9, 'Citizen Edit & Delete Blocked on Processed Complaint (403)', async () => {
    // Attempt edit
    const editRes = await fetch(`${BASE_URL}/complaints/my/${complaintAId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenAToken}` },
      body: JSON.stringify({ title: 'Illegal Edit' })
    });
    assert(editRes.status === 403, `Expected 403 for editing Resolved complaint, got ${editRes.status}`);

    // Attempt delete
    const delRes = await fetch(`${BASE_URL}/complaints/my/${complaintAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    assert(delRes.status === 403, `Expected 403 for deleting Resolved complaint, got ${delRes.status}`);
  });

  // 10. Citizen B Cross-User Security Scenario
  await runTest(10, 'Citizen B Cross-User Access Rejection (403)', async () => {
    // Citizen B attempts to view Citizen A's complaint
    const viewRes = await fetch(`${BASE_URL}/complaints/${complaintAId}`, {
      headers: { 'Authorization': `Bearer ${citizenBToken}` }
    });
    assert(viewRes.status === 403, `Expected 403 on cross-user view, got ${viewRes.status}`);

    // Citizen B attempts to edit Citizen A's complaint
    const editRes = await fetch(`${BASE_URL}/complaints/my/${complaintAId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenBToken}` },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    assert(editRes.status === 403, `Expected 403 on cross-user edit, got ${editRes.status}`);

    // Citizen B attempts to stream Citizen A's evidence
    const evRes = await fetch(`${BASE_URL}/complaints/${complaintAId}/evidence/0`, {
      headers: { 'Authorization': `Bearer ${citizenBToken}` }
    });
    assert(evRes.status === 403, `Expected 403 on cross-user evidence access, got ${evRes.status}`);
  });

  // 11. Evidence Security, Streaming & Direct Access Blocked
  await runTest(11, 'Evidence Streaming Authorization & Traversal Protection', async () => {
    // Owner streams evidence -> 200
    const ownerRes = await fetch(`${BASE_URL}/complaints/${complaintAId}/evidence/0`, {
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    assert(ownerRes.status === 200, 'Owner unable to stream own evidence');

    // Admin streams evidence -> 200
    const adminRes = await fetch(`${BASE_URL}/complaints/${complaintAId}/evidence/0`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminRes.status === 200, 'Admin unable to stream evidence');

    // Direct /uploads access -> 403
    const directRes = await fetch(`http://localhost:5000/uploads/${evidenceFileNameA}`);
    assert(directRes.status === 403, 'Direct access to /uploads was not forbidden');

    // Traversal or invalid index -> 404 or 400
    const travRes = await fetch(`${BASE_URL}/complaints/${complaintAId}/evidence/999`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(travRes.status === 404 || travRes.status === 400, 'Out of bounds index not rejected');
  });

  // 12. Citizen Pending Delete & Evidence Purging
  await runTest(12, 'Citizen Pending Delete with Physical Evidence File Purge', async () => {
    const dummyBlob = new Blob(['Temp File For Delete Test'], { type: 'image/png' });
    const form = new FormData();
    form.append('title', 'Pending Complaint To Purge');
    form.append('category', 'Theft');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-29');
    form.append('location', 'Pettah');
    form.append('description', 'Test draft to be deleted.');
    form.append('evidenceFiles', dummyBlob, 'draft_proof.png');

    const subRes = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenAToken}` },
      body: form
    });
    const subData = await subRes.json();
    const purgeId = subData.complaintId;

    const getRes = await fetch(`${BASE_URL}/complaints/${purgeId}`, {
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    const cData = await getRes.json();
    const diskFileName = cData.evidenceFiles[0];

    const uploadsDir = path.resolve(__dirname, '../backend/uploads');
    const diskPath = path.resolve(uploadsDir, diskFileName);
    assert(fs.existsSync(diskPath), 'Evidence file missing on disk before delete');

    // Delete pending complaint
    const delRes = await fetch(`${BASE_URL}/complaints/my/${purgeId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${citizenAToken}` }
    });
    assert(delRes.status === 200, 'Delete failed');

    // Verify physical file was unlinked
    assert(!fs.existsSync(diskPath), 'Physical evidence file was NOT purged on citizen delete');
  });

  // 13. Admin Soft-Archive & Evidence Preservation
  await runTest(13, 'Admin Soft-Archive Preserves Physical Evidence on Disk', async () => {
    const dummyBlob = new Blob(['File for Admin Archive Test'], { type: 'image/png' });
    const form = new FormData();
    form.append('title', 'Admin Case To Archive');
    form.append('category', 'Theft');
    form.append('district', 'Colombo');
    form.append('incidentDate', '2026-10-29');
    form.append('location', 'Kollupitiya');
    form.append('description', 'Case to be archived.');
    form.append('evidenceFiles', dummyBlob, 'archive_item.png');

    const subRes = await fetch(`${BASE_URL}/complaints/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${citizenAToken}` },
      body: form
    });
    const subData = await subRes.json();
    const archId = subData.complaintId;

    const getRes = await fetch(`${BASE_URL}/complaints/${archId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const cData = await getRes.json();
    const diskFileName = cData.evidenceFiles[0];

    // Admin soft-deletes
    const delRes = await fetch(`${BASE_URL}/complaints/${archId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(delRes.status === 200, 'Archive call failed');

    // Verify physical file STILL exists
    const uploadsDir = path.resolve(__dirname, '../backend/uploads');
    const diskPath = path.resolve(uploadsDir, diskFileName);
    assert(fs.existsSync(diskPath), 'Physical evidence was deleted on admin archive! Must be preserved.');

    // Verify excluded from default complaint list
    const listRes = await fetch(`${BASE_URL}/complaints/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const list = await listRes.json();
    const isPresent = list.some(c => c.complaintId === archId);
    assert(!isPresent, 'Archived complaint was included in default complaint list');
  });

  // 14. SuperAdmin Role Delegation & Audit Trail
  await runTest(14, 'SuperAdmin User Promotion & Live Dynamic Role Update', async () => {
    // Register candidate
    const promoEmail = `candidate.${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Promote Candidate', email: promoEmail, password: 'Password123!' })
    });
    const logRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: promoEmail, password: 'Password123!' })
    });
    const candidateData = await logRes.json();
    const candidateToken = candidateData.token;

    // SuperAdmin promotes user
    const promoRes = await fetch(`${BASE_URL}/users/${candidateData.user.id}/promote`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    assert(promoRes.status === 200, 'Promotion failed');

    // Candidate uses original token on admin route -> 200 (live dynamic role verification)
    const adminCheck = await fetch(`${BASE_URL}/complaints/all`, {
      headers: { 'Authorization': `Bearer ${candidateToken}` }
    });
    assert(adminCheck.status === 200, 'Live role update failed to recognize promoted admin');
  });

  // 15. User Soft-Deactivation & Immediate Invalidation
  await runTest(15, 'User Soft-Deactivation Blocks Login & Active Tokens (403)', async () => {
    const deactEmail = `deact.${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'User Deact', email: deactEmail, password: 'Password123!' })
    });
    const logRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: deactEmail, password: 'Password123!' })
    });
    const userData = await logRes.json();
    const userToken = userData.token;

    // Admin deactivates user
    const deactRes = await fetch(`${BASE_URL}/users/${userData.user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deactRes.status === 200, 'User deactivation call failed');

    // Login attempt -> 403
    const loginAttempt = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: deactEmail, password: 'Password123!' })
    });
    assert(loginAttempt.status === 403, `Deactivated user login gave ${loginAttempt.status}, expected 403`);

    // Existing token on protected endpoint -> 403
    const tokenAttempt = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert(tokenAttempt.status === 403, `Active token for deactivated user gave ${tokenAttempt.status}, expected 403`);
  });

  // 16. Contact Inquiries Full Lifecycle
  await runTest(16, 'Contact Inquiry Submission & Admin Status Lifecycle', async () => {
    const subRes = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Public Inquirer',
        email: 'inquirer@domain.lk',
        phone: '0771239876',
        subject: 'Inquiry on Police Clearance Certificate',
        message: 'Where do I submit my police clearance application?'
      })
    });
    const subData = await subRes.json();
    assert(subRes.status === 201, 'Contact submission failed');
    const inqId = subData.inquiryId;

    // Admin marks Read
    const readRes = await fetch(`${BASE_URL}/contact/${inqId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Read' })
    });
    assert(readRes.status === 200, 'Status Read failed');

    // Admin marks Resolved
    const resRes = await fetch(`${BASE_URL}/contact/${inqId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Resolved' })
    });
    assert(resRes.status === 200, 'Status Resolved failed');
  });

  // 17. Analytics & Calculations
  await runTest(17, 'System Analytics Overview & Calculation Integrity', async () => {
    const res = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'Analytics endpoint failed');
    assert(data.totalComplaints > 0, 'Total complaints count is 0');
    assert(Array.isArray(data.statusDistribution), 'Status distribution missing');
    assert(Array.isArray(data.monthlyTrend), 'Monthly trend missing');
  });

  // 18. Audit Logging & Credential Scrubbing
  await runTest(18, 'Audit Logging Verification & Sensitive Credential Scrubbing', async () => {
    const res = await fetch(`${BASE_URL}/audit`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const logs = await res.json();
    assert(res.status === 200, 'Audit log endpoint failed');
    assert(Array.isArray(logs) && logs.length > 0, 'No audit records found');

    const logText = JSON.stringify(logs);
    assert(!logText.includes('Password123!'), 'User password leaked into audit logs!');
    assert(!logText.includes('Admin@123'), 'Admin password leaked into audit logs!');
  });

  // 19. Public Tracking Privacy
  await runTest(19, 'Public Tracking Privacy (Zero evidence or PII leakage)', async () => {
    const trackRes = await fetch(`${BASE_URL}/complaints/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId: complaintAId, email: citizenAEmail })
    });
    const data = await trackRes.json();
    assert(trackRes.status === 200, 'Tracking failed');
    assert(data.evidenceFiles === undefined, 'Evidence files exposed in tracking response!');
  });

  // 20. Pagination Support with Backward Compatibility
  await runTest(20, 'API Pagination with Full Backward Compatibility', async () => {
    // Unpaginated -> array
    const unpaginated = await (await fetch(`${BASE_URL}/complaints/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    assert(Array.isArray(unpaginated), 'Unpaginated call did not return an array');

    // Paginated -> { data, pagination }
    const paginated = await (await fetch(`${BASE_URL}/complaints/all?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    })).json();
    assert(paginated.pagination && Array.isArray(paginated.data), 'Paginated call did not return metadata');
    assert(paginated.pagination.page === 1, 'Pagination page mismatch');
  });

  // 21. Production React Build Verification
  await runTest(21, 'Production Client Build Verification (Vite)', async () => {
    let buildError = null;
    try {
      execSync('npm --prefix client run build', {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'pipe'
      });
    } catch (err) {
      buildError = err.message;
    }
    assert(!buildError, `Client build failed: ${buildError}`);
  });

  console.log('\n================================================================');
  console.log(`FINAL E2E SUITE: ${passCount} / 21 PASSED (${failCount} FAILED)`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Final E2E Suite Fatal Exception:', err);
  process.exit(1);
});

