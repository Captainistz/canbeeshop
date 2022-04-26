import firebase from "firebase/compat/app";
import 'firebase/compat/firestore'

const serviceAccount = require('./serviceAccount.json')

firebase.initializeApp(serviceAccount)
const firestore = firebase.firestore()
console.log('    🔥 [firebase]: connected to firebase')

module.exports = {
  firestore,
}
