import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyCg1cSQ5-QWS36inKYa358kITk8-NfHVXA',
  authDomain: 'innera-platform.firebaseapp.com',
  projectId: 'innera-platform',
  storageBucket: 'innera-platform.firebasestorage.app',
  messagingSenderId: '355196161108',
  appId: '1:355196161108:web:92626193ed0841b7d331c1',
  measurementId: 'G-CYNZVBXF76',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const firestore = getFirestore(app);
export const analytics = getAnalytics(app);
