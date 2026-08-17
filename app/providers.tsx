"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useGlobalMarketData } from "@/hooks/useGlobalMarketData";

function GlobalHooks() {
  useWebSocket();
  useGlobalMarketData();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 0, // Retries are handled by api.ts with exponential backoff
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalHooks />
      {children}
    </QueryClientProvider>
  );
}
