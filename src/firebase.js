// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBAcGSLPGMnOfy1Yd6Ukm9nx1j-sjyINeI",
    authDomain: "tech3d-6b2ab.firebaseapp.com",
    projectId: "tech3d-6b2ab",
    storageBucket: "tech3d-6b2ab.firebasestorage.app",
    messagingSenderId: "947439630982",
    appId: "1:947439630982:web:936cb04d0a1410c9e4af07",
    measurementId: "G-DD9V0T38M1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);