const admin = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')

const serviceAccount = require('./serviceAccount.json')

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}
const firestore = getFirestore()
console.log('    🔥 [firebase]: connected to firebase')

module.exports = {
  firestore,
}
