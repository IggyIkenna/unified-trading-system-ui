import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const presentations = [
  {
    id: "demo_intro",
    title: "Demo Intro",
    gcsPath: "presentations/demo/demo_intro.html",
  },
  {
    id: "demo_strategy",
    title: "Demo Strategy",
    gcsPath: "presentations/demo/demo_strategy.html",
  },
];

const group = {
  id: "demo_group",
  name: "Demo Group",
  presentationIds: presentations.map((p) => p.id),
};

const seed = async () => {
  for (const presentation of presentations) {
    await db.collection("presentations").doc(presentation.id).set({
      title: presentation.title,
      gcsPath: presentation.gcsPath,
    });
    console.log(`Seeded presentation ${presentation.id}`);
  }

  await db.collection("groups").doc(group.id).set({
    name: group.name,
    presentationIds: group.presentationIds,
  });
  console.log(`Seeded group ${group.id}`);
};

seed()
  .then(() => {
    console.log("Firestore seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Firestore seed failed:", err);
    process.exit(1);
  });
