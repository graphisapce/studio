/**
 * This file is now a proxy to the central Firebase system in @/firebase.
 * This ensures that all components use the same Firebase instances.
 */
import { initializeFirebase } from "@/firebase";
import { GoogleAuthProvider } from "firebase/auth";

const { firebaseApp: app, auth, firestore: db } = initializeFirebase();
const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured = true;
export { app, auth, db, googleProvider };
