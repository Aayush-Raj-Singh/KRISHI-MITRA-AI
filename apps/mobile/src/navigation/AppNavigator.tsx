import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";
import { AdvisoryScreen } from "../screens/AdvisoryScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DiseaseDetectionScreen } from "../screens/DiseaseDetectionScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { FarmOperationsScreen } from "../screens/FarmOperationsScreen";
import { ForbiddenScreen } from "../screens/ForbiddenScreen";
import { HelpdeskScreen } from "../screens/HelpdeskScreen";
import { OfficerWorkflowScreen } from "../screens/OfficerWorkflowScreen";
import { LandingScreen } from "../screens/LandingScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { AuditLogsScreen } from "../screens/AuditLogsScreen";
import { AdminMasterDataScreen } from "../screens/AdminMasterDataScreen";
import { DataQualityScreen } from "../screens/DataQualityScreen";
import { MarketDirectoryScreen } from "../screens/MarketDirectoryScreen";
import { MarketIntelligenceScreen } from "../screens/MarketIntelligenceScreen";
import { ModernFarmingScreen } from "../screens/ModernFarmingScreen";
import { NoticesScreen } from "../screens/NoticesScreen";
import { PortalScreen } from "../screens/PortalScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { ResetPasswordScreen } from "../screens/ResetPasswordScreen";
import { ServicesScreen } from "../screens/ServicesScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
  },
};

const AppTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
            Dashboard: "dashboard",
            Services: "dashboard-customize",
            Advisory: "support-agent",
            Disease: "image-search",
            Profile: "manage-accounts",
          };
          return <MaterialIcons color={color} name={iconMap[route.name]} size={size} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: t("nav.dashboard") }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ tabBarLabel: t("layout.services") }}
      />
      <Tab.Screen
        name="Advisory"
        component={AdvisoryScreen}
        options={{ tabBarLabel: t("nav.advisory") }}
      />
      <Tab.Screen
        name="Disease"
        component={DiseaseDetectionScreen}
        options={{
          tabBarLabel: t("services_page.disease_detection_title", {
            defaultValue: "Disease Detection",
          }),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t("profile.title") }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {accessToken ? (
          <Stack.Screen name="Main" component={AppTabs} />
        ) : (
          <Stack.Screen name="Landing" component={LandingScreen} />
        )}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="FarmOperations" component={FarmOperationsScreen} />
        <Stack.Screen
          name="CropRecommendation"
          component={FarmOperationsScreen}
          initialParams={{ initialTool: "crop" }}
        />
        <Stack.Screen
          name="WaterOptimization"
          component={FarmOperationsScreen}
          initialParams={{ initialTool: "water" }}
        />
        <Stack.Screen name="MarketIntelligence" component={MarketIntelligenceScreen} />
        <Stack.Screen
          name="PriceForecast"
          component={MarketIntelligenceScreen}
          initialParams={{ initialTab: "price" }}
        />
        <Stack.Screen
          name="PriceArrivalDashboard"
          component={MarketIntelligenceScreen}
          initialParams={{ initialTab: "arrivals" }}
        />
        <Stack.Screen
          name="TrendAnalytics"
          component={MarketIntelligenceScreen}
          initialParams={{ initialTab: "trends" }}
        />
        <Stack.Screen
          name="MarketAlerts"
          component={MarketIntelligenceScreen}
          initialParams={{ initialTab: "alerts" }}
        />
        <Stack.Screen name="MarketDirectory" component={MarketDirectoryScreen} />
        <Stack.Screen name="Helpdesk" component={HelpdeskScreen} />
        <Stack.Screen name="OfficerWorkflow" component={OfficerWorkflowScreen} />
        <Stack.Screen name="AdminMasterData" component={AdminMasterDataScreen} />
        <Stack.Screen name="DataQuality" component={DataQualityScreen} />
        <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="Portal" component={PortalScreen} />
        <Stack.Screen name="Notices" component={NoticesScreen} />
        <Stack.Screen name="ModernFarming" component={ModernFarmingScreen} />
        <Stack.Screen name="Forbidden" component={ForbiddenScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
