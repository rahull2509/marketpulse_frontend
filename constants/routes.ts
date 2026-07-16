export const ROUTES = {
  DASHBOARD: "/dashboard",
  STOCK: (symbol: string) => `/stock/${encodeURIComponent(symbol)}`,
  SCANNER: "/scanner",
  HISTORY: "/history",
  SETTINGS: "/settings",
  COMING_SOON: "/coming-soon",
} as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Scanner", href: ROUTES.SCANNER, icon: "ScanSearch" },
  { label: "History", href: ROUTES.HISTORY, icon: "History" },
  { label: "Coming Soon", href: ROUTES.COMING_SOON, icon: "Sparkles" },
  { label: "Settings", href: ROUTES.SETTINGS, icon: "Settings" },
] as const;
