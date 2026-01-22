import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),

    // ✅ Firebase App
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // ✅ Firestore (THIS WAS MISSING)
    provideFirestore(() => getFirestore()),
  ],
};
