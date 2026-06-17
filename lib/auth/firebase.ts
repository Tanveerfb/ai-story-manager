import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase initialization (plan §Batch9). Only called when auth is enabled.
 * Config comes from NEXT_PUBLIC_FIREBASE_* env vars.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseAuth(): Auth {
  const app = getApps().length ? getApp() : initializeApp(config);
  return getAuth(app);
}
