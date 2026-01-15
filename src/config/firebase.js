// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAvXOQXLLsVx3bj1ad5zWHcH8RbBZ0w2gE",
    authDomain: "attendance-app-f514e.firebaseapp.com",
    projectId: "attendance-app-f514e",
    storageBucket: "attendance-app-f514e.firebasestorage.app",
    messagingSenderId: "44982363770",
    appId: "1:44982363770:web:58cf32893699214897bdc3",
    measurementId: "G-XEH7T0EP11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const firestore = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
