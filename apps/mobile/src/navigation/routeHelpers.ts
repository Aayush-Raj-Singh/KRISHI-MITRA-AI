export const tabRoutes = new Set(["Dashboard", "Services", "Advisory", "Disease", "Profile"]);

export const openAppRoute = (navigation: any, route: string, params?: Record<string, unknown>) => {
  if (tabRoutes.has(route)) {
    navigation.navigate("Main", { screen: route, params });
    return;
  }
  navigation.navigate(route, params);
};
