export interface ColumnMetadata {
  column: string;
  display_name: string;
  type: "number" | "string" | "datetime" | "boolean";
  unit: string;
  description: string;
  group: string;
  sortable: boolean;
  filterable: boolean;
  filter_type: "range" | "select" | "search" | "checkbox" | "date_range" | "text";
  visible_default: boolean;
  operators: string[];
}

export interface MetadataResponse {
  columns: ColumnMetadata[];
  groups: string[];
}
