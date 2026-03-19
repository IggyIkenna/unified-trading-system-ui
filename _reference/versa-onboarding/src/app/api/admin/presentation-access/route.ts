import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { presentationId: string };

  if (!body.presentationId) {
    return NextResponse.json(
      { error: "Missing presentationId" },
      { status: 400 },
    );
  }

  // Find all users with direct access
  const usersWithDirectAccess = await getAdminDb()
    .collection("users")
    .where("presentationIds", "array-contains", body.presentationId)
    .get();

  // Find all groups with access
  const groupsWithAccess = await getAdminDb()
    .collection("groups")
    .where("presentationIds", "array-contains", body.presentationId)
    .get();

  // Find all clients with access
  const clientsWithAccess = await getAdminDb()
    .collection("clients")
    .where("presentationIds", "array-contains", body.presentationId)
    .get();

  // Find users in those groups
  const groupIds = groupsWithAccess.docs.map((doc) => doc.id);
  const usersInGroups: Array<{
    id: string;
    email?: string;
    displayName?: string;
  }> = [];

  if (groupIds.length > 0) {
    const batches = groupIds.reduce<string[][]>((acc, id, index) => {
      if (index % 10 === 0) acc.push([]);
      acc[acc.length - 1].push(id);
      return acc;
    }, []);

    for (const batch of batches) {
      const usersSnap = await getAdminDb()
        .collection("users")
        .where("groupIds", "array-contains-any", batch)
        .get();
      usersSnap.forEach((doc) => {
        const data = doc.data();
        usersInGroups.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
        });
      });
    }
  }

  // Find users in those clients
  const clientIds = clientsWithAccess.docs.map((doc) => doc.id);
  const usersInClients: Array<{
    id: string;
    email?: string;
    displayName?: string;
  }> = [];

  if (clientIds.length > 0) {
    const batches = clientIds.reduce<string[][]>((acc, id, index) => {
      if (index % 10 === 0) acc.push([]);
      acc[acc.length - 1].push(id);
      return acc;
    }, []);

    for (const batch of batches) {
      const usersSnap = await getAdminDb()
        .collection("users")
        .where("clientId", "in", batch)
        .get();
      usersSnap.forEach((doc) => {
        const data = doc.data();
        usersInClients.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
        });
      });
    }
  }

  // Combine and deduplicate
  const allUserIds = new Set<string>();
  const allUsers: Array<{
    id: string;
    email?: string;
    displayName?: string;
    accessVia: string[];
  }> = [];

  usersWithDirectAccess.docs.forEach((doc) => {
    const data = doc.data();
    if (!allUserIds.has(doc.id)) {
      allUserIds.add(doc.id);
      allUsers.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        accessVia: ["Direct assignment"],
      });
    }
  });

  usersInGroups.forEach((user) => {
    if (!allUserIds.has(user.id)) {
      allUserIds.add(user.id);
      allUsers.push({
        ...user,
        accessVia: ["Group membership"],
      });
    } else {
      const existing = allUsers.find((u) => u.id === user.id);
      if (existing) {
        existing.accessVia.push("Group membership");
      }
    }
  });

  usersInClients.forEach((user) => {
    if (!allUserIds.has(user.id)) {
      allUserIds.add(user.id);
      allUsers.push({
        ...user,
        accessVia: ["Client membership"],
      });
    } else {
      const existing = allUsers.find((u) => u.id === user.id);
      if (existing) {
        existing.accessVia.push("Client membership");
      }
    }
  });

  return NextResponse.json({
    presentationId: body.presentationId,
    users: allUsers,
    groups: groupsWithAccess.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    })),
    clients: clientsWithAccess.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    })),
  });
}
