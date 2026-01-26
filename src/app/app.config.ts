import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';
import { auth, firestore } from './firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Use the singleton instance from firebase.config
    provideFirebaseApp(() => auth.app),
    provideFirestore(() => firestore),
  ],
};
