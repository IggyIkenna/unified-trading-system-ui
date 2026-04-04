/** Settings pages — notification history demo data. */

export type DeliveryStatus = "Delivered" | "Failed" | "Pending";
export type Channel = "Web" | "Email" | "Push" | "Telegram";

export interface NotificationEntry {
  id: string;
  timestamp: string;
  alertType: string;
  channel: Channel;
  status: DeliveryStatus;
  message: string;
}

export const MOCK_HISTORY: NotificationEntry[] = [
  {
    id: "n1",
    timestamp: "2026-03-28 14:32:01",
    alertType: "Position Limit Breach",
    channel: "Web",
    status: "Delivered",
    message: "BTC-PERP position exceeded 120% of limit on Binance",
  },
  {
    id: "n2",
    timestamp: "2026-03-28 14:32:01",
    alertType: "Position Limit Breach",
    channel: "Email",
    status: "Delivered",
    message: "BTC-PERP position exceeded 120% of limit on Binance",
  },
  {
    id: "n3",
    timestamp: "2026-03-28 14:32:02",
    alertType: "Position Limit Breach",
    channel: "Push",
    status: "Failed",
    message: "BTC-PERP position exceeded 120% of limit on Binance",
  },
  {
    id: "n4",
    timestamp: "2026-03-28 14:15:44",
    alertType: "Venue Connectivity Lost",
    channel: "Web",
    status: "Delivered",
    message: "Lost WebSocket connection to Deribit (retry 3/5)",
  },
  {
    id: "n5",
    timestamp: "2026-03-28 14:15:45",
    alertType: "Venue Connectivity Lost",
    channel: "Email",
    status: "Pending",
    message: "Lost WebSocket connection to Deribit (retry 3/5)",
  },
  {
    id: "n6",
    timestamp: "2026-03-28 13:50:12",
    alertType: "New Trade Fill",
    channel: "Web",
    status: "Delivered",
    message: "Filled 0.5 ETH-PERP @ $3,842.10 on OKX",
  },
  {
    id: "n7",
    timestamp: "2026-03-28 13:22:30",
    alertType: "Gas Price Spike",
    channel: "Push",
    status: "Delivered",
    message: "Ethereum gas price spiked to 142 gwei (+85% in 5m)",
  },
  {
    id: "n8",
    timestamp: "2026-03-28 12:00:00",
    alertType: "Daily P&L Summary",
    channel: "Email",
    status: "Delivered",
    message: "Daily P&L: +$12,450.23 across 8 strategies",
  },
  {
    id: "n9",
    timestamp: "2026-03-28 11:45:33",
    alertType: "Model Retrain Complete",
    channel: "Telegram",
    status: "Delivered",
    message: "btc_momentum_v3 retrain complete (AUC: 0.847)",
  },
  {
    id: "n10",
    timestamp: "2026-03-28 11:45:33",
    alertType: "Model Retrain Complete",
    channel: "Web",
    status: "Delivered",
    message: "btc_momentum_v3 retrain complete (AUC: 0.847)",
  },
  {
    id: "n11",
    timestamp: "2026-03-28 10:30:15",
    alertType: "Drawdown Threshold",
    channel: "Web",
    status: "Delivered",
    message: "Strategy arb_basis_01 drawdown hit -2.1% (threshold: -2%)",
  },
  {
    id: "n12",
    timestamp: "2026-03-28 10:30:15",
    alertType: "Drawdown Threshold",
    channel: "Telegram",
    status: "Failed",
    message: "Strategy arb_basis_01 drawdown hit -2.1% (threshold: -2%)",
  },
  {
    id: "n13",
    timestamp: "2026-03-28 09:15:00",
    alertType: "Reconciliation Break",
    channel: "Email",
    status: "Delivered",
    message: "Bybit position mismatch: expected 1.2 BTC, found 1.15 BTC",
  },
  {
    id: "n14",
    timestamp: "2026-03-28 08:00:00",
    alertType: "Strategy Signal Generated",
    channel: "Web",
    status: "Delivered",
    message: "Long signal on SOL-PERP from mean_reversion_v2",
  },
  {
    id: "n15",
    timestamp: "2026-03-28 07:30:22",
    alertType: "Liquidation Risk",
    channel: "Push",
    status: "Delivered",
    message: "Health factor 1.12 on Aave ETH/USDC position (threshold: 1.15)",
  },
];
