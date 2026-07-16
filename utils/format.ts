/**
 * Number and currency formatting utilities.
 *
 * All formatting is locale-aware (Indian numbering system: lakhs, crores).
 */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const INR_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

const NUMBER_COMPACT = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

const NUMBER_PRECISE = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const VOLUME_FORMAT = new Intl.NumberFormat("en-IN");

export function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return INR.format(num);
}

export function formatCurrencyCompact(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return INR_COMPACT.format(num);
}

export function formatNumber(value: unknown, decimals: number = 2): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return num.toFixed(decimals);
}

export function formatPercent(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function formatVolume(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return VOLUME_FORMAT.format(num);
}

export function formatCompact(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return NUMBER_COMPACT.format(num);
}

export function formatChange(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  const sign = num > 0 ? "+" : "";
  return `${sign}${NUMBER_PRECISE.format(num)}`;
}

/**
 * Format a cell value based on column metadata unit.
 */
export function formatCellValue(value: unknown, unit?: string): string {
  if (value === null || value === undefined) return "—";

  if (unit === "₹") return formatCurrency(value);
  if (unit === "%") return formatPercent(value);

  const num = Number(value);
  if (!isNaN(num)) return NUMBER_PRECISE.format(num);

  return String(value);
}

/**
 * Get CSS class for positive/negative values.
 */
export function getChangeClass(value: unknown): string {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (isNaN(num) || num === 0) return "text-neutral";
  return num > 0 ? "text-positive" : "text-negative";
}
