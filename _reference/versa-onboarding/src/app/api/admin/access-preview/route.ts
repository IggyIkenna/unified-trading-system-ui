import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    userId: string;
    groupIds?: string[];
    presentationIds?: string[];
    clientId?: string;
  };

  // Temporarily calculate what presentations this user would have access to
  const allowedIds = new Set<string>(body.presentationIds ?? []);

  // Add from client
  if (body.clientId) {
    const clientSnap = await getAdminDb()
      .collection("clients")
      .doc(body.clientId)
      .get();
    if (clientSnap.exists) {
      const clientData = clientSnap.data() as { presentationIds?: string[] };
      (clientData.presentationIds ?? []).forEach((id) => allowedIds.add(id));
    }
  }

  // Add from groups (including folder-based groups)
  if (body.groupIds && body.groupIds.length > 0) {
    const groupsChunked = body.groupIds.reduce<string[][]>(
      (acc, groupId, index) => {
        if (index % 10 === 0) acc.push([]);
        acc[acc.length - 1].push(groupId);
        return acc;
      },
      [],
    );

    for (const chunk of groupsChunked) {
      const groupSnaps = await getAdminDb()
        .collection("groups")
        .where("__name__", "in", chunk)
        .get();

      // Collect folder group queries to run in parallel
      const folderQueries: Promise<void>[] = [];

      for (const group of groupSnaps.docs) {
        const groupData = group.data() as {
          presentationIds?: string[];
          isFolderGroup?: boolean;
          folderName?: string;
        };

        // If it's a folder group, get all presentations from that folder
        if (groupData.isFolderGroup && groupData.folderName) {
          folderQueries.push(
            (async () => {
              const folderPresentations = await getAdminDb()
                .collection("presentations")
                .where("folder", "==", groupData.folderName)
                .get();
              folderPresentations.forEach((doc) => {
                allowedIds.add(doc.id);
              });
            })(),
          );
        } else {
          // Regular group with explicit presentation IDs
          (groupData.presentationIds ?? []).forEach((id) => allowedIds.add(id));
        }
      }

      // Wait for all folder queries to complete
      await Promise.all(folderQueries);
    }
  }

  // Get presentation details
  const presentationIds = Array.from(allowedIds);
  if (presentationIds.length === 0) {
    return NextResponse.json({ presentations: [] });
  }

  const batches = presentationIds.reduce<string[][]>((acc, id, index) => {
    if (index % 10 === 0) acc.push([]);
    acc[acc.length - 1].push(id);
    return acc;
  }, []);

  const results: Array<{ id: string; title: string }> = [];
  for (const batch of batches) {
    const snapshot = await getAdminDb()
      .collection("presentations")
      .where("__name__", "in", batch)
      .get();
    snapshot.forEach((doc) => {
      const data = doc.data() as { title: string };
      results.push({ id: doc.id, title: data.title });
    });
  }

  return NextResponse.json({ presentations: results });
}
