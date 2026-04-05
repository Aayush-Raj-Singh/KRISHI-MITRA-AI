import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  MODERN_FARMING_CATEGORIES,
  MODERN_FARMING_GUIDES,
  MODERN_FARMING_SEASONS,
} from "../data/modernFarmingGuides";
import { FieldInput } from "../components/FieldInput";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { colors, radius, spacing, typography } from "../theme";

const pageSize = 12;

export const ModernFarmingScreen = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [season, setSeason] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      MODERN_FARMING_GUIDES.filter((item) => {
        const matchSearch =
          !search ||
          item.crop.toLowerCase().includes(search.toLowerCase()) ||
          item.farmingModel.toLowerCase().includes(search.toLowerCase());
        const matchCategory = category === "All" || item.category === category;
        const matchSeason = season === "All" || item.season.includes(season);
        return matchSearch && matchCategory && matchSeason;
      }),
    [category, search, season],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const resetToFirstPage = () => setPage(1);
  const copy = useMobileTranslatedContent({
    previous: "Previous",
    next: "Next",
    pageLabel: `Page ${page} of ${totalPages}`,
  });
  const translatedCategories = useMobileTranslatedContent(["All", ...MODERN_FARMING_CATEGORIES]);
  const translatedSeasons = useMobileTranslatedContent(MODERN_FARMING_SEASONS);
  const translatedGuides = useMobileTranslatedContent(pageData, {
    ignoreKeys: ["id", "durationDays"],
  });

  return (
    <ScreenShell
      title="Modern farming"
      subtitle="The 250-guide crop and vegetable library from web is available here as a searchable, paged mobile board."
      eyebrow="Guide Library"
      heroImageSource={require("../../assets/hero-slide-10.jpg")}
      heroBadges={["250 Guides", "Crop Models", "Season Filters"]}
    >
      <SectionCard
        title="Library filters"
        subtitle={`Showing ${filtered.length} of ${MODERN_FARMING_GUIDES.length} guides.`}
      >
        <FieldInput
          label="Search crop or model"
          onChangeText={(value) => {
            setSearch(value);
            resetToFirstPage();
          }}
          value={search}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {translatedCategories.map((item, index) => {
            const rawValue = index === 0 ? "All" : MODERN_FARMING_CATEGORIES[index - 1];
            return (
            <Pressable
              key={`${rawValue}-${index}`}
              onPress={() => {
                setCategory(rawValue);
                resetToFirstPage();
              }}
              style={[styles.filterChip, category === rawValue ? styles.filterChipActive : null]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  category === rawValue ? styles.filterChipTextActive : null,
                ]}
              >
                {item}
              </Text>
            </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {translatedSeasons.map((item, index) => {
            const rawValue = MODERN_FARMING_SEASONS[index];
            return (
            <Pressable
              key={`${rawValue}-${index}`}
              onPress={() => {
                setSeason(rawValue);
                resetToFirstPage();
              }}
              style={[styles.filterChip, season === rawValue ? styles.filterChipActive : null]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  season === rawValue ? styles.filterChipTextActive : null,
                ]}
              >
                {item}
              </Text>
            </Pressable>
            );
          })}
        </ScrollView>
      </SectionCard>

      <SectionCard
        title="Guide cards"
        subtitle="Each card preserves the same crop, method, irrigation, nutrition, and market note structure as web."
      >
        <View style={styles.cardList}>
          {translatedGuides.map((guide) => (
            <View key={guide.id} style={styles.guideCard}>
              <Text style={styles.guideTitle}>{guide.crop}</Text>
              <Text style={styles.guideMeta}>
                {guide.category} • {guide.season} • {guide.durationDays} days
              </Text>
              <Text style={styles.guideBody}>Model: {guide.farmingModel}</Text>
              <Text style={styles.guideBody}>Method: {guide.method}</Text>
              <Text style={styles.guideBody}>Irrigation: {guide.irrigation}</Text>
              <Text style={styles.guideBody}>Nutrition: {guide.nutrition}</Text>
              <Text style={styles.guideBody}>Expected yield: {guide.expectedYield}</Text>
              <Text style={styles.guideBody}>Tech: {guide.technology.join(" | ")}</Text>
              <Text style={styles.guideBody}>Market note: {guide.marketTip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.pagination}>
          <Pressable
            disabled={page <= 1}
            onPress={() => setPage((value) => Math.max(1, value - 1))}
            style={[styles.pageButton, page <= 1 ? styles.disabled : null]}
          >
            <Text style={styles.pageButtonText}>{copy.previous}</Text>
          </Pressable>
          <Text style={styles.pageLabel}>{copy.pageLabel}</Text>
          <Pressable
            disabled={page >= totalPages}
            onPress={() => setPage((value) => Math.min(totalPages, value + 1))}
            style={[styles.pageButton, page >= totalPages ? styles.disabled : null]}
          >
            <Text style={styles.pageButtonText}>{copy.next}</Text>
          </Pressable>
        </View>
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    gap: spacing.sm,
  },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: colors.white,
  },
  cardList: {
    gap: spacing.md,
  },
  guideCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  guideTitle: {
    color: colors.text,
    fontFamily: typography.headingFont,
    fontSize: typography.titleSm,
  },
  guideMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  guideBody: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  pageButton: {
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  disabled: {
    opacity: 0.55,
  },
  pageButtonText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  pageLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
});
