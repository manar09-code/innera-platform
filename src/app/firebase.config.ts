// This file is located in the src/app folder, which contains the core application logic, components, services, pages, guards, and pipes for the Angular application. This file serves as the Firebase configuration module. Its role is to initialize Firebase services and export instances for authentication, functions, Firestore database, and analytics. It interacts with Firebase SDK modules and the environment configuration for setup, and is used by other parts of the app like services for backend operations.
import { initializeApp } from 'firebase/app'; // This line imports the initializeApp function from the 'firebase/app' module, which is needed to initialize the Firebase application with configuration settings.
import { getAuth } from 'firebase/auth'; // This line imports the getAuth function from the 'firebase/auth' module, which is needed to get the Firebase Authentication service instance.
import { getFunctions } from 'firebase/functions'; // This line imports the getFunctions function from the 'firebase/functions' module, which is needed to get the Firebase Cloud Functions service instance.
import { getFirestore } from 'firebase/firestore'; // This line imports the getFirestore function from the 'firebase/firestore' module, which is needed to get the Firestore database service instance.
import { getAnalytics } from 'firebase/analytics'; // This line imports the getAnalytics function from the 'firebase/analytics' module, which is needed to get the Firebase Analytics service instance.

const firebaseConfig = { // This line declares a constant object named firebaseConfig that holds the configuration settings for Firebase, including API keys and project identifiers.
  apiKey: 'AIzaSyCg1cSQ5-QWS36inKYa358kITk8-NfHVXA', // This line sets the apiKey property in the firebaseConfig object, which is the API key used to authenticate requests to Firebase services.
  authDomain: 'innera-platform.firebaseapp.com', // This line sets the authDomain property in the firebaseConfig object, which is the domain used for Firebase Authentication.
  projectId: 'innera-platform', // This line sets the projectId property in the firebaseConfig object, which is the unique identifier for the Firebase project.
  storageBucket: 'innera-platform.firebasestorage.app', // This line sets the storageBucket property in the firebaseConfig object, which is the Google Cloud Storage bucket for Firebase Storage.
  messagingSenderId: '355196161108', // This line sets the messagingSenderId property in the firebaseConfig object, which is the sender ID for Firebase Cloud Messaging.
  appId: '1:355196161108:web:92626193ed0841b7d331c1', // This line sets the appId property in the firebaseConfig object, which is the unique identifier for the Firebase app.
  measurementId: 'G-CYNZVBXF76', // This line sets the measurementId property in the firebaseConfig object, which is the measurement ID for Firebase Analytics.
}; // This closes the firebaseConfig object, completing the definition of Firebase configuration settings.

const app = initializeApp(firebaseConfig); // This line calls the initializeApp function with the firebaseConfig object to initialize the Firebase application, creating an app instance that can be used to access Firebase services.
export const auth = getAuth(app); // This line exports a constant named auth that holds the Firebase Authentication service instance obtained by calling getAuth with the app instance, allowing other parts of the app to use authentication features.
export const functions = getFunctions(app, 'us-central1'); // This line exports a constant named functions that holds the Firebase Cloud Functions service instance obtained by calling getFunctions with the app instance and the region 'us-central1', allowing other parts of the app to call server-side functions.
export const firestore = getFirestore(app); // This line exports a constant named firestore that holds the Firestore database service instance obtained by calling getFirestore with the app instance, allowing other parts of the app to interact with the database.
export const analytics = getAnalytics(app); // This line exports a constant named analytics that holds the Firebase Analytics service instance obtained by calling getAnalytics with the app instance, allowing other parts of the app to track user interactions and events.
