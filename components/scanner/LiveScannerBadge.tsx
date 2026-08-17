"use client";

import { useScannerStore } from "@/stores/scanner";

export function LiveScannerBadge({ isLive }: { isLive: boolean }) {
  const liveUpdateCount = useScannerStore((s) => s.liveUpdateCount);
  const lastUpdated = useScannerStore((s) => s.lastUpdated);

  if (!isLive) return null;

  return (
    <div className="card-compact" style={{ minWidth: 140 }}>
      <span style={{ 
        fontSize: 10, 
        fontWeight: 500, 
        color: "var(--text-tertiary)", 
        textTransform: "uppercase", 
        letterSpacing: "0.04em", 
        display: "flex", 
        alignItems: "center", 
        gap: 4, 
        marginBottom: 4 
      }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "var(--color-live)",
            boxShadow: "0 0 6px var(--color-live-glow)",
            animation: "pulse-live 2s ease-in-out infinite",
            display: "inline-block",
          }}
        />
        Live Updates
      </span>
      <span className="font-tabular" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
        {liveUpdateCount} cycles
        {lastUpdated && (
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>
            {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </span>
    </div>
  );
}
