"use client";

import { TopBar } from "@/components/layout/TopBar";
import {
  Sparkles,
  BarChart3,
  Bell,
  Target,
  LineChart,
  Layers,
  Zap,
} from "lucide-react";

const UPCOMING_FEATURES = [
  {
    icon: BarChart3,
    title: "Advanced Charting",
    description: "Interactive candlestick charts with TradingView-style indicators, drawing tools, and multi-timeframe analysis.",
    eta: "Q3 2026",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    description: "Real-time notifications via email, SMS, or push when stocks hit your target price or custom conditions.",
    eta: "Q3 2026",
  },
  {
    icon: Target,
    title: "Portfolio Tracker",
    description: "Track your holdings with P&L calculations, sector allocation, and performance benchmarking against indices.",
    eta: "Q3 2026",
  },
  {
    icon: LineChart,
    title: "Technical Indicators Engine",
    description: "RSI, MACD, Bollinger Bands, VWAP, SMA/EMA computed server-side and integrated into the scanner.",
    eta: "Q4 2026",
  },
  {
    icon: Layers,
    title: "Heatmap View",
    description: "Visual market heatmap showing sector performance, volume intensity, and market breadth at a glance.",
    eta: "Q4 2026",
  },
  {
    icon: Zap,
    title: "Options Chain Analytics",
    description: "Live options chain with OI analysis, PCR trends, max pain calculation, and strategy builder.",
    eta: "Q1 2027",
  },
];

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col">
      <TopBar title="Coming Soon" />

      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              What&apos;s Coming Next
            </h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Planned features and enhancements for MarketPulse
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card flex flex-col gap-3 p-5 transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: "var(--color-accent-bg)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {feature.eta}
                  </span>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
