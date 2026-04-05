import React, { useMemo, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import { HEADER_BADGES } from "../data/layoutPortalData";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { openAppRoute } from "../navigation/routeHelpers";
import { useAuthStore } from "../store/authStore";
import { colors, radius, shadows, spacing, typography } from "../theme";

type NavItem = {
  label: string;
  route: string;
  params?: Record<string, string | undefined>;
};

const currentSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return "Kharif";
  if (month >= 11 || month <= 3) return "Rabi";
  return "Zaid";
};

const formatRoleLabel = (role?: string | null) =>
  String(role || "guest")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getInitials = (name?: string | null) =>
  (name || "KM")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "KM";

export const AppChrome = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryNav = useMemo<NavItem[]>(() => {
    if (!accessToken) {
      return [
        { label: "Home", route: "Landing" },
        { label: "Sign In", route: "Login" },
        { label: "Register", route: "Register" },
      ];
    }

    return [
      { label: "Dashboard", route: "Dashboard" },
      { label: "Portal", route: "Portal" },
      { label: "Advisory", route: "Advisory" },
      { label: "Market Directory", route: "MarketDirectory" },
      { label: "Helpdesk", route: "Helpdesk" },
      { label: "Notices", route: "Notices" },
      { label: "Profile", route: "Profile" },
    ];
  }, [accessToken]);

  const adminExtras = useMemo<NavItem[]>(() => {
    if (user?.role === "admin") {
      return [
        { label: "Master Data", route: "AdminMasterData" },
        { label: "Audit Logs", route: "AuditLogs" },
        { label: "Data Quality", route: "DataQuality" },
      ];
    }
    if (user?.role === "extension_officer") {
      return [{ label: "Officer Workflow", route: "OfficerWorkflow" }];
    }
    return [];
  }, [user?.role]);

  const serviceNav = useMemo<NavItem[]>(() => {
    if (!accessToken) {
      return [];
    }
    return [
      { label: "Services Overview", route: "Services" },
      { label: "Farm Operations", route: "CropRecommendation" },
      { label: "Water Optimization", route: "WaterOptimization" },
      { label: "Market Intelligence", route: "PriceForecast" },
      { label: "Price + Arrivals", route: "PriceArrivalDashboard" },
      { label: "Trend Analytics", route: "TrendAnalytics" },
      { label: "Market Alerts", route: "MarketAlerts" },
      { label: "Disease Detection", route: "Disease" },
      { label: "Outcome Feedback", route: "Feedback" },
      { label: "Modern Farming", route: "ModernFarming" },
    ];
  }, [accessToken]);

  const quickNav = useMemo<NavItem[]>(() => {
    if (!accessToken) {
      return primaryNav;
    }
    return [
      { label: "Dashboard", route: "Dashboard" },
      { label: "Advisory", route: "Advisory" },
      { label: "Notices", route: "Notices" },
      { label: "Services", route: "Services" },
    ];
  }, [accessToken, primaryNav]);

  const activeRoute = route.name;
  const initials = getInitials(user?.name);
  const season = currentSeason();

  const routeGroups: Record<string, string[]> = {
    Dashboard: ["Dashboard"],
    Advisory: ["Advisory"],
    Notices: ["Notices"],
    Services: [
      "Services",
      "FarmOperations",
      "CropRecommendation",
      "WaterOptimization",
      "MarketIntelligence",
      "PriceForecast",
      "PriceArrivalDashboard",
      "TrendAnalytics",
      "MarketAlerts",
      "Disease",
      "Feedback",
      "ModernFarming",
    ],
    Portal: ["Portal"],
    Profile: ["Profile"],
    MarketDirectory: ["MarketDirectory"],
    Helpdesk: ["Helpdesk"],
    OfficerWorkflow: ["OfficerWorkflow"],
    AdminMasterData: ["AdminMasterData"],
    AuditLogs: ["AuditLogs"],
    DataQuality: ["DataQuality"],
    Home: ["Landing"],
    Login: ["Login"],
    Register: ["Register"],
  };

  const isActive = (routeName: string) =>
    (routeGroups[routeName] || [routeName]).includes(activeRoute);

  const translatedPrimaryNav = useMobileTranslatedContent(primaryNav, {
    ignoreKeys: ["route", "params"],
  });
  const translatedAdminExtras = useMobileTranslatedContent(adminExtras, {
    ignoreKeys: ["route", "params"],
  });
  const translatedServiceNav = useMobileTranslatedContent(serviceNav, {
    ignoreKeys: ["route", "params"],
  });
  const translatedQuickNav = useMobileTranslatedContent(quickNav, {
    ignoreKeys: ["route", "params"],
  });
  const chromeCopy = useMobileTranslatedContent({
    brandEyebrow: "KrishiMitra Portal",
    brandTitle: "KrishiMitra AI",
    brandHeading: "Agriculture Services Portal",
    brandSubtitle: "Rural decision intelligence powered by AI",
    metaSeason: "Season",
    metaStatus: "Status",
    metaMode: "Mode",
    metaLight: "Light",
    statusConnected: "Connected",
    statusPublic: "Public",
    guestAccess: "Guest access",
    tapToSignIn: "Tap to sign in",
    openFeatureMenu: "Open feature menu",
    seasonChip: `Season: ${season}`,
    liveUpdates: "Live updates",
    guest: "Guest",
    menu: "Menu",
    roleTools: "Role tools",
    services: "Services",
    logout: "Logout",
    publicUser: "Public user",
    roleLabel: formatRoleLabel(user?.role),
    liveSummaryAuthenticated: `${
      user?.location || "Field-ready"
    } | ${formatRoleLabel(user?.role)} workspace | Offline sync ready`,
    liveSummaryPublic: "Public portal active | Sign in, register, and advisory access available",
  });
  const liveSummary = accessToken
    ? chromeCopy.liveSummaryAuthenticated
    : chromeCopy.liveSummaryPublic;

  const handleExternal = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };

  const handleNav = (item: NavItem) => {
    setMenuOpen(false);
    openAppRoute(navigation, item.route, item.params);
  };

  const openProfile = () => {
    if (accessToken) {
      openAppRoute(navigation, "Profile");
      return;
    }
    openAppRoute(navigation, "Login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <View style={styles.heroContent}>
            <View style={styles.brandPanel}>
              <View style={styles.brandRow}>
                <Image
                  source={require("../../assets/krishimitra-ai-icon-transparent.png")}
                  style={styles.logo}
                />
                <View style={styles.brandCopy}>
                  <Text style={styles.brandEyebrow}>{chromeCopy.brandEyebrow}</Text>
                  <Text style={styles.brandTitle}>{chromeCopy.brandTitle}</Text>
                  <Text style={styles.brandHeading}>{chromeCopy.brandHeading}</Text>
                  <Text style={styles.brandSubtitle}>{chromeCopy.brandSubtitle}</Text>
                </View>
              </View>
              <View style={styles.brandDivider} />
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>{chromeCopy.metaSeason}</Text>
                  <Text style={styles.metaValue}>{season}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>{chromeCopy.metaStatus}</Text>
                  <Text style={styles.metaValue}>
                    {accessToken ? chromeCopy.statusConnected : chromeCopy.statusPublic}
                  </Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaLabel}>{chromeCopy.metaMode}</Text>
                  <Text style={styles.metaValue}>{chromeCopy.metaLight}</Text>
                </View>
              </View>
            </View>

            <View style={styles.utilityPanel}>
              <Pressable
                accessibilityRole="button"
                onPress={openProfile}
                style={({ pressed }) => [styles.userCard, pressed ? styles.userCardPressed : null]}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{initials}</Text>
                </View>
                <View style={styles.userCopy}>
                  <Text numberOfLines={1} style={styles.userName}>
                    {user?.name || chromeCopy.guestAccess}
                  </Text>
                  <Text numberOfLines={1} style={styles.userRole}>
                    {accessToken ? chromeCopy.roleLabel : chromeCopy.tapToSignIn}
                  </Text>
                </View>
                <MaterialIcons color={colors.white} name="chevron-right" size={20} />
              </Pressable>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.headerBadgeRow}
              >
                {HEADER_BADGES.map((badge) => (
                  <Pressable
                    key={badge.name}
                    accessibilityRole="button"
                    onPress={() => handleExternal(badge.url)}
                    style={({ pressed }) => [
                      styles.headerBadgeCard,
                      pressed ? styles.badgePressed : null,
                    ]}
                  >
                    <Image
                      source={badge.logoSource}
                      resizeMode="contain"
                      style={styles.headerBadgeImage}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        <View style={styles.ribbon}>
          <View style={styles.ribbonTopRow}>
            <Pressable
              accessibilityLabel={chromeCopy.openFeatureMenu}
              accessibilityRole="button"
              onPress={() => setMenuOpen(true)}
              style={({ pressed }) => [
                styles.menuButton,
                pressed ? styles.menuButtonPressed : null,
              ]}
            >
              <MaterialIcons color={colors.ribbonDeep} name="menu" size={26} />
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickNavRow}
            >
              {translatedQuickNav.map((item) => {
                const active = isActive(item.route);
                return (
                  <Pressable
                    key={item.route}
                    accessibilityRole="button"
                    onPress={() => handleNav(item)}
                    style={({ pressed }) => [
                      styles.quickNavButton,
                      active ? styles.quickNavButtonActive : null,
                      pressed ? styles.quickNavButtonPressed : null,
                    ]}
                  >
                    <Text
                      style={[styles.quickNavLabel, active ? styles.quickNavLabelActive : null]}
                    >
                      {item.label}
                    </Text>
                    {item.route === "Services" ? (
                      <MaterialIcons
                        color={active ? colors.primaryDark : colors.text}
                        name="keyboard-arrow-down"
                        size={18}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.liveRow}>
            <View style={styles.seasonChip}>
              <Text style={styles.seasonChipText}>{chromeCopy.seasonChip}</Text>
            </View>
            <View style={styles.liveCard}>
              <View style={styles.liveHeaderRow}>
                <View style={styles.liveTitleRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveTitle}>{chromeCopy.liveUpdates}</Text>
                </View>
                <View style={styles.liveStatusChip}>
                  <Text style={styles.liveStatusChipText}>
                    {accessToken ? chromeCopy.statusConnected : chromeCopy.guest}
                  </Text>
                </View>
              </View>
              <Text numberOfLines={2} style={styles.liveSummary}>
                {liveSummary}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Modal animationType="slide" transparent visible={menuOpen} onRequestClose={closeMenu}>
        <View style={styles.drawerBackdrop}>
          <Pressable onPress={closeMenu} style={styles.drawerScrim} />
          <View style={styles.drawerSheet}>
            <View style={styles.drawerHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={openProfile}
                style={({ pressed }) => [
                  styles.drawerUserCard,
                  pressed ? styles.userCardPressed : null,
                ]}
              >
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>{initials}</Text>
                </View>
                <View style={styles.drawerUserCopy}>
                  <Text numberOfLines={1} style={styles.drawerUserName}>
                    {user?.name || chromeCopy.guestAccess}
                  </Text>
                  <Text style={styles.drawerUserRole}>
                    {accessToken ? chromeCopy.roleLabel : chromeCopy.publicUser}
                  </Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={closeMenu} style={styles.closeButton}>
                <MaterialIcons color={colors.primaryDark} name="close" size={24} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.drawerContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.drawerSectionLabel}>{chromeCopy.menu}</Text>
              {translatedPrimaryNav.map((item) => (
                <Pressable
                  key={item.route}
                  accessibilityRole="button"
                  onPress={() => handleNav(item)}
                  style={({ pressed }) => [
                    styles.drawerItem,
                    isActive(item.route) ? styles.drawerItemActive : null,
                    pressed ? styles.drawerItemPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.drawerItemText,
                      isActive(item.route) ? styles.drawerItemTextActive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <MaterialIcons
                    color={isActive(item.route) ? colors.primaryDark : colors.mutedText}
                    name="chevron-right"
                    size={18}
                  />
                </Pressable>
              ))}

              {adminExtras.length ? (
                <>
                  <View style={styles.drawerDivider} />
                  <Text style={styles.drawerSectionLabel}>{chromeCopy.roleTools}</Text>
                  {translatedAdminExtras.map((item) => (
                    <Pressable
                      key={item.route}
                      accessibilityRole="button"
                      onPress={() => handleNav(item)}
                      style={({ pressed }) => [
                        styles.drawerItem,
                        isActive(item.route) ? styles.drawerItemActive : null,
                        pressed ? styles.drawerItemPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.drawerItemText,
                          isActive(item.route) ? styles.drawerItemTextActive : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <MaterialIcons
                        color={isActive(item.route) ? colors.primaryDark : colors.mutedText}
                        name="chevron-right"
                        size={18}
                      />
                    </Pressable>
                  ))}
                </>
              ) : null}

              {serviceNav.length ? (
                <>
                  <View style={styles.drawerDivider} />
                  <Text style={styles.drawerSectionLabel}>{chromeCopy.services}</Text>
                  {translatedServiceNav.map((item) => (
                    <Pressable
                      key={item.route}
                      accessibilityRole="button"
                      onPress={() => handleNav(item)}
                      style={({ pressed }) => [
                        styles.drawerItem,
                        isActive(item.route) ? styles.drawerItemActive : null,
                        pressed ? styles.drawerItemPressed : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.drawerItemText,
                          isActive(item.route) ? styles.drawerItemTextActive : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <MaterialIcons
                        color={isActive(item.route) ? colors.primaryDark : colors.mutedText}
                        name="chevron-right"
                        size={18}
                      />
                    </Pressable>
                  ))}
                </>
              ) : null}
            </ScrollView>

            {accessToken ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  closeMenu();
                  logout();
                }}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed ? styles.drawerItemPressed : null,
                ]}
              >
                <MaterialIcons color={colors.primary} name="logout" size={20} />
                <Text style={styles.logoutText}>{chromeCopy.logout}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  heroCard: {
    overflow: "hidden",
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    ...shadows.hero,
  },
  heroContent: {
    gap: spacing.md,
    padding: spacing.md,
  },
  heroGlowLarge: {
    position: "absolute",
    right: -42,
    top: -46,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroGlowSmall: {
    position: "absolute",
    left: -18,
    bottom: -42,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  brandPanel: {
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  logo: {
    width: 52,
    height: 52,
    marginTop: 2,
  },
  brandCopy: {
    flex: 1,
    gap: 2,
  },
  brandEyebrow: {
    color: "#cfe4d1",
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  brandTitle: {
    color: colors.white,
    fontFamily: typography.headingFont,
    fontSize: 29,
    lineHeight: 38,
  },
  brandHeading: {
    color: colors.white,
    fontSize: typography.titleSm,
    fontWeight: "800",
  },
  brandSubtitle: {
    color: "#d6ebd8",
    fontSize: typography.caption,
    lineHeight: 18,
  },
  brandDivider: {
    width: 132,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: colors.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  metaLabel: {
    color: "#d6ebd8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  utilityPanel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: colors.glassStrong,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: spacing.sm,
  },
  userCardPressed: {
    opacity: 0.9,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
  userCopy: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
  userRole: {
    color: "#d5ead8",
    fontSize: typography.caption,
  },
  headerBadgeRow: {
    gap: spacing.sm,
  },
  headerBadgeCard: {
    width: 108,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  badgePressed: {
    opacity: 0.92,
  },
  headerBadgeImage: {
    width: "100%",
    height: 32,
  },
  ribbon: {
    borderRadius: radius.xl,
    backgroundColor: colors.ribbon,
    borderWidth: 1,
    borderColor: "#b0ce9d",
    padding: spacing.md,
    gap: spacing.md,
  },
  ribbonTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonPressed: {
    opacity: 0.88,
  },
  quickNavRow: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  quickNavButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.68)",
    borderWidth: 1,
    borderColor: "rgba(39,93,52,0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  quickNavButtonActive: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  quickNavButtonPressed: {
    opacity: 0.9,
  },
  quickNavLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  quickNavLabelActive: {
    color: colors.primaryDark,
  },
  liveRow: {
    gap: spacing.sm,
  },
  seasonChip: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.ribbonDeep,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  seasonChipText: {
    color: colors.inkInverse,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  liveCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  liveHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  liveTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#a7f08d",
  },
  liveTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
  liveStatusChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  liveStatusChipText: {
    color: colors.inkInverse,
    fontSize: 12,
    fontWeight: "700",
  },
  liveSummary: {
    color: "#e0f1e2",
    fontSize: typography.caption,
    lineHeight: 18,
  },
  drawerBackdrop: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(8, 22, 12, 0.32)",
  },
  drawerScrim: {
    flex: 1,
  },
  drawerSheet: {
    width: "84%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
    gap: spacing.md,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  drawerUserCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.sm,
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerAvatarText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "800",
  },
  drawerUserCopy: {
    flex: 1,
    gap: 2,
  },
  drawerUserName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  drawerUserRole: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  drawerContent: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  drawerSectionLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: spacing.xs,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  drawerItemActive: {
    backgroundColor: colors.primarySoft,
  },
  drawerItemPressed: {
    opacity: 0.9,
  },
  drawerItemText: {
    color: colors.text,
    fontSize: typography.bodyLg,
    fontWeight: "600",
  },
  drawerItemTextActive: {
    color: colors.primaryDark,
    fontWeight: "800",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingVertical: 14,
  },
  logoutText: {
    color: colors.primary,
    fontSize: typography.bodyLg,
    fontWeight: "800",
  },
});
