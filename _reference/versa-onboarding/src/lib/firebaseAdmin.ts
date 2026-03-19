import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const MOCK_MODE = process.env.MOCK_MODE === "true";

let cachedApp: ReturnType<typeof initializeApp> | null = null;

const initAdminApp = () => {
  if (cachedApp) {
    return cachedApp;
  }

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  cachedApp = initializeApp({
    projectId,
    credential:
      clientEmail && privateKey
        ? cert({ projectId, clientEmail, privateKey })
        : applicationDefault(),
  });

  return cachedApp;
};

export const getAdminAuth = (): Auth => {
  if (MOCK_MODE) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./mock/store").mockAuth as Auth;
  }
  return getAuth(initAdminApp());
};

export const getAdminDb = (): Firestore => {
  if (MOCK_MODE) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./mock/store").mockDb as Firestore;
  }
  return getFirestore(initAdminApp());
};
