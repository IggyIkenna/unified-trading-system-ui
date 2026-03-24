import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const hasConfig = !!firebaseConfig.apiKey

let _app: FirebaseApp | null = null
function getFirebaseApp(): FirebaseApp | null {
  if (!hasConfig) return null
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  }
  return _app
}

let _auth: Auth | null = null
export function getFirebaseAuth(): Auth | null {
  if (_auth) return _auth
  const app = getFirebaseApp()
  if (!app) return null
  _auth = getAuth(app)
  return _auth
}

let _db: Firestore | null = null
export function getFirebaseDb(): Firestore | null {
  if (_db) return _db
  const app = getFirebaseApp()
  if (!app) return null
  _db = getFirestore(app)
  return _db
}

let _storage: FirebaseStorage | null = null
export function getFirebaseStorage(): FirebaseStorage | null {
  if (_storage) return _storage
  const app = getFirebaseApp()
  if (!app) return null
  _storage = getStorage(app)
  return _storage
}

// Backwards-compatible eager exports — safe because they only init when config is present
export const firebaseAuth = getFirebaseAuth()
export const firebaseDb = getFirebaseDb()
export const firebaseStorage = getFirebaseStorage()
