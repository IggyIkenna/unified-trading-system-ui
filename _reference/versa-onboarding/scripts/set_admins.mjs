import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

const adminEmails = ["test@gmail.com", "femi.amoo@gmail.com"];

const setAdmins = async () => {
  for (const email of adminEmails) {
    try {
      const userRecord = await auth.getUserByEmail(email);
      await db
        .collection("users")
        .doc(userRecord.uid)
        .set(
          {
            email: userRecord.email ?? email,
            displayName: userRecord.displayName ?? "",
            role: "admin",
          },
          { merge: true },
        );
      console.log(`Set admin role for ${email} (${userRecord.uid})`);
    } catch (error) {
      console.error(
        `Failed to set admin for ${email}:`,
        error.message || error,
      );
    }
  }
};

setAdmins()
  .then(() => {
    console.log("Admin update complete.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Admin update failed:", error);
    process.exit(1);
  });
