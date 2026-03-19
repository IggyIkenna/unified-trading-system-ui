import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

let _auth: Auth | null = null;
let _firestore: Firestore | null = null;

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!_firestore) _firestore = getFirestore(getApp());
  return _firestore;
}

// Backwards-compatible exports — only access at runtime (client-side), not during SSG
export const firebaseAuth =
  typeof window !== "undefined" ? getFirebaseAuth() : (null as unknown as Auth);
export const firestore =
  typeof window !== "undefined"
    ? getFirebaseFirestore()
    : (null as unknown as Firestore);
