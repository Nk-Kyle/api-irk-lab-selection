require("dotenv").config();
const firebase = require("firebase/app");

const firebaseApp = firebase.initializeApp(
    JSON.parse(process.env.FIREBASE_CONFIG)
);

module.exports = firebaseApp;
