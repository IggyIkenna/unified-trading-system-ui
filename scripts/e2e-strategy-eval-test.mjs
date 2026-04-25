import admin from "firebase-admin";

const PROJECT = "central-element-323112";
const BUCKET = "central-element-323112.appspot.com";
const PROD = "https://www.odum-research.com";
const TEST_EMAIL = `ikennaigboaka+strategyeval-${Date.now()}@gmail.com`;

admin.initializeApp({ projectId: PROJECT, storageBucket: BUCKET });

console.log("=== E2E test against prod ===");
console.log("Test email:", TEST_EMAIL);
console.log("(Goes to your Gmail inbox via +alias — Gmail ignores the suffix)");
console.log();

// 1. Upload fake CSV
const draftId = `draft-e2e-${Date.now()}`;
const csvContent = `timestamp,instrument,side,size,price\n2026-04-25T09:00Z,BTCUSDT,buy,0.1,68000\n2026-04-25T09:30Z,BTCUSDT,sell,0.1,68150\n`;
const filename = `e2e-trade-log.csv`;
const path = `strategy-evaluations/${draftId}/tradeLogCsv/${Date.now()}-${filename}`;
console.log("[1] Uploading fake CSV…");
const bucket = admin.storage().bucket();
const file = bucket.file(path);
await file.save(Buffer.from(csvContent), {
  contentType: "text/csv",
  metadata: { metadata: { firebaseStorageDownloadTokens: "e2e-token-" + Date.now() } },
});
const tokenMeta = (await file.getMetadata())[0].metadata?.firebaseStorageDownloadTokens;
const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${tokenMeta}`;
console.log("    OK");

// 2. Submit
const payload = {
  strategyName: "E2E Test — Cross-Venue Funding Carry",
  leadResearcher: "Test (Claude e2e)",
  email: TEST_EMAIL,
  commercialPath: "B",
  understandFit: true,
  understandIncubation: true,
  understandSignals: true,
  assetGroups: ["Crypto CeFi", "DeFi"],
  instrumentTypes: ["Perpetuals"],
  strategyFamily: "Carry & Yield",
  holdingPeriod: "intraday",
  hasBacktest: "yes",
  draftSubmissionId: draftId,
  tradeLogCsv: { path, url: downloadUrl, filename, size: csvContent.length, contentType: "text/csv", uploadedAt: new Date().toISOString() },
  sharpeRatio: "2.4",
  maxDrawdown: "-4.2%",
  strategyOverview: "End-to-end test with a real Firebase Storage upload.",
  riskManagement: "Per-venue cap 20% NAV.",
  referralSource: "existing",
};
console.log("[2] POST submit…");
const r1 = await fetch(`${PROD}/api/strategy-evaluation/submit`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
const r1b = await r1.json();
console.log("    HTTP", r1.status, "submissionId:", r1b.submissionId);

const docId = r1b.submissionId;
await new Promise(r => setTimeout(r, 800));

// 3. Verify Firestore
const db = admin.firestore();
const doc = await db.collection("strategy_evaluations").doc(docId).get();
const d = doc.data();
const magicToken = d.magicToken;
console.log("[3] Firestore — strategyName:", d.strategyName, "| email:", d.email, "| upload:", d.tradeLogCsv?.filename);

// 4. Status API
const r2 = await fetch(`${PROD}/api/strategy-evaluation/status?token=${magicToken}`);
const r2b = await r2.json();
console.log("[4] Status API — strategy:", r2b.strategyName, "| upload:", r2b.tradeLogCsv?.filename);

// 5. Status page HTML
const r3 = await fetch(`${PROD}/strategy-evaluation/status?token=${magicToken}`);
const html = await r3.text();
const hasStrategy = html.includes("E2E Test — Cross-Venue");
const hasFilename = html.includes("e2e-trade-log.csv");
console.log("[5] Status page HTML — strategy embedded:", hasStrategy, "| filename embedded:", hasFilename);

// 6. Form prefill (server component) — only works after befwm74ly lands
const r4 = await fetch(`${PROD}/strategy-evaluation?token=${magicToken}`);
const formHtml = await r4.text();
const formHasStrategy = formHtml.includes("E2E Test — Cross-Venue");
console.log("[6] FORM prefill (server-rendered) — strategy embedded in HTML:", formHasStrategy, "← needs split deploy");

// 7. Resend
console.log("[7] Resend-link endpoint…");
const r5 = await fetch(`${PROD}/api/strategy-evaluation/resend-link`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: TEST_EMAIL }),
});
console.log("    HTTP", r5.status);

console.log();
console.log("=== Magic link for you to click ===");
console.log(`${PROD}/strategy-evaluation/status?token=${magicToken}`);
console.log();
console.log("Two emails should arrive at ikennaigboaka@gmail.com:");
console.log(" 1. 'Your strategy evaluation has been received — Odum'");
console.log(" 2. 'Your strategy evaluation access link — Odum' (from resend-link test)");
