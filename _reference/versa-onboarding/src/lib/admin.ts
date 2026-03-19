import { getAdminDb } from "./firebaseAdmin";
import { getVerifiedUser } from "./session";
import { userRoleSchema } from "./schemas";

export const requireAdmin = async () => {
  const user = await getVerifiedUser();
  if (!user) {
    return { user: null, isAdmin: false };
  }
  const doc = await getAdminDb().collection("users").doc(user.uid).get();
  const data = userRoleSchema.parse(doc.data() ?? {});
  const isAdmin = data.role === "admin";
  return { user, isAdmin };
};
