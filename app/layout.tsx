import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MarketPulse — Live Market Analytics",
  description:
    "Real-time Indian equity market analytics platform with live screening, dynamic columns, and institutional-grade data visualization.",
  keywords: ["stock market", "NSE", "BSE", "live data", "screener", "analytics"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <div className="app-layout">
            <Sidebar />
            <div style={{ flex: 1, marginLeft: "var(--sidebar-width)" }}>
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
