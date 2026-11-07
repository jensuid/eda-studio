import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./app/App";
import "./shared/tokens.css";

// P2-2: QueryClient eksplisit per kartu — staleTime 3 dtk, retry 1,
// refetchOnWindowFocus off (desktop shell; fokus jendela ≠ data baru).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
