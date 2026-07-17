"use client";

import { TopNavigation } from "@/components/layout/TopNavigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ComingSoonPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TopNavigation title="Coming Soon" />
      <div
        className="app-content"
        style={{
          padding: "var(--sp-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - var(--topnav-height))",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 12 }}>
            This feature is coming soon.
          </p>
          <Link href="/settings" className="btn btn-secondary">
            <ArrowLeft size={14} />
            View Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
