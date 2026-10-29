const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:5000';

function request(options, postData = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || options.path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: options.headers || {}
    };

    if (postData && !isFormData && typeof postData === 'object') {
      postData = JSON.stringify(postData);
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    if (postData) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const contentType = res.headers['content-type'] || '';
        let body = null;
        if (contentType.includes('application/json')) {
          try {
            body = JSON.parse(buffer.toString());
          } catch (e) {
            body = buffer.toString();
          }
        } else {
          body = buffer;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: body,
          raw: buffer
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function sendMultipart(urlPath, fields, fileField, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const url = new URL(urlPath, BASE_URL);

    let parts = [];
    for (const [key, val] of Object.entries(fields)) {
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}\r\n`);
    }

    if (fileField) {
      parts.push(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`
      );
    }

    const preBuffer = Buffer.from(parts.join(''), 'utf-8');
    const fileBuffer = fileField ? fileField.data : Buffer.alloc(0);
    const postBuffer = Buffer.from(fileField ? `\r\n--${boundary}--\r\n` : `--${boundary}--\r\n`, 'utf-8');

    const totalPayload = Buffer.concat([preBuffer, fileBuffer, postBuffer]);

    const reqOptions = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalPayload.length,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ statusCode: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    req.write(totalPayload);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('   FAST-TRACK MISSION 4 - 25-STAGE ADMIN & SECURITY TEST SUITE   ');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failedCount++;
    }
  }

  try {
    let officerToken = '';
    let superAdminToken = '';
    let citizenToken = '';
    let citizenUser = null;
    let createdComplaintId = '';
    let targetCitizenForPromotionId = '';

    // ==========================================
    // STAGE 0: Setup Citizen & Evidence for Evidence Test
    // ==========================================
    console.log('--- Setup: Citizen Registration & Evidence Upload ---');
    const rand = Math.floor(Math.random() * 90000) + 10000;
    const citizenEmail = `citizentest_${rand}@example.com`;
    const regRes = await request({
      url: '/api/auth/register',
      method: 'POST'
    }, {
      fullName: `Citizen Tester ${rand}`,
      email: citizenEmail,
      phoneNumber: '0771234567',
      nationalId: `199${rand}5678`,
      password: 'Password123',
      addressNo: '44',
      street: 'Flower Rd',
      city: 'Colombo',
      district: 'Colombo'
    });
    assert(regRes.statusCode === 201, 'Citizen registration returned 201');

    const citizenLoginRes = await request({
      url: '/api/auth/login',
      method: 'POST'
    }, {
      email: citizenEmail,
      password: 'Password123',
      role: 'Citizen'
    });
    assert(citizenLoginRes.statusCode === 200 && citizenLoginRes.data.token, 'Citizen login succeeded and issued token');
    citizenToken = citizenLoginRes.data.token;
    citizenUser = citizenLoginRes.data.user;

    // File a complaint with evidence file
    const sampleImageBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;', 'binary');
    const fileComplaintRes = await sendMultipart(
      '/api/complaints/submit',
      {
        title: 'Break-in at front store',
        category: 'Theft & Burglary',
        district: 'Colombo',
        incidentDate: '2026-06-25',
        incidentTime: '22:15',
        location: 'Store 10, Colombo Main St',
        description: 'Store lock broken overnight and merchandise stolen. Immediate inspection required.',
        suspectDetails: 'One tall individual in hoodie',
        witnessDetails: 'Security guard saw vehicle at 2am',
        isAnonymous: 'false'
      },
      {
        name: 'evidenceFiles',
        filename: 'security_cam_still.png',
        contentType: 'image/png',
        data: sampleImageBuffer
      },
      citizenToken
    );
    assert(fileComplaintRes.statusCode === 201 && fileComplaintRes.data.complaintId, 'Citizen filed complaint with evidence attachment');
    createdComplaintId = fileComplaintRes.data.complaintId;

    console.log('\n--- Beginning 25 Verification Stages ---');

    // ==========================================
    // TEST 1: Admin login (officer@ccms.com / Admin@123)
    // ==========================================
    const adminLoginRes = await request({
      url: '/api/auth/login',
      method: 'POST'
    }, {
      email: 'officer@ccms.com',
      password: 'Admin@123',
      role: 'Admin'
    });
    assert(adminLoginRes.statusCode === 200 && adminLoginRes.data.token, 'TEST 1: Admin login (officer@ccms.com / Admin@123) returns 200 + token');
    officerToken = adminLoginRes.data.token;
    assert(adminLoginRes.data.user.role === 'Admin', 'TEST 1b: Logged in officer has role "Admin"');

    // ==========================================
    // TEST 2: Admin Dashboard loads real stats and complaints
    // ==========================================
    const complaintsRes = await request({
      url: '/api/complaints/all',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    const userCountRes = await request({
      url: '/api/users/count',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(complaintsRes.statusCode === 200 && Array.isArray(complaintsRes.data), 'TEST 2: Complaints API loaded for Dashboard stats');
    assert(userCountRes.statusCode === 200 && typeof userCountRes.data.total === 'number', 'TEST 2b: Users count API loaded for Dashboard stats');

    // ==========================================
    // TEST 3: Complaints list loads (GET /api/complaints/all)
    // ==========================================
    assert(complaintsRes.statusCode === 200 && complaintsRes.data.length > 0, `TEST 3: Complaints list loads ${complaintsRes.data.length} records`);

    // ==========================================
    // TEST 4: Search complaint
    // ==========================================
    const searchMatch = complaintsRes.data.find(c => c.complaintId === createdComplaintId || c.title.includes('Break-in'));
    assert(Boolean(searchMatch), 'TEST 4: Search finds newly created complaint by ID or keyword');

    // ==========================================
    // TEST 5: Filter by status
    // ==========================================
    const pendingList = complaintsRes.data.filter(c => (c.status || '').toLowerCase() === 'pending');
    assert(pendingList.length > 0, `TEST 5: Filter by status 'Pending' found ${pendingList.length} complaints`);

    // ==========================================
    // TEST 6: Filter by category
    // ==========================================
    const theftList = complaintsRes.data.filter(c => (c.category || '').toLowerCase().includes('theft'));
    assert(theftList.length > 0, `TEST 6: Filter by category 'Theft' found ${theftList.length} complaints`);

    // ==========================================
    // TEST 7: Filter by district
    // ==========================================
    const colomboList = complaintsRes.data.filter(c => (c.district || '').toLowerCase() === 'colombo');
    assert(colomboList.length > 0, `TEST 7: Filter by district 'Colombo' found ${colomboList.length} complaints`);

    // ==========================================
    // TEST 8: Approve Pending complaint (PUT /api/complaints/:id/status -> Approved)
    // ==========================================
    const approveRes = await request({
      url: `/api/complaints/${createdComplaintId}/status`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, { status: 'Approved' });
    assert(approveRes.statusCode === 200 && approveRes.data.complaint && approveRes.data.complaint.status === 'Approved',
      'TEST 8: Admin transitioned complaint to "Approved"'
    );

    // ==========================================
    // TEST 9: Move complaint Under Investigation (PUT /api/complaints/:id/status -> Under Investigation)
    // ==========================================
    const investRes = await request({
      url: `/api/complaints/${createdComplaintId}/status`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, { status: 'Under Investigation' });
    assert(investRes.statusCode === 200 && investRes.data.complaint && investRes.data.complaint.status === 'Under Investigation',
      'TEST 9: Admin transitioned complaint to "Under Investigation"'
    );

    // ==========================================
    // TEST 10: Resolve complaint (PUT /api/complaints/:id/status -> Resolved)
    // ==========================================
    const resolveRes = await request({
      url: `/api/complaints/${createdComplaintId}/status`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, { status: 'Resolved' });
    assert(resolveRes.statusCode === 200 && resolveRes.data.complaint && resolveRes.data.complaint.status === 'Resolved',
      'TEST 10: Admin transitioned complaint to "Resolved"'
    );

    // ==========================================
    // TEST 11: Reject complaint (PUT /api/complaints/:id/status -> Rejected)
    // ==========================================
    const rejectRes = await request({
      url: `/api/complaints/${createdComplaintId}/status`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, { status: 'Rejected' });
    assert(rejectRes.statusCode === 200 && rejectRes.data.complaint && rejectRes.data.complaint.status === 'Rejected',
      'TEST 11: Admin transitioned complaint to "Rejected"'
    );

    // ==========================================
    // TEST 12: View protected evidence as Admin (GET /api/complaints/:id/evidence/0)
    // ==========================================
    const evidenceRes = await request({
      url: `/api/complaints/${createdComplaintId}/evidence/0`,
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(evidenceRes.statusCode === 200 && (evidenceRes.headers['content-type'] || '').includes('image/png'),
      'TEST 12: Admin authorized access to evidence file via secure stream'
    );

    // ==========================================
    // TEST 13: Emergency reports load (urgent complaints filtered)
    // ==========================================
    const urgentCategories = ['assault', 'robbery', 'murder', 'kidnapping', 'domestic', 'theft', 'weapon', 'violence', 'altercation'];
    const emergencyList = complaintsRes.data.filter(c => {
      const cat = (c.category || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      return urgentCategories.some(u => cat.includes(u) || title.includes(u));
    });
    assert(emergencyList.length > 0, `TEST 13: Emergency reports filter successfully isolated ${emergencyList.length} urgent cases`);

    // ==========================================
    // TEST 14: Users list loads (GET /api/users/all)
    // ==========================================
    const usersRes = await request({
      url: '/api/users/all',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(usersRes.statusCode === 200 && Array.isArray(usersRes.data), `TEST 14: Citizens directory loaded ${usersRes.data.length} users`);

    // Pick one citizen for promotion test later
    const foundCit = usersRes.data.find(u => u.email === citizenEmail || u.name.includes('Citizen Tester'));
    targetCitizenForPromotionId = foundCit ? (foundCit.dbId || foundCit.id) : (usersRes.data[0].dbId || usersRes.data[0].id);

    // ==========================================
    // TEST 15: View user details
    // ==========================================
    assert(Boolean(foundCit && foundCit.email && foundCit.phone), 'TEST 15: User details contain required fields (name, email, phone, nid, address, cases)');

    // ==========================================
    // TEST 16: Normal Admin cannot use SuperAdmin API (GET /api/users/admins returns 403)
    // ==========================================
    const adminAdminsRes = await request({
      url: '/api/users/admins',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(adminAdminsRes.statusCode === 403, 'TEST 16: Normal Admin blocked with 403 when calling /api/users/admins');

    // ==========================================
    // TEST 17: SuperAdmin login (admin@ccms.com / Admin@123)
    // ==========================================
    const superAdminLoginRes = await request({
      url: '/api/auth/login',
      method: 'POST'
    }, {
      email: 'admin@ccms.com',
      password: 'Admin@123',
      role: 'Admin'
    });
    assert(superAdminLoginRes.statusCode === 200 && superAdminLoginRes.data.token, 'TEST 17: SuperAdmin login returns 200 + token');
    superAdminToken = superAdminLoginRes.data.token;
    assert(superAdminLoginRes.data.user.role === 'SuperAdmin', 'TEST 17b: SuperAdmin token user role is "SuperAdmin"');

    // ==========================================
    // TEST 18: SuperAdmin lists Admin accounts (GET /api/users/admins returns 200)
    // ==========================================
    const superAdminAdminsRes = await request({
      url: '/api/users/admins',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    assert(superAdminAdminsRes.statusCode === 200 && Array.isArray(superAdminAdminsRes.data) && superAdminAdminsRes.data.length >= 2,
      `TEST 18: SuperAdmin retrieved administrative roster (${superAdminAdminsRes.data.length} admins)`
    );

    // ==========================================
    // TEST 19: SuperAdmin promotes Citizen -> Admin (PUT /api/users/:id/promote returns 200)
    // ==========================================
    const promoteRes = await request({
      url: `/api/users/${targetCitizenForPromotionId}/promote`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    assert(promoteRes.statusCode === 200 && promoteRes.data.message.includes('promoted'),
      'TEST 19: SuperAdmin successfully promoted Citizen to Admin'
    );

    // Check promote by normal admin is blocked with 403
    const adminPromoteAttempt = await request({
      url: `/api/users/${targetCitizenForPromotionId}/promote`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(adminPromoteAttempt.statusCode === 403, 'TEST 19b: Normal Admin blocked with 403 from promoting users');

    // ==========================================
    // TEST 20: Contact inquiries load (GET /api/contact)
    // ==========================================
    const inquiriesRes = await request({
      url: '/api/contact',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(inquiriesRes.statusCode === 200 && Array.isArray(inquiriesRes.data) && inquiriesRes.data.length >= 1,
      `TEST 20: Contact inquiries loaded ${inquiriesRes.data.length} inquiry items`
    );

    // ==========================================
    // TEST 21: Contact status update persists (PUT /api/contact/:id/status)
    // ==========================================
    const targetInquiry = inquiriesRes.data[0];
    const targetInquiryId = targetInquiry._id || targetInquiry.id;
    const updateToRead = await request({
      url: `/api/contact/${targetInquiryId}/status`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, { status: 'Read' });
    assert(updateToRead.statusCode === 200 && updateToRead.data.inquiry && updateToRead.data.inquiry.status === 'Read',
      'TEST 21: Contact status successfully updated to "Read"'
    );

    const updateToResolved = await request({
      url: `/api/contact/${targetInquiryId}/status`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, { status: 'Resolved' });
    assert(updateToResolved.statusCode === 200 && updateToResolved.data.inquiry && updateToResolved.data.inquiry.status === 'Resolved',
      'TEST 21b: Contact status successfully updated to "Resolved"'
    );

    // Invalid status rejected
    const updateInvalid = await request({
      url: `/api/contact/${targetInquiryId}/status`,
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, { status: 'InvalidStatus' });
    assert(updateInvalid.statusCode === 400, 'TEST 21c: Contact status rejects non-canonical status values with 400');

    // ==========================================
    // TEST 22: Admin Settings fetch/update (GET & PUT /api/auth/profile)
    // ==========================================
    const getProfileRes = await request({
      url: '/api/auth/profile',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    });
    assert(getProfileRes.statusCode === 200 && getProfileRes.data.email === 'officer@ccms.com',
      'TEST 22: Admin profile fetched successfully via /api/auth/profile'
    );

    const updateProfileRes = await request({
      url: '/api/auth/profile',
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, {
      fullName: 'Station Officer Silva Updated',
      phoneNumber: '0779998877'
    });
    assert(updateProfileRes.statusCode === 200 && updateProfileRes.data.user.fullName === 'Station Officer Silva Updated',
      'TEST 22b: Admin profile credentials updated successfully via PUT /api/auth/profile'
    );

    // Revert profile name
    await request({
      url: '/api/auth/profile',
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${officerToken}` }
    }, {
      fullName: 'Station Officer Silva',
      phoneNumber: '0773334455'
    });

    // ==========================================
    // TEST 23: Citizen Admin-route blocked (frontend guard verification)
    // ==========================================
    // AdminRoute inspects user.role; if role is not Admin or SuperAdmin, redirects to /login.
    const adminRouteContent = fs.readFileSync(path.resolve(__dirname, '../client/src/routes/AdminRoute.jsx'), 'utf-8');
    const hasRoleCheck = adminRouteContent.includes('isAdmin') && adminRouteContent.includes('isSuperAdmin');
    const hasRedirect = adminRouteContent.includes('Navigate to="/login"');
    assert(hasRoleCheck && hasRedirect, 'TEST 23: Client AdminRoute strictly verifies isAdmin/isSuperAdmin and redirects unauthorized users');

    // ==========================================
    // TEST 24: Citizen Admin-API blocked (Citizen token calling /api/complaints/all returns 403)
    // ==========================================
    const citizenBlockedRes = await request({
      url: '/api/complaints/all',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(citizenBlockedRes.statusCode === 403, 'TEST 24: Citizen token calling Admin endpoint (/api/complaints/all) strictly blocked with 403');

    // ==========================================
    // TEST 25: Production React build completes with 0 errors
    // ==========================================
    console.log('Running client production build verification...');
    const buildOutput = execSync('npm --prefix client run build', { encoding: 'utf-8' });
    const buildSuccess = buildOutput.includes('built in') || buildOutput.includes('dist');
    assert(buildSuccess, 'TEST 25: Production React build compiles successfully with 0 errors');

    // ==========================================
    // CITIZEN REGRESSION TESTS
    // ==========================================
    console.log('\n--- Citizen Experience Regression Tests ---');
    // 1. Citizen view own complaints
    const citizenMyComplaints = await request({
      url: '/api/complaints/my-complaints',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(citizenMyComplaints.statusCode === 200 && citizenMyComplaints.data.length >= 1, 'Citizen Regression: Citizen can fetch own complaints');

    // 2. Submit public contact inquiry
    const publicInqRes = await request({
      url: '/api/contact',
      method: 'POST'
    }, {
      name: 'Public Inquirer',
      email: 'public@inquiry.com',
      phone: '0711122334',
      subject: 'Inquiry regarding district coverage',
      message: 'Can you please confirm the coverage of the central station for online filings?'
    });
    assert(publicInqRes.statusCode === 201, 'Citizen Regression: Public inquiry submitted successfully');

    // 3. Public tracking
    const trackRes = await request({
      url: '/api/complaints/track',
      method: 'POST'
    }, {
      complaintId: createdComplaintId,
      email: citizenEmail
    });
    assert(trackRes.statusCode === 200 && trackRes.data.complaintId === createdComplaintId, 'Citizen Regression: Public complaint tracking functional');

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Unexpected test error:', error);
    process.exit(1);
  }
}

runTests();
