const http = require('http');

async function testSubmit() {
  // Login first as citizen-john
  const loginData = JSON.stringify({ email: 'john@example.com', password: 'Password123', role: 'Citizen' });
  const loginRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.write(loginData);
    req.end();
  });

  console.log('Login result:', loginRes.status, loginRes.body.user ? loginRes.body.user.email : loginRes.body);
  const token = loginRes.body.token;

  // Now submit multipart
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const sampleImage = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;', 'binary');

  let bodyParts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nStore Break-in Incident\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nTheft\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="district"\r\n\r\nColombo\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="incidentDate"\r\n\r\n2026-06-25\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="incidentTime"\r\n\r\n22:15\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="location"\r\n\r\nStore 10, Colombo Main St\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nStore lock broken overnight and merchandise stolen. Immediate inspection required.\r\n`,
    `--${boundary}\r\nContent-Disposition: form-data; name="evidenceFiles"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`
  ];

  const part1 = Buffer.from(bodyParts.join(''), 'utf-8');
  const part2 = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const fullBody = Buffer.concat([part1, sampleImage, part2]);

  const submitRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/complaints',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.write(fullBody);
    req.end();
  });

  console.log('Submit result:', submitRes.status, submitRes.body);
}

testSubmit();

