import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const configFromEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(configFromEnv.apiKey && configFromEnv.projectId);

const firebaseConfig = isFirebaseConfigured ? configFromEnv : {
    apiKey: "dummy-api-key",
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project-id",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "dummy-sender-id",
    appId: "dummy-app-id",
};


if (!isFirebaseConfigured) {
  console.warn(
    "Firebase configuration is missing. Please create a .env.local file in the root of your project " +
    "and add your Firebase project's configuration. You can use .env.local.example as a template."
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
