/** Reports — NAV tab fixtures. */

export interface HourlyNAV {
  hour: string;
  nav: number;
  change: number;
  changePct: number;
}

export interface CapitalFlow {
  id: string;
  date: string;
  type: "Subscription" | "Redemption" | "Distribution";
  investor: string;
  amount: number;
  status: "Pending" | "Settled";
}

export interface FeeItem {
  category: string;
  rate: string;
  annualAmount: number;
  ytdAccrued: number;
}

export interface NavInvestor {
  name: string;
  class: string;
  commitment: number;
  navShare: number;
  pctOfFund: number;
  inceptionDate: string;
}

// ---

export const MOCK_HOURLY_NAV: HourlyNAV[] = [
  { hour: "00:00", nav: 24562000, change: 0, changePct: 0 },
  { hour: "01:00", nav: 24570000, change: 8000, changePct: 0.033 },
  { hour: "02:00", nav: 24558000, change: -12000, changePct: -0.049 },
  { hour: "03:00", nav: 24585000, change: 27000, changePct: 0.11 },
  { hour: "04:00", nav: 24602000, change: 17000, changePct: 0.069 },
  { hour: "05:00", nav: 24610000, change: 8000, changePct: 0.033 },
  { hour: "06:00", nav: 24635000, change: 25000, changePct: 0.102 },
  { hour: "07:00", nav: 24660000, change: 25000, changePct: 0.101 },
  { hour: "08:00", nav: 24700000, change: 40000, changePct: 0.162 },
  { hour: "09:00", nav: 24720000, change: 20000, changePct: 0.081 },
  { hour: "10:00", nav: 24750000, change: 30000, changePct: 0.121 },
  { hour: "11:00", nav: 24780000, change: 30000, changePct: 0.121 },
  { hour: "12:00", nav: 24795000, change: 15000, changePct: 0.061 },
  { hour: "13:00", nav: 24810000, change: 15000, changePct: 0.06 },
  { hour: "14:00", nav: 24830000, change: 20000, changePct: 0.081 },
  { hour: "15:00", nav: 24815000, change: -15000, changePct: -0.06 },
  { hour: "16:00", nav: 24825000, change: 10000, changePct: 0.04 },
  { hour: "17:00", nav: 24835000, change: 10000, changePct: 0.04 },
  { hour: "18:00", nav: 24838000, change: 3000, changePct: 0.012 },
  { hour: "19:00", nav: 24840000, change: 2000, changePct: 0.008 },
  { hour: "20:00", nav: 24842000, change: 2000, changePct: 0.008 },
  { hour: "21:00", nav: 24844000, change: 2000, changePct: 0.008 },
  { hour: "22:00", nav: 24846000, change: 2000, changePct: 0.008 },
  { hour: "23:00", nav: 24847321.42, change: 1321.42, changePct: 0.005 },
];

export const MOCK_CAPITAL_FLOWS: CapitalFlow[] = [
  {
    id: "CF-001",
    date: "2026-03-28",
    type: "Subscription",
    investor: "Meridian Fund",
    amount: 500000,
    status: "Pending",
  },
  {
    id: "CF-002",
    date: "2026-03-27",
    type: "Subscription",
    investor: "Apex Capital",
    amount: 750000,
    status: "Settled",
  },
  {
    id: "CF-003",
    date: "2026-03-25",
    type: "Redemption",
    investor: "Vertex Partners",
    amount: 200000,
    status: "Pending",
  },
  {
    id: "CF-004",
    date: "2026-03-24",
    type: "Subscription",
    investor: "Quantum Strategies",
    amount: 300000,
    status: "Settled",
  },
  {
    id: "CF-005",
    date: "2026-03-22",
    type: "Distribution",
    investor: "All Investors (Q1)",
    amount: 180000,
    status: "Settled",
  },
  {
    id: "CF-006",
    date: "2026-03-20",
    type: "Redemption",
    investor: "Nova Investments",
    amount: 250000,
    status: "Settled",
  },
  {
    id: "CF-007",
    date: "2026-03-18",
    type: "Subscription",
    investor: "Odum Fund II",
    amount: 1000000,
    status: "Settled",
  },
  { id: "CF-008", date: "2026-03-15", type: "Subscription", investor: "Seed LP", amount: 150000, status: "Settled" },
];

export const MOCK_FEES: FeeItem[] = [
  { category: "Management Fee", rate: "2.00%", annualAmount: 497200, ytdAccrued: 124300 },
  { category: "Performance Fee", rate: "20.00%", annualAmount: 1420000, ytdAccrued: 355000 },
  { category: "Admin Fee", rate: "0.15%", annualAmount: 37300, ytdAccrued: 9325 },
  { category: "Custody Fee", rate: "0.05%", annualAmount: 12400, ytdAccrued: 3100 },
];

export const MOCK_INVESTORS_NAV: NavInvestor[] = [
  {
    name: "Odum Fund I",
    class: "A",
    commitment: 5000000,
    navShare: 4962000,
    pctOfFund: 19.97,
    inceptionDate: "2025-01-15",
  },
  {
    name: "Odum Fund II",
    class: "A",
    commitment: 4000000,
    navShare: 4180000,
    pctOfFund: 16.83,
    inceptionDate: "2025-06-01",
  },
  {
    name: "Seed LP",
    class: "Founder",
    commitment: 3000000,
    navShare: 3480000,
    pctOfFund: 14.0,
    inceptionDate: "2024-09-01",
  },
  {
    name: "Meridian Fund",
    class: "B",
    commitment: 3500000,
    navShare: 3120000,
    pctOfFund: 12.56,
    inceptionDate: "2025-03-15",
  },
  {
    name: "Apex Capital",
    class: "A",
    commitment: 2500000,
    navShare: 2680000,
    pctOfFund: 10.79,
    inceptionDate: "2025-04-01",
  },
  {
    name: "Quantum Strategies",
    class: "B",
    commitment: 2000000,
    navShare: 2240000,
    pctOfFund: 9.01,
    inceptionDate: "2025-07-15",
  },
  {
    name: "Vertex Partners",
    class: "A",
    commitment: 1500000,
    navShare: 1620000,
    pctOfFund: 6.52,
    inceptionDate: "2025-09-01",
  },
  {
    name: "Nova Investments",
    class: "B",
    commitment: 1200000,
    navShare: 1285321.42,
    pctOfFund: 5.17,
    inceptionDate: "2025-11-01",
  },
];
