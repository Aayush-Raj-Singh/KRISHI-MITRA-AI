import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { importantLinks, notices } from "../data/appContent";
import { openAppRoute } from "../navigation/routeHelpers";
import { colors, radius, spacing, typography } from "../theme";

export const NoticesScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScreenShell
      title="Notices and links"
      subtitle="The same noticeboard and important-link hierarchy from the web dashboard, reorganized for mobile reading."
      eyebrow="Updates"
      heroImageSource={require("../../assets/hero-slide-05.jpg")}
      heroBadges={["Campaign Notices", "Important Links", "Program Updates"]}
    >
      <SectionCard
        title="Notice board"
        subtitle="Recent program updates, campaign calls, and advisory bulletins."
      >
        <View style={styles.list}>
          {notices.map((notice) => (
            <View key={notice.title} style={styles.noticeRow}>
              <View style={styles.dot} />
              <View style={styles.noticeCopy}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeDate}>{notice.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Important links"
        subtitle="Shortcuts back into the main service workspaces."
      >
        <View style={styles.linkList}>
          {importantLinks.map((link) => (
            <Pressable
              key={link.label}
              onPress={() => openAppRoute(navigation, link.route)}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>{link.label}</Text>
              <Text style={styles.linkMeta}>{link.description}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  noticeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    marginTop: 7,
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
    fontWeight: "700",
  },
  noticeDate: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  linkList: {
    gap: spacing.sm,
  },
  linkButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  linkMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: 4,
  },
});
