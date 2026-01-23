// Import the ApplicationConfig type from Angular core to define app-wide settings
import { ApplicationConfig } from '@angular/core';
// Import function to set up routing in the app
import { provideRouter } from '@angular/router';
// Import function to enable HTTP requests (like API calls)
import { provideHttpClient } from '@angular/common/http';
// Import functions to connect to Firebase (a backend service for data)
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
// Import functions to use Firestore (Firebase's database)
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
// Import the routes configuration we defined earlier
import { routes } from './app.routes';
// Import environment settings (like API keys)
import { environment } from '../environments/environment';

// Export the app configuration object that tells Angular how to set up the app
export const appConfig: ApplicationConfig = {
  // List of providers (services or tools) that the app needs
  providers: [
    // Provide the router with our routes so navigation works
    provideRouter(routes),
    // Provide HTTP client for making web requests
    provideHttpClient(),
    // Set up Firebase app using settings from environment
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Set up Firestore database for storing and retrieving data
    provideFirestore(() => getFirestore()),
  ],
};
