"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanSearch,
  History,
  Settings,
  Sparkles,
  Activity,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useThemeStore } from "@/stores/theme";
import { useWebSocketStore } from "@/stores/websocket";
import { NAV_ITEMS } from "@/constants/routes";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ScanSearch,
  History,
  Settings,
  Sparkles,
};

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const wsStatus = useWebSocketStore((s) => s.status);

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen w-[68px] flex-col items-center border-r py-4 transition-all duration-300"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-110"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        }}
      >
        <Activity className="h-5 w-5 text-white" />
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200"
              style={{
                backgroundColor: isActive ? "var(--color-accent-bg)" : "transparent",
                color: isActive ? "var(--color-accent)" : "var(--text-secondary)",
              }}
              title={item.label}
            >
              {isActive && (
                <span
                  className="absolute -left-[9px] h-5 w-[3px] rounded-r-full"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
              )}
              {Icon && <Icon className="h-5 w-5 transition-colors group-hover:text-[var(--text-primary)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-3 pb-2">
        {/* WebSocket status indicator */}
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor:
              wsStatus === "connected"
                ? "var(--color-live)"
                : wsStatus === "connecting"
                ? "var(--color-warning)"
                : "var(--color-negative)",
            boxShadow:
              wsStatus === "connected"
                ? "0 0 8px var(--color-live-glow)"
                : "none",
          }}
          title={`WebSocket: ${wsStatus}`}
        />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
