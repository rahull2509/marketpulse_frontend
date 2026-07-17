"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanSearch,
  Clock,
  Settings,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { useWebSocketStore } from "@/stores/websocket";
import { NAV_ITEMS } from "@/constants/routes";
import { useState } from "react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ScanSearch,
  Clock,
  Settings,
};

function NavItem({
  href,
  icon: iconName,
  label,
  isActive,
}: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}) {
  const Icon = ICON_MAP[iconName];
  const [showTooltip, setShowTooltip] = useState(false);

  if (!Icon) return null;

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: "var(--radius-md)",
          color: isActive ? "var(--color-accent)" : "var(--text-tertiary)",
          backgroundColor: isActive ? "var(--color-accent-bg)" : "transparent",
          position: "relative",
          transition: "all var(--transition-fast)",
        }}
        onMouseOver={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "var(--bg-hover)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
        onMouseOut={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-tertiary)";
          }
        }}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span
            style={{
              position: "absolute",
              left: -14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: 24,
              borderRadius: "0 3px 3px 0",
              backgroundColor: "var(--color-accent)",
            }}
          />
        )}
        <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
      </Link>

      {/* Tooltip */}
      {showTooltip && (
        <div className="tooltip-content">{label}</div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { status: wsStatus } = useWebSocketStore();
  const isConnected = wsStatus === "connected";

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          marginBottom: "var(--sp-5)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-accent)",
          flexShrink: 0,
        }}
      >
        <Activity size={20} color="#ffffff" strokeWidth={2.5} />
      </div>

      {/* Navigation */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-1)",
          flex: 1,
        }}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      {/* Connection status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: "var(--sp-2)",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: isConnected ? "var(--color-live)" : "var(--text-muted)",
            boxShadow: isConnected ? "0 0 6px var(--color-live-glow)" : "none",
            animation: isConnected ? "pulse-live 2s ease-in-out infinite" : "none",
          }}
          title={isConnected ? "WebSocket Connected" : "Disconnected"}
        />
      </div>
    </aside>
  );
}
