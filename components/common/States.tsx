"use client";

import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading market data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader2
        className="mb-4 h-8 w-8 animate-spin"
        style={{ color: "var(--color-accent)" }}
      />
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border py-20"
      style={{
        borderColor: "var(--border-primary)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--color-negative-bg)" }}
      >
        <span className="text-2xl">⚠</span>
      </div>
      <p className="mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {message}
      </p>
      <p className="mb-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
        Please check your connection and try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border py-20"
      style={{
        borderColor: "var(--border-primary)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        <span className="text-2xl">📊</span>
      </div>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
    </div>
  );
}

export function SkeletonTable({ rows = 10, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-container">
      <table className="market-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="skeleton h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx}>
                  <div className="skeleton h-3" style={{ width: colIdx === 0 ? "80px" : "60px" }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
