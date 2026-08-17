/**
 * Dashboard & Stocks service.
 */

import { api } from "./api";
import { ENDPOINTS } from "@/constants/api";
import type { DashboardData, StockRecord, IndexData, MarketStatusData, HealthData } from "@/types/stock";
import type { MetadataResponse } from "@/types/metadata";
import type { ScannerRequest, ScannerPreset, UnifiedQueryRequest } from "@/types/scanner";
import type { ApiResponse, PaginationMeta } from "@/types/api";

// ── Dashboard ──────────────────────────────────────────────────────────

export async function fetchDashboard(): Promise<ApiResponse<DashboardData>> {
  return api.get<DashboardData>(ENDPOINTS.DASHBOARD);
}

// ── Stocks ─────────────────────────────────────────────────────────────

export interface StocksParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  search?: string;
  filters?: string;
  columns?: string;
}

export async function fetchStocks(
  params: StocksParams = {}
): Promise<ApiResponse<StockRecord[]> & { meta: PaginationMeta }> {
  const queryParams: Record<string, string> = {};
  if (params.page) queryParams.page = String(params.page);
  if (params.page_size) queryParams.page_size = String(params.page_size);
  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.sort_order) queryParams.sort_order = params.sort_order;
  if (params.search) queryParams.search = params.search;
  if (params.filters) queryParams.filters = params.filters;
  if (params.columns) queryParams.columns = params.columns;

  return api.get(ENDPOINTS.STOCKS, queryParams) as Promise<ApiResponse<StockRecord[]> & { meta: PaginationMeta }>;
}

export async function fetchStockDetail(symbol: string): Promise<ApiResponse<StockRecord>> {
  return api.get<StockRecord>(ENDPOINTS.STOCK_DETAIL(symbol));
}

// ── Metadata ───────────────────────────────────────────────────────────

export async function fetchMetadata(target?: "live" | "history", date?: string): Promise<ApiResponse<MetadataResponse>> {
  const queryParams: Record<string, string> = {};
  if (target) queryParams.target = target;
  if (date) queryParams.date = date;
  return api.get<MetadataResponse>(ENDPOINTS.METADATA, queryParams);
}

// ── Market Status ──────────────────────────────────────────────────────

export async function fetchMarketStatus(): Promise<ApiResponse<MarketStatusData>> {
  return api.get<MarketStatusData>(ENDPOINTS.MARKET_STATUS);
}


// ── History ────────────────────────────────────────────────────────────

export interface HistoryParams {
  symbol?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function fetchHistory(params: HistoryParams = {}) {
  const queryParams: Record<string, string> = {};
  if (params.symbol) queryParams.symbol = params.symbol;
  if (params.date) queryParams.date = params.date;
  if (params.start_time) queryParams.start_time = params.start_time;
  if (params.end_time) queryParams.end_time = params.end_time;
  if (params.page) queryParams.page = String(params.page);
  if (params.page_size) queryParams.page_size = String(params.page_size);
  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.sort_order) queryParams.sort_order = params.sort_order;

  return api.get<StockRecord[]>(ENDPOINTS.HISTORY, queryParams, {
    timeout: 120000, // 2 minutes for large parquet downloads
    retries: 3,
  });
}

export async function fetchAvailableDates(): Promise<ApiResponse<string[]>> {
  return api.get<string[]>(ENDPOINTS.HISTORY_DATES);
}

export async function fetchTimeline(symbol: string, date?: string) {
  const queryParams: Record<string, string> = {};
  if (date) queryParams.date = date;
  return api.get<StockRecord[]>(ENDPOINTS.HISTORY_TIMELINE(symbol), queryParams);
}

// ── Scanner ────────────────────────────────────────────────────────────

export async function runQuery(request: UnifiedQueryRequest) {
  return api.post<StockRecord[]>(ENDPOINTS.SCANNER_QUERY, request);
}

export async function runScanner(request: ScannerRequest) {
  return api.post<StockRecord[]>(ENDPOINTS.SCANNER, request);
}

export async function fetchScannerPresets(): Promise<ApiResponse<ScannerPreset[]>> {
  return api.get<ScannerPreset[]>(ENDPOINTS.SCANNER_PRESETS);
}

// ── Health ──────────────────────────────────────────────────────────────

export async function fetchHealth(): Promise<ApiResponse<HealthData>> {
  return api.get<HealthData>(ENDPOINTS.HEALTH);
}
