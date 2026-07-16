// Generic API response types matching the backend envelope

export interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  market_status: string;
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
