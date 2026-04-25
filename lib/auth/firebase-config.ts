import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Local emulator detection. Set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in
// .env.local (alongside `firebase emulators:start`) and the SDK will route
// every Auth / Firestore / Storage call to localhost — zero network traffic
// to real GCP, drafts/tokens/uploads land in `.firebase/emulators/`. Default
// emulator ports per `firebase.json`: auth 9099, firestore 8080, storage 9199.
// Project ID can be any string in emulator mode (the emulator doesn't
// validate it), so we let the build use a placeholder when the real config
// is absent locally.
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const hasConfig = !!firebaseConfig.apiKey || useEmulator;

let _app: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp | null {
  if (!hasConfig) return null;
  if (!_app) {
    const config = useEmulator
      ? {
          ...firebaseConfig,
          apiKey: firebaseConfig.apiKey || "demo",
          projectId: firebaseConfig.projectId || "odum-local-dev",
        }
      : firebaseConfig;
    _app = getApps().length === 0 ? initializeApp(config) : getApp();
  }
  return _app;
}

let _auth: Auth | null = null;
export function getFirebaseAuth(): Auth | null {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  _auth = getAuth(app);
  if (useEmulator && typeof window !== "undefined") {
    try {
      connectAuthEmulator(_auth, "http://localhost:9099", { disableWarnings: true });
    } catch {
      /* idempotent — already connected on hot reload */
    }
  }
  return _auth;
}

let _db: Firestore | null = null;
export function getFirebaseDb(): Firestore | null {
  if (_db) return _db;
  const app = getFirebaseApp();
  if (!app) return null;
  _db = getFirestore(app);
  if (useEmulator && typeof window !== "undefined") {
    try {
      connectFirestoreEmulator(_db, "localhost", 8080);
    } catch {
      /* idempotent */
    }
  }
  return _db;
}

let _storage: FirebaseStorage | null = null;
export function getFirebaseStorage(): FirebaseStorage | null {
  if (_storage) return _storage;
  const app = getFirebaseApp();
  if (!app) return null;
  _storage = getStorage(app);
  if (useEmulator && typeof window !== "undefined") {
    try {
      connectStorageEmulator(_storage, "localhost", 9199);
    } catch {
      /* idempotent */
    }
  }
  return _storage;
}

export const firebaseAuth = getFirebaseAuth();
export const firebaseDb = getFirebaseDb();
export const firebaseStorage = getFirebaseStorage();
