/**
 * Role definitions for the Odum Research presentation portal.
 * 7 roles with hierarchical access levels.
 */

export const ROLES = {
  admin: {
    label: "Admin",
    description:
      "Full access to all presentations, user management, and system configuration.",
    level: 0,
  },
  board: {
    label: "Board Member",
    description:
      "Access to board presentations, investment, and regulatory materials.",
    level: 1,
  },
  shareholder: {
    label: "Shareholder",
    description:
      "Access to shareholder reports, investment management, and regulatory umbrella.",
    level: 2,
  },
  investor: {
    label: "Investor",
    description:
      "Access to investor-facing presentations and fund performance materials.",
    level: 2,
  },
  client: {
    label: "Client",
    description:
      "Access to service presentations relevant to the client's engagement.",
    level: 3,
  },
  accounting: {
    label: "Accounting",
    description: "Access to regulatory and financial reporting presentations.",
    level: 3,
  },
  operations: {
    label: "Operations",
    description:
      "Access to system quality and platform operations presentations.",
    level: 3,
  },
} as const;

export type RoleName = keyof typeof ROLES;

export const ROLE_OPTIONS: Array<{ value: RoleName; label: string }> =
  Object.entries(ROLES).map(([key, role]) => ({
    value: key as RoleName,
    label: role.label,
  }));
