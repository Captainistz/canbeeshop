const admin = require('firebase-admin')

const serviceAccount = require('./serviceAccount.json')

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}
const firestore = admin.firestore()
console.log('    🔥 [firebase]: connected to firebase')

module.exports = {
  firestore,
}
