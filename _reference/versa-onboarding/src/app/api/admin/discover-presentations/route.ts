import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";
import { readdir } from "fs/promises";
import path from "path";

const MOCK_MODE = process.env.MOCK_MODE === "true";
const storage = MOCK_MODE ? null : new Storage();

function getBucketName(): string {
  const name =
    process.env.PRESENTATIONS_BUCKET || process.env.GCLOUD_STORAGE_BUCKET;
  if (!name) {
    throw new Error(
      "PRESENTATIONS_BUCKET or GCLOUD_STORAGE_BUCKET env var is required",
    );
  }
  return name;
}

/** In mock mode, scan local public/presentations/ instead of GCS. */
async function getLocalPresentationFiles(): Promise<Array<{ name: string }>> {
  const baseDir = path.join(process.cwd(), "public", "presentations");
  const files: Array<{ name: string }> = [];

  async function scan(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await scan(full);
      } else if (entry.name.endsWith(".html")) {
        files.push({
          name: path.relative(path.join(process.cwd(), "public"), full),
        });
      }
    }
  }

  await scan(baseDir);
  return files;
}

interface DiscoveredPresentation {
  id: string;
  title: string;
  gcsPath: string;
  folder?: string;
}

interface DiscoveredFolder {
  id: string;
  name: string;
  presentationIds: string[];
  gcsPath: string; // Folder path in GCS
}

export async function POST() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const files = MOCK_MODE
      ? await getLocalPresentationFiles()
      : (
          await storage!
            .bucket(getBucketName())
            .getFiles({ prefix: "presentations/" })
        )[0];

    // Organize files by folder
    const folderMap = new Map<string, DiscoveredPresentation[]>();
    const rootPresentations: DiscoveredPresentation[] = [];

    for (const file of files) {
      // Only process HTML files
      if (!file.name.endsWith(".html")) {
        continue;
      }

      const pathParts = file.name.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const folderPath = pathParts.slice(0, -1).join("/");
      const folderName =
        pathParts.length > 2 ? pathParts[pathParts.length - 2] : undefined;

      // Generate ID from file path (remove .html extension)
      const id = file.name
        .replace(/^presentations\//, "")
        .replace(/\.html$/, "")
        .replace(/\//g, "_");

      // Generate title from filename (remove .html, replace underscores/hyphens with spaces, capitalize)
      const title = fileName
        .replace(/\.html$/, "")
        .replace(/[_-]/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const presentation: DiscoveredPresentation = {
        id,
        title,
        gcsPath: file.name,
        folder: folderName,
      };

      if (folderName && folderPath.startsWith("presentations/")) {
        if (!folderMap.has(folderName)) {
          folderMap.set(folderName, []);
        }
        folderMap.get(folderName)!.push(presentation);
      } else {
        rootPresentations.push(presentation);
      }
    }

    // Sync presentations to Firestore
    const allPresentations = [...rootPresentations];
    for (const presentations of folderMap.values()) {
      allPresentations.push(...presentations);
    }

    const batch = getAdminDb().batch();
    for (const presentation of allPresentations) {
      const ref = getAdminDb().collection("presentations").doc(presentation.id);
      batch.set(
        ref,
        {
          title: presentation.title,
          gcsPath: presentation.gcsPath,
          folder: presentation.folder || null,
          discoveredAt: new Date().toISOString(),
        },
        { merge: true },
      );
    }
    await batch.commit();

    // Create/update folder-based groups
    const folderGroups: DiscoveredFolder[] = [];
    for (const [folderName, presentations] of folderMap.entries()) {
      const groupId = `folder_${folderName}`;
      const presentationIds = presentations.map((p) => p.id);

      folderGroups.push({
        id: groupId,
        name: `Folder: ${folderName}`,
        presentationIds,
        gcsPath: `presentations/${folderName}/`,
      });

      // Update or create group in Firestore
      await getAdminDb()
        .collection("groups")
        .doc(groupId)
        .set(
          {
            name: `Folder: ${folderName}`,
            presentationIds,
            gcsPath: `presentations/${folderName}/`,
            isFolderGroup: true,
            folderName,
          },
          { merge: true },
        );
    }

    return NextResponse.json({
      presentations: allPresentations,
      folders: folderGroups,
      stats: {
        totalPresentations: allPresentations.length,
        totalFolders: folderGroups.length,
        rootPresentations: rootPresentations.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Discovery failed", detail: message },
      { status: 500 },
    );
  }
}
