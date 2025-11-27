// This relies on the Firebase scripts being loaded in index.html
declare const firebase: any;

// Your web app's Firebase configuration, taken from the Firebase console.
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "bseeportal-edbc0.firebaseapp.com",
  projectId: "bseeportal-edbc0",
  storageBucket: "bseeportal-edbc0.firebasestorage.app",
  messagingSenderId: "822482210699",
  appId: "1:822482210699:web:8c7fce026ee1b6d440298e",
  measurementId: "G-2X0CB9Y06N"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const firestore = firebase.firestore;