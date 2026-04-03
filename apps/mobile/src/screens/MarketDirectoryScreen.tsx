import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { MandiDirectoryFilters, MandiDirectoryItem } from "@krishimitra/shared";

import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { marketApi } from "../services/api";
import { buildMandiOptions } from "../utils/mandiOptions";
import { colors, spacing, typography } from "../theme";

export const MarketDirectoryScreen = () => {
  const [filters, setFilters] = useState<MandiDirectoryFilters>({});
  const [results, setResults] = useState<MandiDirectoryItem[]>([]);
  const [directorySeed, setDirectorySeed] = useState<MandiDirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const options = useMemo(() => buildMandiOptions(directorySeed), [directorySeed]);
  const districtOptions = options.getDistrictsForState(filters.state || "");
  const mandiOptions = options.getMandisForDistrict(filters.state || "", filters.district || "");
  const helperFor = (items: string[]) =>
    items.length ? `Examples: ${items.slice(0, 3).join(", ")}` : undefined;

  const handleSearch = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [seed, data] = await Promise.all([
        directorySeed.length
          ? Promise.resolve(directorySeed)
          : marketApi.getMandiDirectory({ limit: 200 }),
        marketApi.getMandiDirectory({ ...filters, limit: 50 }),
      ]);
      if (!directorySeed.length) {
        setDirectorySeed(seed);
      }
      setResults(data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load mandi profiles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Market directory"
      subtitle="Browse mandi profiles, facilities, commodity coverage, and operating details using the same directory API as web."
      eyebrow="Directory"
      heroImageSource={require("../../assets/hero-slide-07.jpg")}
      heroBadges={["Mandi Profiles", "Commodity Coverage", "Transport + Timings"]}
    >
      {notice ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{notice}</Text>
        </View>
      ) : null}
      <SectionCard
        title="Directory filters"
        subtitle="State, district, mandi, and commodity filters match the web directory."
      >
        <FieldInput
          helperText={helperFor(options.states)}
          label="State"
          onChangeText={(value) =>
            setFilters((prev) => ({ ...prev, state: value, district: "", mandi: "" }))
          }
          value={filters.state || ""}
        />
        <FieldInput
          helperText={helperFor(districtOptions)}
          label="District"
          onChangeText={(value) => setFilters((prev) => ({ ...prev, district: value, mandi: "" }))}
          value={filters.district || ""}
        />
        <FieldInput
          helperText={helperFor(mandiOptions)}
          label="Mandi"
          onChangeText={(value) => setFilters((prev) => ({ ...prev, mandi: value }))}
          value={filters.mandi || ""}
        />
        <FieldInput
          helperText={helperFor(options.commodities)}
          label="Commodity"
          onChangeText={(value) => setFilters((prev) => ({ ...prev, commodity: value }))}
          value={filters.commodity || ""}
        />
        <PrimaryButton
          label="Search mandis"
          loading={loading}
          onPress={() => void handleSearch()}
        />
      </SectionCard>

      {results.length > 0 ? (
        <SectionCard title="Market profiles" subtitle={`Showing ${results.length} mandi profiles.`}>
          <View style={styles.list}>
            {results.map((mandi) => (
              <View key={mandi.mandi_id} style={styles.card}>
                <Text style={styles.title}>{mandi.name}</Text>
                <Text style={styles.meta}>
                  {mandi.district || "-"}, {mandi.state}
                </Text>
                {!!mandi.major_commodities.length && (
                  <Text style={styles.body}>
                    Commodities: {mandi.major_commodities.slice(0, 4).join(", ")}
                  </Text>
                )}
                {mandi.timings ? <Text style={styles.body}>Timings: {mandi.timings}</Text> : null}
                {mandi.transport_info ? (
                  <Text style={styles.body}>Transport: {mandi.transport_info}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  meta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  body: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
