import { cookies } from "next/headers";
import { getAdminAuth } from "./firebaseAdmin";

export const SESSION_COOKIE_NAME = "odum_session";

const MOCK_MODE = process.env.MOCK_MODE === "true";

export const getVerifiedUser = async () => {
  if (MOCK_MODE) {
    // In mock mode, always return a logged-in user (check cookie to determine which)
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) {
      return null;
    }
    // Mock auth always returns admin user
    return getAdminAuth().verifySessionCookie(session, true);
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return null;
  }

  try {
    return await getAdminAuth().verifySessionCookie(session, true);
  } catch {
    return null;
  }
};
