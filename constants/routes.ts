export const ROUTES = {
  DASHBOARD: "/dashboard",
  STOCK: (symbol: string) => `/stock/${encodeURIComponent(symbol)}`,
  SCANNER: "/scanner",
  HISTORY: "/history",
  SETTINGS: "/settings",
} as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Scanner", href: ROUTES.SCANNER, icon: "ScanSearch" },
  { label: "History", href: ROUTES.HISTORY, icon: "Clock" },
  { label: "Settings", href: ROUTES.SETTINGS, icon: "Settings" },
] as const;
