import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";
import { AdvisoryScreen } from "../screens/AdvisoryScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { DiseaseDetectionScreen } from "../screens/DiseaseDetectionScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RecommendationsScreen } from "../screens/RecommendationsScreen";
import { RegisterScreen } from "../screens/RegisterScreen";

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
    text: colors.text
  }
};

const AppTabs = () => (
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
        paddingTop: 8
      },
      tabBarIcon: ({ color, size }) => {
        const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
          Dashboard: "dashboard",
          Plans: "eco",
          Advisory: "support-agent",
          Disease: "image-search",
          Feedback: "rate-review"
        };
        return <MaterialIcons color={color} name={iconMap[route.name]} size={size} />;
      }
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Plans" component={RecommendationsScreen} />
    <Tab.Screen name="Advisory" component={AdvisoryScreen} />
    <Tab.Screen name="Disease" component={DiseaseDetectionScreen} />
    <Tab.Screen name="Feedback" component={FeedbackScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {accessToken ? (
          <Stack.Screen name="Main" component={AppTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
