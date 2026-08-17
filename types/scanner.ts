export interface ScannerCondition {
  column: string;
  operator: string;
  value: string | number | boolean | (string | number)[] | null;
  logical: "AND" | "OR";
}

export interface ScannerGroup {
  conditions: ScannerCondition[];
  logical: "AND" | "OR";
}

export interface ExpressionCondition {
  type: "expression";
  expression: string;
}

export interface UnifiedQueryRequest {
  conditions?: ScannerCondition[];
  expression_conditions?: ExpressionCondition[];
  groups?: ScannerGroup[];
  query_text?: string;
  
  execution_target: "live" | "history";
  
  date?: string;
  start_time?: string;
  end_time?: string;
  
  sort_by?: string;
  sort_order?: "asc" | "desc";
  
  page?: number;
  page_size?: number;
  
  query_name?: string;
  query_id?: string;
}

export interface QueryValidationError {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

export interface QueryResultMeta {
  total: number;
  total_scanned: number;
  matched_count: number;
  returned_count: number;
  truncated: boolean;
  page: number;
  page_size: number;
  total_pages: number;
  conditions_applied: number;
  execution_time_ms: number;
  execution_target: string;
  validation_errors: QueryValidationError[];
}

export interface ScannerRequest {
  mode: "live" | "historical";
  conditions: ScannerCondition[];
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
}

export interface ScannerPreset {
  id: string;
  name: string;
  description?: string;
  scanner_type?: string;
  version?: number;
  request: UnifiedQueryRequest;
  is_public?: boolean;
  favorite?: boolean;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  last_used?: string | null;
  is_deleted?: boolean;
  
  // New state fields
  sorting?: any[];
  page_size?: number;
  selected_columns?: string[];
  ui_state?: Record<string, any>;
}
