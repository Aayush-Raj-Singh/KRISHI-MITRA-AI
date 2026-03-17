import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material/styles";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { translateAdvisoryText } from "../services/advisory";
import { isCorruptedTranslation, repairMojibake } from "../utils/translationSanitizer";
import {
  MODERN_FARMING_CATEGORIES,
  MODERN_FARMING_GUIDES,
  MODERN_FARMING_SEASONS
} from "../data/modernFarmingGuides";

const PAGE_SIZE = 12;
const TRANSLATION_SOURCE_LANGUAGE = "en";
const STATIC_TRANSLATABLE_TEXTS: string[] = [];

const cropExactEmoji: Record<string, string> = {
  rice: "\u{1F33E}",
  wheat: "\u{1F33E}",
  maize: "\u{1F33D}",
  "sweet corn": "\u{1F33D}",
  carrot: "\u{1F955}",
  potato: "\u{1F954}",
  tomato: "\u{1F345}",
  onion: "\u{1F9C5}",
  garlic: "\u{1F9C4}",
  broccoli: "\u{1F966}",
  cucumber: "\u{1F952}",
  zucchini: "\u{1F952}",
  pumpkin: "\u{1F383}",
  cabbage: "\u{1F96C}",
  cauliflower: "\u{1F966}",
  spinach: "\u{1F96C}",
  lettuce: "\u{1F96C}",
  beetroot: "\u{1F955}",
  radish: "\u{1F955}",
  turnip: "\u{1F955}",
  chili: "\u{1F336}\uFE0F",
  capsicum: "\u{1F336}\uFE0F",
  banana: "\u{1F34C}",
  mango: "\u{1F96D}",
  papaya: "\u{1F96D}",
  apple: "\u{1F34E}",
  grapes: "\u{1F347}",
  guava: "\u{1F34F}",
  strawberry: "\u{1F353}",
  pear: "\u{1F350}",
  peach: "\u{1F351}",
  pomegranate: "\u{1F34E}",
  lemon: "\u{1F34B}",
  orange: "\u{1F34A}",
  citrus: "\u{1F34A}",
  watermelon: "\u{1F349}",
  muskmelon: "\u{1F348}",
  "dragon fruit": "\u{1F348}",
  groundnut: "\u{1F95C}",
  sunflower: "\u{1F33B}",
  mustard: "\u{1F33C}",
  sesame: "\u{1F330}",
  soybean: "\u{1F331}",
  chickpea: "\u{1F331}",
  lentil: "\u{1F331}",
  "green gram": "\u{1F331}",
  "black gram": "\u{1F331}",
  "pigeon pea": "\u{1F331}",
  pea: "\u{1F331}",
  bean: "\u{1F331}",
  turmeric: "\u{1F33F}",
  ginger: "\u{1F33F}",
  coriander: "\u{1F33F}",
  fennel: "\u{1F33F}",
  cumin: "\u{1F33F}",
  cinnamon: "\u{1F33F}",
  clove: "\u{1F33F}",
  cardamom: "\u{1F33F}",
  pepper: "\u{1F33F}",
  ajwain: "\u{1F33F}"
};

const cropKeywordEmoji: Array<{ keyword: string; emoji: string }> = [
  { keyword: "millet", emoji: "\u{1F33E}" },
  { keyword: "cereal", emoji: "\u{1F33E}" },
  { keyword: "rye", emoji: "\u{1F33E}" },
  { keyword: "barley", emoji: "\u{1F33E}" },
  { keyword: "oat", emoji: "\u{1F33E}" },
  { keyword: "sorghum", emoji: "\u{1F33E}" },
  { keyword: "triticale", emoji: "\u{1F33E}" },
  { keyword: "quinoa", emoji: "\u{1F33E}" },
  { keyword: "buckwheat", emoji: "\u{1F33E}" },
  { keyword: "amaranth", emoji: "\u{1F33E}" },
  { keyword: "teff", emoji: "\u{1F33E}" },
  { keyword: "corn", emoji: "\u{1F33D}" },
  { keyword: "gourd", emoji: "\u{1F952}" },
  { keyword: "leaf", emoji: "\u{1F96C}" },
  { keyword: "fruit", emoji: "\u{1F34E}" },
  { keyword: "spice", emoji: "\u{1F33F}" },
  { keyword: "seed", emoji: "\u{1F330}" },
  { keyword: "pulse", emoji: "\u{1F331}" },
  { keyword: "oilseed", emoji: "\u{1F33B}" }
];

const categoryEmoji: Record<string, string> = {
  Cereal: "\u{1F33E}",
  Millet: "\u{1F33E}",
  Pulse: "\u{1F331}",
  Oilseed: "\u{1F33B}",
  Vegetable: "\u{1F955}",
  "Fruit Vegetable": "\u{1F345}",
  Fruit: "\u{1F34E}",
  Leafy: "\u{1F96C}",
  Spice: "\u{1F33F}",
  "Pseudo-cereal": "\u{1F33E}"
};

const emojiPalette = ["\u{1F33E}", "\u{1F33D}", "\u{1F955}", "\u{1F345}", "\u{1F96C}", "\u{1F34E}", "\u{1F331}", "\u{1F33B}", "\u{1F33F}"] as const;

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const resolveCropEmoji = (crop: string, category: string): string => {
  const normalizedCrop = crop.toLowerCase();
  if (cropExactEmoji[normalizedCrop]) return cropExactEmoji[normalizedCrop];
  const matchedByKeyword = cropKeywordEmoji.find(({ keyword }) => normalizedCrop.includes(keyword));
  if (matchedByKeyword) return matchedByKeyword.emoji;
  if (categoryEmoji[category]) return categoryEmoji[category];
  const index = hashString(`${crop}:${category}`) % emojiPalette.length;
  return emojiPalette[index];
};

const uniqueIconStyle = (cropId: string, cropName: string) => {
  const seed = hashString(`${cropId}:${cropName}`);
  const hueA = seed % 360;
  const hueB = (seed * 7 + 53) % 360;
  return {
    borderColor: `hsla(${hueA}, 58%, 32%, 0.46)`,
    background: `linear-gradient(135deg, hsla(${hueA}, 78%, 92%, 0.96) 0%, hsla(${hueB}, 76%, 86%, 0.96) 100%)`,
    shadow: `hsla(${hueA}, 66%, 38%, 0.24)`,
  };
};

const ModernFarmingPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [season, setSeason] = useState("All");
  const [page, setPage] = useState(1);
  const boardRowSx = useMemo(
    () => ({
      borderRadius: 1.75,
      border: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #ccb495",
      background: isDark
        ? "linear-gradient(180deg, rgba(16, 44, 31, 0.96) 0%, rgba(12, 34, 24, 0.96) 100%)"
        : "linear-gradient(180deg, rgba(255,249,239,0.98) 0%, rgba(245,235,220,0.98) 100%)",
      px: 1.2,
      py: 0.9
    }),
    [isDark]
  );

  const boardLabelSx = useMemo(
    () => ({
      color: isDark ? "rgba(228, 241, 232, 0.9)" : "#7a5a3d",
      fontWeight: 800,
      letterSpacing: 0.36
    }),
    [isDark]
  );

  const boardIconShellSx = useMemo(
    () => ({
      width: 26,
      height: 26,
      borderRadius: "50%",
      border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(121, 83, 52, 0.28)",
      background: isDark ? "rgba(20, 60, 40, 0.88)" : "rgba(255, 245, 228, 0.88)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mt: 0.1,
      flexShrink: 0
    }),
    [isDark]
  );
  const languageCode = useMemo(() => {
    const raw = (i18n.resolvedLanguage || i18n.language || "en").toLowerCase();
    return raw.split("-")[0];
  }, [i18n.language, i18n.resolvedLanguage]);

  const filtered = useMemo(() => {
    return MODERN_FARMING_GUIDES.filter((item) => {
      const matchSearch =
        !search ||
        item.crop.toLowerCase().includes(search.toLowerCase()) ||
        item.farmingModel.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || item.category === category;
      const matchSeason = season === "All" || item.season.includes(season);
      return matchSearch && matchCategory && matchSeason;
    });
  }, [search, category, season]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const translationInput = useMemo(() => {
    const values = new Set<string>(STATIC_TRANSLATABLE_TEXTS);
    MODERN_FARMING_CATEGORIES.forEach((value) => values.add(value));
    MODERN_FARMING_SEASONS.forEach((value) => values.add(value));
    pageData.forEach((guide) => {
      values.add(guide.crop);
      values.add(guide.category);
      values.add(guide.season);
      values.add(guide.farmingModel);
      values.add(guide.method);
      values.add(guide.irrigation);
      values.add(guide.nutrition);
      values.add(guide.expectedYield);
      values.add(guide.marketTip);
      guide.technology.forEach((tech) => values.add(tech));
    });
    return Array.from(values).filter((value) => value.trim().length > 0);
  }, [pageData]);

  const translationQuery = useQuery({
    queryKey: ["modern-farming-translation", languageCode, translationInput.join("||")],
    queryFn: async () => {
      const response = await translateAdvisoryText({
        texts: translationInput,
        target_language: languageCode,
        source_language: TRANSLATION_SOURCE_LANGUAGE
      });
      return response.translations;
    },
    enabled: languageCode !== "en" && translationInput.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1
  });
  const translations = translationQuery.data ?? {};
  const tr = (value: string): string => {
    if (languageCode === "en") return value;
    const translated = translations[value];
    if (!translated) return value;
    const repaired = repairMojibake(translated, languageCode);
    return isCorruptedTranslation(repaired, languageCode) ? value : repaired;
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  const paginationProps = {
    count: totalPages,
    page,
    onChange: (_event: React.ChangeEvent<unknown>, value: number) => setPage(value),
    color: "primary",
    shape: "rounded"
  } as unknown as React.ComponentProps<typeof Pagination>;

  return (
    <AppLayout>
      <Stack spacing={2.5}>
        <AgricultureHero
          icon={<AutoAwesomeIcon color="primary" />}
          title={t("modern_farming_page.title", { defaultValue: "Modern Farming Library" })}
          subtitle={t("modern_farming_page.subtitle", {
            defaultValue: "250 practical modern farming guides for crop and vegetable planning."
          })}
          badges={[t("dashboard.crop"), t("dashboard.water"), t("dashboard.price")]}
          imageSrc="/assets/agri-slider/slide-02.png"
        />

        <Card sx={{ border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e7ddcc" }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                fullWidth
                size="small"
                label={t("modern_farming_page.search_label", { defaultValue: "Search crop or model" })}
                value={search}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(event.target.value);
                  handleFilterChange();
                }}
              />

              <FormControl size="small" sx={{ minWidth: 170 }}>
                <InputLabel>{t("modern_farming_page.category_label", { defaultValue: "Category" })}</InputLabel>
                <Select
                  label={t("modern_farming_page.category_label", { defaultValue: "Category" })}
                  value={category}
                  onChange={(event: SelectChangeEvent<string>) => {
                    setCategory(String(event.target.value));
                    handleFilterChange();
                  }}
                >
                  <MenuItem value="All">{t("modern_farming_page.all", { defaultValue: "All" })}</MenuItem>
                  {MODERN_FARMING_CATEGORIES.map((value) => (
                    <MenuItem key={value} value={value}>
                      {tr(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>{t("modern_farming_page.season_label", { defaultValue: "Season" })}</InputLabel>
                <Select
                  label={t("modern_farming_page.season_label", { defaultValue: "Season" })}
                  value={season}
                  onChange={(event: SelectChangeEvent<string>) => {
                    setSeason(String(event.target.value));
                    handleFilterChange();
                  }}
                >
                  {MODERN_FARMING_SEASONS.map((value) => (
                    <MenuItem key={value} value={value}>
                      {tr(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Chip
                color="success"
                variant="outlined"
                label={`${t("modern_farming_page.showing", { defaultValue: "Showing" })}: ${filtered.length} / 250`}
              />
            </Stack>
            {translationQuery.isFetching && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {t("actions.loading", { defaultValue: "Loading..." })}
              </Typography>
            )}
            {translationQuery.isError && (
              <Alert severity="warning" sx={{ mt: 1.25 }}>
                {t("advisory_page.failed_service", { defaultValue: "Service temporarily unavailable." })}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Grid container spacing={2}>
          {pageData.map((guide) => {
            const cropEmoji = resolveCropEmoji(guide.crop, guide.category);
            const iconTheme = uniqueIconStyle(guide.id, guide.crop);
            return (
            <Grid item xs={12} md={6} lg={4} key={guide.id}>
              <Card
                sx={{
                  height: "100%",
                  border: "1px solid #dbc5a8",
                  borderRadius: 3,
                  background: "linear-gradient(180deg, rgba(255,251,244,0.98) 0%, rgba(247,239,226,0.98) 100%)",
                  boxShadow: "0 14px 28px rgba(64, 42, 23, 0.14)"
                }}
              >
                <CardContent sx={{ p: { xs: 1.6, md: 1.8 }, "&:last-child": { pb: { xs: 1.6, md: 1.8 } } }}>
                  <Stack spacing={1.45}>
                    <Box
                      sx={{
                        borderRadius: 2,
                        border: "1px solid #dfccaf",
                        bgcolor: "rgba(255, 246, 230, 0.72)",
                        px: 1.2,
                        py: 1.05
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Stack direction="row" spacing={0.95} alignItems="center" sx={{ minWidth: 0 }}>
                          <Box
                            component="span"
                            role="img"
                            aria-label={`${guide.crop} icon`}
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              border: `1px solid ${iconTheme.borderColor}`,
                              background: iconTheme.background,
                              boxShadow: `0 2px 6px ${iconTheme.shadow}`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.12rem",
                              lineHeight: 1,
                              position: "relative"
                            }}
                          >
                            {cropEmoji}
                          </Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.08 }}>
                            {tr(guide.crop)}
                          </Typography>
                        </Stack>
                        <Chip
                          size="small"
                          label={tr(guide.category)}
                          sx={{
                            borderRadius: 1,
                            bgcolor: "rgba(86,55,34,0.12)",
                            color: "#5a3a24",
                            border: "1px solid rgba(115,79,52,0.25)",
                            fontWeight: 600
                          }}
                        />
                      </Stack>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip size="small" color="success" variant="outlined" label={tr(guide.season)} />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${guide.durationDays} ${t("modern_farming_page.days", { defaultValue: "days" })}`}
                        />
                        <Chip
                          size="small"
                          label={tr(guide.farmingModel)}
                          sx={{
                            maxWidth: "100%",
                            bgcolor: "rgba(137,90,55,0.12)",
                            color: "#5b3a22",
                            border: "1px solid rgba(137,90,55,0.26)",
                            "& .MuiChip-label": {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }
                          }}
                        />
                      </Stack>
                    </Box>

                    <Box
                      sx={{
                        position: "relative",
                        borderRadius: 2.35,
                        border: "2px solid #754a2d",
                        background:
                          "repeating-linear-gradient(180deg, #99643b 0px, #99643b 42px, #875633 42px, #875633 44px)",
                        boxShadow:
                          "inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.16), 0 10px 18px rgba(50,31,18,0.18)",
                        px: 1.15,
                        pt: 2.2,
                        pb: 1.06
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#4e2f1a",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)"
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: "#4e2f1a",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)"
                        }}
                      />

                      <Box
                        sx={{
                          position: "absolute",
                          top: -13,
                          left: "50%",
                          transform: "translateX(-50%)",
                          borderRadius: 999,
                          border: "1px solid #d7c5a7",
                          bgcolor: "#f3e8d6",
                          color: "#4f341f",
                          px: 1.5,
                          py: 0.38
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.85 }}>
                          {t("modern_farming_page.farm_plan_board", { defaultValue: "FARM PLAN BOARD" })}
                        </Typography>
                      </Box>

                      <Stack spacing={0.92}>
                        <Box sx={boardRowSx}>
                          <Typography variant="caption" sx={boardLabelSx}>
                            {t("modern_farming_page.field_method", { defaultValue: "FIELD METHOD" })}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: isDark ? "rgba(228, 241, 232, 0.88)" : "#30261e" }}
                          >
                            {tr(guide.method)}
                          </Typography>
                        </Box>

                        <Box sx={boardRowSx}>
                          <Stack direction="row" spacing={0.95} alignItems="flex-start">
                            <Box sx={boardIconShellSx}>
                              <WaterDropIcon fontSize="small" color="primary" />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={boardLabelSx}>
                                {t("modern_farming_page.water_plan", { defaultValue: "WATER PLAN" })}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: isDark ? "rgba(228, 241, 232, 0.88)" : "#30261e" }}
                              >
                                {tr(guide.irrigation)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        <Box sx={boardRowSx}>
                          <Stack direction="row" spacing={0.95} alignItems="flex-start">
                            <Box sx={boardIconShellSx}>
                              <AutoAwesomeIcon fontSize="small" color="secondary" />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={boardLabelSx}>
                                {t("modern_farming_page.nutrition_plan", { defaultValue: "NUTRITION PLAN" })}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: isDark ? "rgba(228, 241, 232, 0.88)" : "#30261e" }}
                              >
                                {tr(guide.nutrition)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        <Box sx={boardRowSx}>
                          <Stack direction="row" spacing={0.95} alignItems="flex-start">
                            <Box sx={boardIconShellSx}>
                              <QueryStatsIcon fontSize="small" color="success" />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={boardLabelSx}>
                                {t("modern_farming_page.expected_yield", { defaultValue: "EXPECTED YIELD" })}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isDark ? "rgba(228, 241, 232, 0.88)" : "#30261e",
                                  fontWeight: 700,
                                  fontSize: "1.2rem"
                                }}
                              >
                                {tr(guide.expectedYield)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>

                        <Divider sx={{ borderColor: "rgba(88,55,31,0.28)", borderStyle: "dashed" }} />

                        <Box sx={boardRowSx}>
                          <Typography variant="caption" sx={boardLabelSx}>
                            {t("modern_farming_page.tech_stack", { defaultValue: "TECH STACK" })}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: isDark ? "rgba(228, 241, 232, 0.88)" : "#30261e" }}
                          >
                            {guide.technology.map((tech) => tr(tech)).join(" | ")}
                          </Typography>
                        </Box>

                        <Box sx={boardRowSx}>
                          <Typography variant="caption" sx={boardLabelSx}>
                            {t("modern_farming_page.market_note", { defaultValue: "MARKET NOTE" })}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: isDark ? "rgba(228, 241, 232, 0.88)" : "#30261e" }}
                          >
                            {tr(guide.marketTip)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            );
          })}
        </Grid>

        <Stack direction="row" justifyContent="center">
          <Pagination {...paginationProps} />
        </Stack>
      </Stack>
    </AppLayout>
  );
};

export default ModernFarmingPage;
