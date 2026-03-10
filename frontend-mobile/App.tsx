import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";

import AdvisoryChatScreen from "./src/screens/AdvisoryChatScreen";
import CropRecommendationScreen from "./src/screens/CropRecommendationScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OutcomeFeedbackScreen from "./src/screens/OutcomeFeedbackScreen";
import PriceForecastScreen from "./src/screens/PriceForecastScreen";
import WaterOptimizationScreen from "./src/screens/WaterOptimizationScreen";
import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "./src/services/offline";

type Screen = "login" | "dashboard" | "advisory" | "crop" | "price" | "water" | "feedback";

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("login");
  const [accessToken, setAccessToken] = useState<string>("");
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      try {
        const token = await getStoredAccessToken();
        if (!mounted) return;
        if (token) {
          setAccessToken(token);
          setScreen("dashboard");
        }
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    };
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  if (bootstrapping) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#1b6b3a" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      {screen === "login" && (
        <LoginScreen
          onLoggedIn={async (token) => {
            setAccessToken(token);
            setScreen("dashboard");
            await setStoredAccessToken(token);
          }}
        />
      )}
      {screen === "dashboard" && (
        <DashboardScreen
          accessToken={accessToken}
          onOpenCrop={() => setScreen("crop")}
          onOpenPrice={() => setScreen("price")}
          onOpenWater={() => setScreen("water")}
          onOpenAdvisory={() => setScreen("advisory")}
          onOpenFeedback={() => setScreen("feedback")}
          onLogout={async () => {
            setAccessToken("");
            setScreen("login");
            await clearStoredAccessToken();
          }}
        />
      )}
      {screen === "advisory" && (
        <AdvisoryChatScreen accessToken={accessToken} onBack={() => setScreen("dashboard")} />
      )}
      {screen === "crop" && (
        <CropRecommendationScreen accessToken={accessToken} onBack={() => setScreen("dashboard")} />
      )}
      {screen === "price" && (
        <PriceForecastScreen accessToken={accessToken} onBack={() => setScreen("dashboard")} />
      )}
      {screen === "water" && (
        <WaterOptimizationScreen accessToken={accessToken} onBack={() => setScreen("dashboard")} />
      )}
      {screen === "feedback" && (
        <OutcomeFeedbackScreen accessToken={accessToken} onBack={() => setScreen("dashboard")} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f8ef",
  },
});

export default App;
