export interface TradingOrganization {
  id: string;
  name: string;
  type: "internal" | "external";
}

export interface TradingClient {
  id: string;
  name: string;
  orgId: string;
  status: "active" | "onboarding" | "inactive";
  capitalAllocation: number; // USD
}
