"use client";

import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { useThemeStore } from "@/stores/theme";
import { fetchHealth } from "@/services/data";
import { Moon, Sun, Monitor, Wifi, Database, Server, HardDrive } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const isGood = ["running", "connected", "healthy", "populated"].includes(status.toLowerCase());
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: isGood ? "var(--color-positive-bg)" : "var(--color-negative-bg)",
        color: isGood ? "var(--color-positive)" : "var(--color-negative)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: isGood ? "var(--color-positive)" : "var(--color-negative)" }}
      />
      {status}
    </span>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetchHealth();
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const health = healthQuery.data;

  return (
    <div className="flex flex-col">
      <TopBar title="Settings" />

      <div className="flex flex-col gap-6 p-6" style={{ maxWidth: "800px" }}>
        {/* Theme */}
        <div className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Appearance
          </h3>
          <div className="flex gap-3">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium transition-all"
                style={{
                  borderColor: theme === t ? "var(--color-accent)" : "var(--border-secondary)",
                  backgroundColor: theme === t ? "var(--color-accent-bg)" : "transparent",
                  color: theme === t ? "var(--color-accent)" : "var(--text-secondary)",
                }}
              >
                {t === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            System Health
          </h3>
          {health ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Server className="h-3.5 w-3.5" /> Backend
                </div>
                <StatusBadge status={health.backend} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Monitor className="h-3.5 w-3.5" /> Scheduler
                </div>
                <StatusBadge status={health.scheduler} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <HardDrive className="h-3.5 w-3.5" /> S3 Storage
                </div>
                <StatusBadge status={health.s3} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Database className="h-3.5 w-3.5" /> Cache
                </div>
                <StatusBadge status={health.cache.populated ? "Populated" : "Empty"} />
              </div>

              {health.cache.populated && (
                <div
                  className="mt-3 rounded-lg border p-3 text-xs"
                  style={{
                    borderColor: "var(--border-primary)",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <span>Instruments: <strong>{health.cache.instruments.toLocaleString()}</strong></span>
                    <span>Columns: <strong>{health.cache.columns}</strong></span>
                    <span>Snapshot ID: <strong>{health.cache.snapshot_id}</strong></span>
                    <span>Last Update: <strong>{health.cache.last_updated ? new Date(health.cache.last_updated).toLocaleTimeString() : "—"}</strong></span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Loading health data...</p>
          )}
        </div>
      </div>
    </div>
  );
}
