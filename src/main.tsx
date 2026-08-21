import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ThemeProvider } from "./lib/theme/ThemeProvider";
import "./styles/globals.css";

/**
 * One query client for the app. Retries are limited to one because the backend is
 * local: a failure is almost always "the backend is down", and hammering it just
 * delays the error the user needs to see.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 5_000,
    },
    mutations: { retry: 0 },
  },
});

const container = document.getElementById("root");
if (!container) throw new Error("#root element is missing from index.html");

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
