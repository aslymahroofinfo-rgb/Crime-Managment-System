const net = require('net');

const s = net.createConnection({ port: 27017, host: '127.0.0.1', timeout: 2000 }, () => {
  console.log('LOCAL_MONGO: RUNNING');
  s.end();
  process.exit(0);
});

s.on('error', (e) => {
  console.log('LOCAL_MONGO: NOT RUNNING -', e.message);
  process.exit(0);
});

s.on('timeout', () => {
  console.log('LOCAL_MONGO: TIMEOUT');
  s.destroy();
  process.exit(0);
});

