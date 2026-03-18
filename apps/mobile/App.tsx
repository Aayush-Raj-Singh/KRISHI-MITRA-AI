import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { authApi, withRetry } from "./src/services/api";
import { syncOfflineQueue } from "./src/services/offlineSync";
import { useAuthStore } from "./src/store/authStore";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { LoadingScreen } from "./src/components/LoadingScreen";

const App = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

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

  if (!hydrated) {
    return <LoadingScreen label="Loading mobile workspace..." />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;
