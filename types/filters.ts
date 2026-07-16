export interface ActiveFilter {
  column: string;
  operator: string;
  value: unknown;
}

export type FilterMap = Record<string, Record<string, unknown>>;
