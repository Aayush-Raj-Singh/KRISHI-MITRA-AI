import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeModeProvider } from "./hooks/useTheme";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { registerSW } from "virtual:pwa-register";

import App from "./App";
import i18n from "./i18n";
import { store } from "./store";
import AppErrorBoundary from "./components/common/AppErrorBoundary";
import { initOfflineSync } from "./services/api";
import { initApiClientSync } from "./services/apiClient";
import { initDiseaseQueueSync } from "./services/disease";
import { initClientErrorTracking, reportClientError } from "./services/errorReporter";
import { initPushNotifications } from "./services/native";
import { LocationProvider } from "./context/LocationContext";
import "./styles/global.css";

registerSW({ immediate: true });
initOfflineSync();
initApiClientSync();
initDiseaseQueueSync();
initPushNotifications();
initClientErrorTracking();

const TypedI18nextProvider = I18nextProvider as React.ComponentType<
  React.PropsWithChildren<{ i18n: typeof i18n }>
>;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportClientError(error, {
        type: "react-query",
        queryKey: query.queryKey,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      reportClientError(error, {
        type: "react-query-mutation",
        mutationKey: mutation.options.mutationKey,
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TypedI18nextProvider i18n={i18n}>
          <ThemeModeProvider>
            <LocationProvider>
              <AppErrorBoundary>
                <App />
              </AppErrorBoundary>
            </LocationProvider>
          </ThemeModeProvider>
        </TypedI18nextProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
