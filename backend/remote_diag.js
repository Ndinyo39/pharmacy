const jwt = require('jsonwebtoken');
const https = require('https');

const secret = 'efc7a3178497cd94812b99b228858dc3b9fe5c3be70fe3e4d5ef4e706dd3ff51d4dd200f040588f7227b39c4d607662c5912fc4021880a467bfe2555f2a58706';
const token = jwt.sign({ id: 1, email: 'admin@pharmacy.com', role: 'super-admin' }, secret, { expiresIn: '1h' });

const options = {
  hostname: 'pharmacy-delta-three.vercel.app',
  path: '/api/medicines',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('Body:', body);
  });
});

req.on('error', (e) => console.error(e));
req.end();
