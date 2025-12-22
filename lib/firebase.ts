import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, setLogLevel } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && {
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }),
};

// These are only initialized in the browser (client components).
// Use definite assignment assertions to satisfy TypeScript in strict mode.
let app!: FirebaseApp;
let auth!: Auth;
let db!: Firestore;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);

  // App Check (optional): if Firestore/App resources have App Check enforcement enabled,
  // requests without an App Check token will fail with permission-denied.
  //
  // Setup:
  // - Create a Web app in Firebase Console > App Check and copy the reCAPTCHA v3 site key
  // - Set NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY in your env
  // - In dev, we enable App Check debug tokens automatically (Firebase will log the token;
  //   add it in Firebase Console > App Check > Debug tokens).
  if (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN ?? true;
    }
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Firebase] App Check initialized');
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[Firebase] App Check init failed (continuing):', e);
      }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      '[Firebase] App Check not configured (set NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY if App Check enforcement is enabled)'
    );
  }

  // Dev-only: helps ensure we're pointing at the Firebase project whose rules you edited.
  // Avoid logging secrets (apiKey, appId, etc).
  if (process.env.NODE_ENV !== 'production') {
    // Firestore debug logs are extremely helpful for diagnosing "permission-denied" causes
    // such as App Check enforcement or missing auth tokens.
    setLogLevel('debug');
    // eslint-disable-next-line no-console
    console.log('[Firebase] projectId:', firebaseConfig.projectId);
  }
}

export { auth, db };
export default app;

