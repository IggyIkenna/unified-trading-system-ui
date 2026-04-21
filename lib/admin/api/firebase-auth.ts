import { apiClient } from "@/lib/admin/api/client";
import type { FirebaseAuthUser } from "@/lib/admin/api/types";

export async function listFirebaseUsers() {
  return apiClient.get<{ users: FirebaseAuthUser[] }>("/firebase-users");
}
