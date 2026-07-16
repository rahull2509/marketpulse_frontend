export interface ScannerCondition {
  column: string;
  operator: string;
  value: string | number | boolean | (string | number)[];
  logical: "AND" | "OR";
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
  description: string;
  conditions: ScannerCondition[];
}
