// Stock data is dynamic — we use Record<string, unknown> as the base
// and type specific known fields for convenience

export type StockRecord = Record<string, unknown> & {
  Instrument: string;
  trading_symbol?: string;
  exchange?: string;
  "Last Price"?: number;
  "Net Change"?: number;
  day_change_pct?: number;
  Volume?: number;
  Open?: number;
  High?: number;
  Low?: number;
  Close?: number;
  "Average Price"?: number;
};

export interface DashboardData {
  stocks: StockRecord[];
  info: CacheInfo;
}

export interface CacheInfo {
  is_populated: boolean;
  snapshot_id: number;
  last_updated: string | null;
  total_instruments: number;
  total_columns: number;
}

export interface IndexData {
  name: string;
  instrument_key: string;
  value: number | null;
  change: number | null;
  change_pct: number | null;
  direction: "up" | "down" | "flat";
  last_updated: string | null;
}

export interface MarketStatusData {
  status: string;
  is_open: boolean;
  current_time: string;
  market_open: string;
  market_close: string;
  is_weekend: boolean;
  is_holiday: boolean;
}

export interface HealthData {
  status: string;
  backend: string;
  scheduler: string;
  cache: {
    populated: boolean;
    snapshot_id: number;
    last_updated: string | null;
    instruments: number;
    columns: number;
  };
  s3: string;
  market_status: string;
}
