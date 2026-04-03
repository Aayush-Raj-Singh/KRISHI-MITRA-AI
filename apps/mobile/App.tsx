import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authApi, withRetry } from "./src/services/api";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { syncOfflineQueue } from "./src/services/offlineSync";
import { initClientErrorTracking } from "./src/services/errorReporter";
import { useAuthStore } from "./src/store/authStore";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { LoadingScreen } from "./src/components/LoadingScreen";
import i18n, { initMobileI18n } from "./src/i18n";
import { normalizeAppLanguage, setPreferredLanguage } from "./src/services/languageStorage";

const App = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initClientErrorTracking();
  }, []);

  useEffect(() => {
    let active = true;

    void initMobileI18n()
      .then(() => {
        if (active) {
          setI18nReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setI18nReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!i18nReady || !user?.language) {
      return;
    }
    const nextLanguage = normalizeAppLanguage(user.language);
    if (i18n.language !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage).catch(() => undefined);
    }
    void setPreferredLanguage(nextLanguage).catch(() => undefined);
  }, [i18nReady, user?.language]);

  useEffect(() => {
    if (!hydrated || !accessToken || user) {
      return;
    }

    withRetry(() => authApi.getCurrentUser())
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        logout();
      });
  }, [accessToken, hydrated, logout, setUser, user]);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }
    void syncOfflineQueue().catch(() => undefined);
  }, [accessToken, hydrated]);

  useEffect(() => {
    if (!hydrated || !accessToken) {
      return;
    }

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void syncOfflineQueue().catch(() => undefined);
      }
    });
    const netInfoSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void syncOfflineQueue().catch(() => undefined);
      }
    });

    return () => {
      appStateSubscription.remove();
      netInfoSubscription();
    };
  }, [accessToken, hydrated]);

  if (!hydrated || !i18nReady) {
    return <LoadingScreen label="Loading mobile workspace..." />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <I18nextProvider i18n={i18n}>
        <AppErrorBoundary>
          <AppNavigator />
        </AppErrorBoundary>
      </I18nextProvider>
    </SafeAreaProvider>
  );
};

export default App;
