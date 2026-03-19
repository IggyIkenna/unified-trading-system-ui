/** Seed data for mock mode. Mirrors Firestore collections. */

export const MOCK_USERS: Record<string, Record<string, unknown>> = {
  "mock-admin-uid": {
    email: "admin@odum-research.com",
    displayName: "Admin User",
    role: "admin",
    groupIds: ["board-group", "all-presentations"],
    presentationIds: [],
    clientId: undefined,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  "mock-board-uid": {
    email: "board@odum-research.com",
    displayName: "Board Member",
    role: "board",
    groupIds: ["board-group"],
    presentationIds: [],
    clientId: undefined,
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  "mock-client-uid": {
    email: "client@elysium.capital",
    displayName: "Elysium Client",
    role: "client",
    groupIds: [],
    presentationIds: [],
    clientId: "elysium",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  "mock-investor-uid": {
    email: "investor@edge-capital.com",
    displayName: "Edge Investor",
    role: "investor",
    groupIds: ["investor-group"],
    presentationIds: [],
    clientId: undefined,
    createdAt: "2026-02-15T00:00:00.000Z",
  },
  "mock-viewer-uid": {
    email: "viewer@odum-research.com",
    displayName: "Viewer",
    role: "viewer",
    groupIds: [],
    presentationIds: ["00-master"],
    clientId: undefined,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
};

export const MOCK_PRESENTATIONS: Record<string, Record<string, unknown>> = {
  "00-master": {
    title: "Master Index",
    gcsPath: "presentations/00-master.html",
    folder: undefined,
  },
  "01-data-provision": {
    title: "Data Provision Service",
    gcsPath: "presentations/01-data-provision.html",
    folder: "services",
  },
  "02-backtesting-as-a-service": {
    title: "Backtesting as a Service",
    gcsPath: "presentations/02-backtesting-as-a-service.html",
    folder: "services",
  },
  "03-strategy-white-labelling": {
    title: "Strategy White-Labelling",
    gcsPath: "presentations/03-strategy-white-labelling.html",
    folder: "services",
  },
  "04-execution-as-a-service": {
    title: "Execution as a Service",
    gcsPath: "presentations/04-execution-as-a-service.html",
    folder: "services",
  },
  "05-investment-management": {
    title: "Investment Management",
    gcsPath: "presentations/05-investment-management.html",
    folder: "services",
  },
  "06-regulatory-umbrella": {
    title: "Regulatory Umbrella",
    gcsPath: "presentations/06-regulatory-umbrella.html",
    folder: "services",
  },
  "07-autonomous-ai-operations": {
    title: "Autonomous AI Operations",
    gcsPath: "presentations/07-autonomous-ai-operations.html",
    folder: "platform",
  },
  "08-system-quality": {
    title: "System Quality",
    gcsPath: "presentations/08-system-quality.html",
    folder: "platform",
  },
  "09-platform-portal": {
    title: "Platform Portal",
    gcsPath: "presentations/09-platform-portal.html",
    folder: "platform",
  },
};

export const MOCK_GROUPS: Record<string, Record<string, unknown>> = {
  "board-group": {
    presentationIds: [
      "00-master",
      "05-investment-management",
      "06-regulatory-umbrella",
    ],
    isFolderGroup: false,
    folderName: undefined,
  },
  "all-presentations": {
    presentationIds: [],
    isFolderGroup: true,
    folderName: "services",
  },
  "investor-group": {
    presentationIds: ["00-master", "05-investment-management"],
    isFolderGroup: false,
    folderName: undefined,
  },
};

export const MOCK_CLIENTS: Record<string, Record<string, unknown>> = {
  elysium: {
    name: "Elysium Capital",
    presentationIds: [
      "00-master",
      "01-data-provision",
      "04-execution-as-a-service",
    ],
  },
};
