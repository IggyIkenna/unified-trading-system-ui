import { getAdminDb } from "./firebaseAdmin";
import { chunk } from "./utils";
import { userAccessSchema, clientSchema, groupSchema } from "./schemas";

export type { UserAccess } from "./schemas";

export const getAllowedPresentationIds = async (
  userId: string,
): Promise<string[]> => {
  const userSnap = await getAdminDb().collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return [];
  }
  const userData = userAccessSchema.parse(userSnap.data());
  const explicitIds = new Set(userData.presentationIds ?? []);
  const groupIds = userData.groupIds ?? [];
  const clientId = userData.clientId;

  if (clientId) {
    const clientSnap = await getAdminDb()
      .collection("clients")
      .doc(clientId)
      .get();
    if (clientSnap.exists) {
      const clientData = clientSchema.parse(clientSnap.data());
      (clientData.presentationIds ?? []).forEach((id) => explicitIds.add(id));
    }
  }

  if (groupIds.length > 0) {
    const groupsChunked = chunk(groupIds, 10);

    for (const batch of groupsChunked) {
      const groupSnaps = await getAdminDb()
        .collection("groups")
        .where("__name__", "in", batch)
        .get();

      const folderQueries: Promise<void>[] = [];

      for (const group of groupSnaps.docs) {
        const groupData = groupSchema.parse(group.data());

        if (groupData.isFolderGroup && groupData.folderName) {
          folderQueries.push(
            (async () => {
              const folderPresentations = await getAdminDb()
                .collection("presentations")
                .where("folder", "==", groupData.folderName)
                .get();
              folderPresentations.forEach((doc) => {
                explicitIds.add(doc.id);
              });
            })(),
          );
        } else {
          (groupData.presentationIds ?? []).forEach((id) =>
            explicitIds.add(id),
          );
        }
      }

      await Promise.all(folderQueries);
    }
  }

  return Array.from(explicitIds);
};
