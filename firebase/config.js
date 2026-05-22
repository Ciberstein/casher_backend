const admin = require('firebase-admin');
const service = require('./service.json');

admin.initializeApp({
  credential: admin.credential.cert(service),
});

module.exports = admin;