import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const project = "central-element-323112";
const app = initializeApp({ credential: applicationDefault(), projectId: project }, project);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("=== Firebase Auth users with admin custom claims ===");
let pageToken;
const adminUsers = [];
do {
  const res = await auth.listUsers(1000, pageToken);
  for (const u of res.users) {
    const c = u.customClaims ?? {};
    if (c.admin === true || c.role === "admin" || c.entitlements?.admin === true) {
      adminUsers.push({
        uid: u.uid,
        email: u.email,
        emailVerified: u.emailVerified,
        disabled: u.disabled,
        lastSignIn: u.metadata.lastSignInTime,
        customClaims: c,
      });
    }
  }
  pageToken = res.pageToken;
} while (pageToken);
console.log(JSON.stringify(adminUsers, null, 2));

console.log("\n=== Firestore /admins collection ===");
try {
  const snap = await db.collection("admins").get();
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  console.log(JSON.stringify(list, null, 2));
} catch (err) {
  console.log("(not present or denied)");
}
process.exit(0);
