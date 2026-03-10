import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import i18n from "./i18n";
import theme from "./styles/theme";
import { store } from "./store";
import { initOfflineSync } from "./services/api";
import "./styles/global.css";

registerSW({ immediate: true });
initOfflineSync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
