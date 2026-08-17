export const ROUTES = {
  DASHBOARD: "/dashboard",
  STOCK: (symbol: string) => `/stock/${encodeURIComponent(symbol)}`,
  SCANNER: "/scanner",
  SCANNER_LTD: "/scanner-ltd",
  HISTORY: "/history",
  SETTINGS: "/settings",
} as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Scanner MoM", href: ROUTES.SCANNER, icon: "ScanSearch" },
  { label: "Scanner LTD", href: ROUTES.SCANNER_LTD, icon: "CalendarClock" },
  { label: "History", href: ROUTES.HISTORY, icon: "Clock" },
  { label: "Settings", href: ROUTES.SETTINGS, icon: "Settings" },
] as const;
