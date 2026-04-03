import React, { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { CropAdvisorResponse } from "@krishimitra/shared";

import { ScreenShell } from "../components/ScreenShell";
import { useMobileTranslatedStrings } from "../hooks/useMobileTranslatedStrings";
import { aiAdvisorApi } from "../services/api";
import { normalizeAppLanguage } from "../services/languageStorage";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { useAuthStore } from "../store/authStore";
import { radius, shadows, spacing, typography } from "../theme";

type AdvisoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type AdvisoryRuntimeMeta = CropAdvisorResponse & {
  provider: string;
  model: string;
  language: string;
  location: string;
  crop: string;
  query: string;
  createdAt: string;
};

type AdvisoryCacheValue = {
  messages: AdvisoryMessage[];
  meta?: AdvisoryRuntimeMeta | null;
  context?: {
    location: string;
    crop: string;
  };
};

type NoticeState =
  | { kind: "cached"; updatedAt: string }
  | { kind: "fallback"; updatedAt: string }
  | { kind: "error"; message: string };

type PromptCategory = "all" | "crop" | "water" | "market" | "soil";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

type PromptCardDefinition = {
  id: string;
  category: Exclude<PromptCategory, "all">;
  title: string;
  description: string;
  prompt: string;
  metric: string;
  imageSource: number;
  icon: IconName;
};

const advisoryCacheKey = buildCacheKey("advisory:thread");

const advisoryCopySource = {
  heroEyebrow: "AI Advisory",
  heroTitle: "Crop advisor command center",
  heroSubtitle:
    "Ask in your own language, reuse practical field scenarios, and keep recent advisory guidance available offline.",
  welcomeBack: "Welcome back",
  commandSubtitle:
    "Use the visual cards below for fast crop-health, irrigation, market, and soil troubleshooting.",
  quickPanelTitle: "Advisory scenarios",
  quickPanelSubtitle: "Tap a card to send a focused question instantly.",
  chipAll: "All",
  chipCrop: "Crop health",
  chipWater: "Water plan",
  chipMarket: "Market timing",
  chipSoil: "Soil recovery",
  ready: "AI ready",
  standby: "Standby",
  analyzing: "Analyzing live",
  historyReady: "History ready",
  historyEmpty: "Fresh thread",
  locationLabel: "Location",
  cropLabel: "Primary crop",
  locationInputLabel: "Advisory location",
  cropInputLabel: "Advisory crop",
  syncProfileContext: "Use saved profile context",
  contextRequiredError: "Location and crop are required before sending an advisor request.",
  soilLabel: "Soil profile",
  languageLabel: "Language",
  waterLabel: "Water source",
  replyCountLabel: "AI replies",
  providerLabel: "Provider",
  stepsCountLabel: "Steps",
  precautionsCountLabel: "Precautions",
  updatedLabel: "Updated",
  problemLabel: "Problem",
  recommendationsLabel: "Recommendations",
  safeguardsLabel: "Preventive steps",
  chatTitle: "Advisory conversation",
  chatSubtitle:
    "Recent responses stay cached locally for quick reopening in low-connectivity conditions.",
  emptyTitle: "Start with a crop issue or field decision",
  emptyBody:
    "Describe symptoms, crop stage, soil condition, irrigation timing, or mandi concerns to get a practical response.",
  assistantLabel: "Advisor",
  userLabel: "You",
  composerLabel: "Ask the advisory assistant",
  composerPlaceholder:
    "Example: My wheat leaves are turning yellow after irrigation. What should I inspect first?",
  composerHelper: "Add crop, location, and growth stage for sharper guidance.",
  sendMessage: "Send message",
  sending: "Sending",
  unavailableError: "Advisory service is unavailable right now.",
  noticeCachedPrefix: "Loaded cached advisory history from",
  noticeFallbackPrefix: "Live advisory is unavailable. Showing cached thread from",
  latestReply: "Latest advisory",
  bedrockModelLabel: "AI Crop Advisor",
  cardCropTitle: "Yellowing leaves triage",
  cardCropBody:
    "Check nutrient loss, disease pressure, and moisture stress before the issue spreads.",
  cardCropPrompt:
    "My crop leaves are turning yellow. What should I inspect first and what should I do today?",
  cardCropMetric: "Crop health",
  cardWaterTitle: "5-day irrigation check",
  cardWaterBody:
    "Balance water timing against weather shifts and growth stage before the next irrigation cycle.",
  cardWaterPrompt:
    "How should I plan irrigation for the next five days based on crop stage and expected weather changes?",
  cardWaterMetric: "Water plan",
  cardMarketTitle: "Sell now or hold stock",
  cardMarketBody: "Review mandi signals, price movement, and holding risks before sending produce.",
  cardMarketPrompt:
    "Should I sell my produce now or hold for a few days? What mandi signals should I watch?",
  cardMarketMetric: "Market timing",
  cardSoilTitle: "Soil recovery after stress",
  cardSoilBody:
    "Recover structure and nutrient balance after heavy rain, heat, or repeated cropping.",
  cardSoilPrompt:
    "How can I restore soil health after heavy rain and prevent nutrient loss in the next crop cycle?",
  cardSoilMetric: "Soil recovery",
} as const;

const BEDROCK_PROVIDER_LABEL = "Amazon Bedrock";

const formatTimestamp = (value: string, language: string) => {
  try {
    return new Date(value).toLocaleString(language);
  } catch {
    return new Date(value).toLocaleString();
  }
};

const getFirstName = (value?: string | null) => {
  const firstName = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];
  return firstName || null;
};

const normalizeCachedRuntimeMeta = (value: unknown): AdvisoryRuntimeMeta | null => {
  const candidate = value as Partial<AdvisoryRuntimeMeta> | null | undefined;
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  if (
    typeof candidate.advice !== "string" ||
    !Array.isArray(candidate.steps) ||
    !Array.isArray(candidate.precautions) ||
    typeof candidate.location !== "string" ||
    typeof candidate.crop !== "string"
  ) {
    return null;
  }

  return {
    advice: candidate.advice,
    steps: candidate.steps.map((item) => String(item)),
    precautions: candidate.precautions.map((item) => String(item)),
    provider: typeof candidate.provider === "string" ? candidate.provider : "bedrock",
    model: typeof candidate.model === "string" ? candidate.model : "AI Crop Advisor",
    language: typeof candidate.language === "string" ? candidate.language : "en",
    location: candidate.location,
    crop: candidate.crop,
    query: typeof candidate.query === "string" ? candidate.query : "",
    createdAt:
      typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
  };
};

const buildAdvisorReply = (
  response: CropAdvisorResponse,
  labels: { recommendationsLabel: string; safeguardsLabel: string },
) => {
  const lines = [response.advice];

  if (response.steps.length > 0) {
    lines.push(
      "",
      `${labels.recommendationsLabel}:`,
      ...response.steps.map((step, index) => `${index + 1}. ${step}`),
    );
  }

  if (response.precautions.length > 0) {
    lines.push(
      "",
      `${labels.safeguardsLabel}:`,
      ...response.precautions.map((item, index) => `${index + 1}. ${item}`),
    );
  }

  return lines.join("\n");
};

export const AdvisoryScreen = () => {
  const user = useAuthStore((state) => state.user);
  const { t, i18n } = useTranslation();
  const copy = useMobileTranslatedStrings(advisoryCopySource);
  const language = normalizeAppLanguage(i18n.language || user?.language || "en");
  const profileCrop = user?.primary_crops[0] || "";

  const [messages, setMessages] = useState<AdvisoryMessage[]>([]);
  const [input, setInput] = useState("");
  const [meta, setMeta] = useState<AdvisoryRuntimeMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>("all");
  const [contextLocation, setContextLocation] = useState(user?.location || "");
  const [contextCrop, setContextCrop] = useState(profileCrop);

  useEffect(() => {
    readCacheRecord<AdvisoryCacheValue>(advisoryCacheKey).then((cached) => {
      if (cached) {
        setMessages(cached.value.messages);
        setMeta(normalizeCachedRuntimeMeta(cached.value.meta));
        if (cached.value.context?.location) {
          setContextLocation(cached.value.context.location);
        }
        if (cached.value.context?.crop) {
          setContextCrop(cached.value.context.crop);
        }
        setNotice({
          kind: "cached",
          updatedAt: cached.updatedAt,
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!contextLocation && user?.location) {
      setContextLocation(user.location);
    }
  }, [contextLocation, user?.location]);

  useEffect(() => {
    if (!contextCrop && profileCrop) {
      setContextCrop(profileCrop);
    }
  }, [contextCrop, profileCrop]);

  const persistConversation = async (
    nextMessages: AdvisoryMessage[],
    nextMeta: AdvisoryRuntimeMeta | null,
    nextContext: { location: string; crop: string },
  ) => {
    await writeCacheRecord(advisoryCacheKey, {
      messages: nextMessages,
      meta: nextMeta,
      context: nextContext,
    });
  };

  const promptCards = useMemo<PromptCardDefinition[]>(
    () => [
      {
        id: "crop-health",
        category: "crop",
        title: copy.cardCropTitle,
        description: copy.cardCropBody,
        prompt: copy.cardCropPrompt,
        metric: copy.cardCropMetric,
        imageSource: require("../../assets/hero-slide-07.jpg"),
        icon: "eco",
      },
      {
        id: "water-plan",
        category: "water",
        title: copy.cardWaterTitle,
        description: copy.cardWaterBody,
        prompt: copy.cardWaterPrompt,
        metric: copy.cardWaterMetric,
        imageSource: require("../../assets/hero-slide-08.jpg"),
        icon: "water-drop",
      },
      {
        id: "market-timing",
        category: "market",
        title: copy.cardMarketTitle,
        description: copy.cardMarketBody,
        prompt: copy.cardMarketPrompt,
        metric: copy.cardMarketMetric,
        imageSource: require("../../assets/hero-slide-09.jpg"),
        icon: "show-chart",
      },
      {
        id: "soil-recovery",
        category: "soil",
        title: copy.cardSoilTitle,
        description: copy.cardSoilBody,
        prompt: copy.cardSoilPrompt,
        metric: copy.cardSoilMetric,
        imageSource: require("../../assets/hero-slide-10.jpg"),
        icon: "compost",
      },
    ],
    [copy],
  );

  const categoryChips = useMemo(
    () => [
      { key: "all" as const, label: copy.chipAll, icon: "grid-view" as IconName },
      { key: "crop" as const, label: copy.chipCrop, icon: "eco" as IconName },
      { key: "water" as const, label: copy.chipWater, icon: "water-drop" as IconName },
      { key: "market" as const, label: copy.chipMarket, icon: "show-chart" as IconName },
      { key: "soil" as const, label: copy.chipSoil, icon: "compost" as IconName },
    ],
    [copy],
  );

  const filteredCards = useMemo(
    () =>
      selectedCategory === "all"
        ? promptCards
        : promptCards.filter((card) => card.category === selectedCategory),
    [promptCards, selectedCategory],
  );

  const assistantMessages = useMemo(
    () => messages.filter((item) => item.role === "assistant"),
    [messages],
  );
  const latestAssistantMessage = assistantMessages.at(-1)?.content || null;
  const firstName = getFirstName(user?.name);
  const currentCrop = contextCrop || profileCrop || "--";
  const noticeText = useMemo(() => {
    if (!notice) {
      return null;
    }
    if (notice.kind === "error") {
      return notice.message;
    }

    const formattedTime = formatTimestamp(notice.updatedAt, language);
    if (notice.kind === "cached") {
      return `${copy.noticeCachedPrefix} ${formattedTime}.`;
    }
    return `${copy.noticeFallbackPrefix} ${formattedTime}.`;
  }, [copy.noticeCachedPrefix, copy.noticeFallbackPrefix, language, notice]);

  const heroBadges = useMemo(
    () => [
      BEDROCK_PROVIDER_LABEL,
      t(`languages.${language}`),
      contextLocation || user?.location || copy.locationLabel,
    ],
    [contextLocation, copy.locationLabel, language, t, user?.location],
  );

  const profileCards = useMemo(
    () => [
      {
        key: "location",
        label: copy.locationLabel,
        value: contextLocation || "--",
        icon: "place" as IconName,
      },
      {
        key: "crop",
        label: copy.cropLabel,
        value: currentCrop,
        icon: "grass" as IconName,
      },
      {
        key: "soil",
        label: copy.soilLabel,
        value: user?.soil_type || "--",
        icon: "terrain" as IconName,
      },
      {
        key: "language",
        label: copy.languageLabel,
        value: t(`languages.${language}`),
        icon: "translate" as IconName,
      },
    ],
    [
      copy.cropLabel,
      copy.languageLabel,
      copy.locationLabel,
      copy.soilLabel,
      contextLocation,
      currentCrop,
      language,
      t,
      user?.soil_type,
    ],
  );

  const statusText = loading ? copy.analyzing : meta ? copy.ready : copy.standby;
  const cacheStatus = messages.length ? copy.historyReady : copy.historyEmpty;
  const applyProfileContext = () => {
    setContextLocation(user?.location || "");
    setContextCrop(profileCrop);
  };

  const handleSend = async (preset?: string) => {
    const content = (preset || input).trim();
    if (!content || loading) {
      return;
    }

    const location = contextLocation.trim();
    const crop = contextCrop.trim();
    if (!location || !crop) {
      setNotice({
        kind: "error",
        message: copy.contextRequiredError,
      });
      return;
    }

    const nextMessages = [...messages, { role: "user", content } as AdvisoryMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setNotice(null);

    try {
      const response = await aiAdvisorApi.getAdvice({
        location,
        crop,
        query: content,
        language,
      });
      const runtimeMeta: AdvisoryRuntimeMeta = {
        ...response,
        provider: "bedrock",
        model: copy.bedrockModelLabel,
        language,
        location,
        crop,
        query: content,
        createdAt: new Date().toISOString(),
      };
      const updatedMessages = [
        ...nextMessages,
        {
          role: "assistant",
          content: buildAdvisorReply(response, {
            recommendationsLabel: copy.recommendationsLabel,
            safeguardsLabel: copy.safeguardsLabel,
          }),
        } as AdvisoryMessage,
      ];
      setMessages(updatedMessages);
      setMeta(runtimeMeta);
      await persistConversation(updatedMessages, runtimeMeta, { location, crop });
    } catch (error) {
      const cached = await readCacheRecord<AdvisoryCacheValue>(advisoryCacheKey);
      if (cached) {
        setMessages(cached.value.messages);
        setMeta(normalizeCachedRuntimeMeta(cached.value.meta));
        if (cached.value.context?.location) {
          setContextLocation(cached.value.context.location);
        }
        if (cached.value.context?.crop) {
          setContextCrop(cached.value.context.crop);
        }
        setNotice({
          kind: "fallback",
          updatedAt: cached.updatedAt,
        });
      } else {
        setNotice({
          kind: "error",
          message: error instanceof Error ? error.message : copy.unavailableError,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title={copy.heroTitle}
      subtitle={copy.heroSubtitle}
      eyebrow={copy.heroEyebrow}
      heroImageSource={require("../../assets/hero-slide-06.jpg")}
      heroBadges={heroBadges}
    >
      {noticeText ? (
        <View
          style={[styles.noticeBanner, notice?.kind === "error" ? styles.noticeBannerError : null]}
        >
          <MaterialIcons
            color={notice?.kind === "error" ? "#ffb8aa" : "#cbe7d0"}
            name={notice?.kind === "error" ? "error-outline" : "history"}
            size={18}
          />
          <Text style={styles.noticeText}>{noticeText}</Text>
        </View>
      ) : null}

      <View style={styles.commandDeck}>
        <View style={styles.deckHeader}>
          <View style={styles.liveChip}>
            <View style={[styles.liveDot, loading ? styles.liveDotBusy : null]} />
            <Text style={styles.liveChipText}>{statusText}</Text>
          </View>
          <View style={styles.secondaryChip}>
            <MaterialIcons color="#e7f4e9" name="history" size={14} />
            <Text style={styles.secondaryChipText}>{cacheStatus}</Text>
          </View>
        </View>

        <Text style={styles.commandTitle}>
          {firstName ? `${copy.welcomeBack}, ${firstName}` : copy.welcomeBack}
        </Text>
        <Text style={styles.commandSubtitle}>{copy.commandSubtitle}</Text>

        <View style={styles.contextGrid}>
          <View style={styles.contextField}>
            <Text style={styles.contextFieldLabel}>{copy.locationInputLabel}</Text>
            <TextInput
              onChangeText={setContextLocation}
              placeholder={copy.locationInputLabel}
              placeholderTextColor="#86a38d"
              style={styles.contextFieldInput}
              value={contextLocation}
            />
          </View>
          <View style={styles.contextField}>
            <Text style={styles.contextFieldLabel}>{copy.cropInputLabel}</Text>
            <TextInput
              onChangeText={setContextCrop}
              placeholder={copy.cropInputLabel}
              placeholderTextColor="#86a38d"
              style={styles.contextFieldInput}
              value={contextCrop}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={applyProfileContext}
          style={({ pressed }) => [
            styles.contextSyncButton,
            pressed ? styles.categoryChipPressed : null,
          ]}
        >
          <MaterialIcons color="#e7f4e9" name="my-location" size={16} />
          <Text style={styles.contextSyncButtonText}>{copy.syncProfileContext}</Text>
        </Pressable>

        <View style={styles.profileGrid}>
          {profileCards.map((card) => (
            <View key={card.key} style={styles.profileCard}>
              <View style={styles.profileCardIcon}>
                <MaterialIcons color="#dff2e2" name={card.icon} size={16} />
              </View>
              <Text style={styles.profileCardLabel}>{card.label}</Text>
              <Text numberOfLines={2} style={styles.profileCardValue}>
                {card.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.commandFooter}>
          <View style={styles.footerPill}>
            <Text style={styles.footerPillLabel}>{copy.providerLabel}</Text>
            <Text numberOfLines={1} style={styles.footerPillValue}>
              {BEDROCK_PROVIDER_LABEL}
            </Text>
          </View>
          <View style={styles.footerPill}>
            <Text style={styles.footerPillLabel}>{copy.replyCountLabel}</Text>
            <Text style={styles.footerPillValue}>{assistantMessages.length}</Text>
          </View>
          <View style={styles.footerPill}>
            <Text style={styles.footerPillLabel}>{copy.waterLabel}</Text>
            <Text numberOfLines={1} style={styles.footerPillValue}>
              {user?.water_source || "--"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelCopy}>
            <Text style={styles.panelTitle}>{copy.quickPanelTitle}</Text>
            <Text style={styles.panelSubtitle}>{copy.quickPanelSubtitle}</Text>
          </View>
          <View style={styles.panelBadge}>
            <MaterialIcons color="#d9f2dd" name="bolt" size={15} />
            <Text style={styles.panelBadgeText}>{copy.ready}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categoryChips.map((chip) => {
            const active = chip.key === selectedCategory;
            return (
              <Pressable
                key={chip.key}
                accessibilityRole="button"
                onPress={() => setSelectedCategory(chip.key)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  active ? styles.categoryChipActive : null,
                  pressed ? styles.categoryChipPressed : null,
                ]}
              >
                <MaterialIcons color={active ? "#0b2310" : "#d4e9d8"} name={chip.icon} size={16} />
                <Text
                  style={[styles.categoryChipText, active ? styles.categoryChipTextActive : null]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRail}
        >
          {filteredCards.map((card) => (
            <Pressable
              key={card.id}
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void handleSend(card.prompt)}
              style={({ pressed }) => [
                styles.promptCard,
                pressed ? styles.promptCardPressed : null,
              ]}
            >
              <ImageBackground
                imageStyle={styles.promptCardImage}
                source={card.imageSource}
                style={styles.promptCardImageWrap}
              >
                <View style={styles.promptCardOverlay}>
                  <View style={styles.promptCardTopRow}>
                    <View style={styles.promptMetricChip}>
                      <Text style={styles.promptMetricText}>{card.metric}</Text>
                    </View>
                    <View style={styles.promptIconWrap}>
                      <MaterialIcons color="#eff9f0" name={card.icon} size={18} />
                    </View>
                  </View>
                  <View style={styles.promptCardBody}>
                    <Text style={styles.promptCardTitle}>{card.title}</Text>
                    <Text style={styles.promptCardDescription}>{card.description}</Text>
                  </View>
                  <View style={styles.promptActionRow}>
                    <Text style={styles.promptActionText}>{copy.sendMessage}</Text>
                    <MaterialIcons color="#ffffff" name="north-east" size={18} />
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.chatPanel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelCopy}>
            <Text style={styles.panelTitle}>{copy.chatTitle}</Text>
            <Text style={styles.panelSubtitle}>{copy.chatSubtitle}</Text>
          </View>
          <View style={styles.panelBadge}>
            <MaterialIcons color="#d9f2dd" name="forum" size={15} />
            <Text style={styles.panelBadgeText}>{assistantMessages.length}</Text>
          </View>
        </View>

        {latestAssistantMessage ? (
          <View style={styles.latestReplyCard}>
            <Text style={styles.latestReplyLabel}>{copy.latestReply}</Text>
            <Text numberOfLines={3} style={styles.latestReplyText}>
              {latestAssistantMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.messageStack}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <MaterialIcons color="#d9f2dd" name="spa" size={24} />
              </View>
              <Text style={styles.emptyStateTitle}>{copy.emptyTitle}</Text>
              <Text style={styles.emptyStateBody}>{copy.emptyBody}</Text>
            </View>
          ) : null}

          {messages.map((item, index) => {
            const isUser = item.role === "user";
            return (
              <View
                key={`${item.role}-${index}`}
                style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}
              >
                <View style={styles.messageMeta}>
                  <Text style={[styles.messageRole, isUser ? styles.userRoleText : null]}>
                    {isUser ? copy.userLabel : copy.assistantLabel}
                  </Text>
                  <MaterialIcons
                    color={isUser ? "#e8f9ea" : "#b9d6bf"}
                    name={isUser ? "north-east" : "auto-awesome"}
                    size={14}
                  />
                </View>
                <Text style={[styles.messageText, isUser ? styles.userMessageText : null]}>
                  {item.content}
                </Text>
              </View>
            );
          })}
        </View>

        {meta ? (
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>{copy.providerLabel}</Text>
                <Text numberOfLines={1} style={styles.telemetryValue}>
                  {BEDROCK_PROVIDER_LABEL}
                </Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>{copy.cropLabel}</Text>
                <Text numberOfLines={1} style={styles.telemetryValue}>
                  {meta.crop}
                </Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>{copy.stepsCountLabel}</Text>
                <Text style={styles.telemetryValue}>{meta.steps.length}</Text>
              </View>
              <View style={styles.telemetryItem}>
                <Text style={styles.telemetryLabel}>{copy.precautionsCountLabel}</Text>
                <Text style={styles.telemetryValue}>{meta.precautions.length}</Text>
              </View>
            </View>

            <View style={styles.conversationRow}>
              <Text style={styles.telemetryLabel}>
                {copy.languageLabel}:{" "}
                <Text style={styles.conversationValue}>{t(`languages.${meta.language}`)}</Text>
              </Text>
              <Text style={styles.telemetryLabel}>
                {copy.updatedLabel}:{" "}
                <Text style={styles.conversationValue}>
                  {formatTimestamp(meta.createdAt, language)}
                </Text>
              </Text>
            </View>

            <View style={styles.sourceList}>
              <Text style={styles.sourceHeader}>{copy.problemLabel}</Text>
              <Text style={styles.sourceText}>{meta.query}</Text>
            </View>

            {meta.steps.length > 0 ? (
              <View style={styles.sourceList}>
                <Text style={styles.sourceHeader}>{copy.recommendationsLabel}</Text>
                {meta.steps.map((step, index) => (
                  <Text key={`${meta.createdAt}-step-${index + 1}`} style={styles.sourceText}>
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
            ) : null}

            {meta.precautions.length > 0 ? (
              <View style={styles.sourceList}>
                <Text style={styles.sourceHeader}>{copy.safeguardsLabel}</Text>
                {meta.precautions.map((precaution, index) => (
                  <Text key={`${meta.createdAt}-precaution-${index + 1}`} style={styles.sourceText}>
                    {index + 1}. {precaution}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.composerCard}>
          <Text style={styles.composerLabel}>{copy.composerLabel}</Text>
          <TextInput
            multiline
            onChangeText={setInput}
            placeholder={copy.composerPlaceholder}
            placeholderTextColor="#86a38d"
            style={styles.composerInput}
            textAlignVertical="top"
            value={input}
          />
          <View style={styles.composerFooter}>
            <Text style={styles.composerHelper}>{copy.composerHelper}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={loading || !input.trim()}
              onPress={() => void handleSend()}
              style={({ pressed }) => [
                styles.sendButton,
                loading || !input.trim() ? styles.sendButtonDisabled : null,
                pressed ? styles.sendButtonPressed : null,
              ]}
            >
              <Text style={styles.sendButtonText}>{loading ? copy.sending : copy.sendMessage}</Text>
              <MaterialIcons
                color="#0b2310"
                name={loading ? "hourglass-top" : "north-east"}
                size={18}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(144, 195, 155, 0.36)",
    backgroundColor: "#183223",
    padding: spacing.md,
  },
  noticeBannerError: {
    borderColor: "rgba(255, 149, 126, 0.3)",
    backgroundColor: "#341c18",
  },
  noticeText: {
    flex: 1,
    color: "#e6f5e9",
    fontSize: typography.caption,
    lineHeight: 18,
  },
  commandDeck: {
    marginTop: -72,
    borderRadius: radius.xl,
    backgroundColor: "#0d1f14",
    borderWidth: 1,
    borderColor: "rgba(181, 224, 191, 0.18)",
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.hero,
  },
  deckHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(119, 196, 134, 0.14)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#7ff4a4",
  },
  liveDotBusy: {
    backgroundColor: "#ffd27f",
  },
  liveChipText: {
    color: "#f0faf2",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  secondaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  secondaryChipText: {
    color: "#e7f4e9",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  commandTitle: {
    color: "#ffffff",
    fontFamily: typography.headingFont,
    fontSize: typography.titleLg,
    lineHeight: 36,
  },
  commandSubtitle: {
    color: "#b5cfbb",
    fontSize: typography.body,
    lineHeight: 22,
  },
  contextGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  contextField: {
    minWidth: "47%",
    flex: 1,
    gap: spacing.xs,
  },
  contextFieldLabel: {
    color: "#d7ebdb",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  contextFieldInput: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(193, 230, 201, 0.12)",
    backgroundColor: "#14261c",
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: typography.body,
  },
  contextSyncButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  contextSyncButtonText: {
    color: "#e7f4e9",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  profileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  profileCard: {
    minWidth: "47%",
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(193, 230, 201, 0.12)",
    padding: spacing.sm,
    gap: 6,
  },
  profileCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(176, 227, 186, 0.14)",
  },
  profileCardLabel: {
    color: "#8fae96",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  profileCardValue: {
    color: "#ffffff",
    fontSize: typography.bodyLg,
    fontWeight: "700",
  },
  commandFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  footerPill: {
    minWidth: "30%",
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: "#163022",
    borderWidth: 1,
    borderColor: "rgba(194, 232, 202, 0.12)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: 4,
  },
  footerPillLabel: {
    color: "#8fae96",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  footerPillValue: {
    color: "#f4fbf5",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  panel: {
    borderRadius: radius.xl,
    backgroundColor: "#101f17",
    borderWidth: 1,
    borderColor: "rgba(182, 224, 191, 0.14)",
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  panelCopy: {
    flex: 1,
    gap: 4,
  },
  panelTitle: {
    color: "#ffffff",
    fontFamily: typography.headingFont,
    fontSize: typography.titleMd,
  },
  panelSubtitle: {
    color: "#9ab39f",
    fontSize: typography.caption,
    lineHeight: 18,
  },
  panelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(124, 198, 139, 0.14)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  panelBadgeText: {
    color: "#e8f8eb",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  categoryRow: {
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: "#172920",
    borderWidth: 1,
    borderColor: "rgba(186, 224, 194, 0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  categoryChipActive: {
    backgroundColor: "#c3f0b5",
    borderColor: "#c3f0b5",
  },
  categoryChipPressed: {
    opacity: 0.9,
  },
  categoryChipText: {
    color: "#d7ebdb",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: "#0b2310",
  },
  cardRail: {
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  promptCard: {
    width: 264,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  promptCardPressed: {
    opacity: 0.95,
  },
  promptCardImageWrap: {
    minHeight: 260,
  },
  promptCardImage: {
    borderRadius: radius.xl,
  },
  promptCardOverlay: {
    minHeight: 260,
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: "rgba(8, 25, 14, 0.52)",
  },
  promptCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  promptMetricChip: {
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  promptMetricText: {
    color: "#f0fbf2",
    fontSize: 12,
    fontWeight: "700",
  },
  promptIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  promptCardBody: {
    gap: spacing.xs,
  },
  promptCardTitle: {
    color: "#ffffff",
    fontFamily: typography.headingFont,
    fontSize: 24,
    lineHeight: 30,
  },
  promptCardDescription: {
    color: "#e6f4e8",
    fontSize: typography.caption,
    lineHeight: 19,
  },
  promptActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promptActionText: {
    color: "#ffffff",
    fontSize: typography.body,
    fontWeight: "800",
  },
  chatPanel: {
    borderRadius: radius.xl,
    backgroundColor: "#08140d",
    borderWidth: 1,
    borderColor: "rgba(183, 223, 191, 0.12)",
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.hero,
  },
  latestReplyCard: {
    borderRadius: radius.lg,
    backgroundColor: "rgba(101, 170, 117, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(140, 204, 151, 0.16)",
    padding: spacing.md,
    gap: spacing.xs,
  },
  latestReplyLabel: {
    color: "#9ac0a3",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  latestReplyText: {
    color: "#edf8ef",
    fontSize: typography.body,
    lineHeight: 21,
  },
  messageStack: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: "#0e1d15",
    borderWidth: 1,
    borderColor: "rgba(187, 223, 194, 0.1)",
    padding: spacing.md,
  },
  emptyStateIcon: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(123, 194, 138, 0.14)",
  },
  emptyStateTitle: {
    color: "#ffffff",
    fontSize: typography.titleSm,
    fontWeight: "800",
  },
  emptyStateBody: {
    color: "#9ab39f",
    fontSize: typography.body,
    lineHeight: 21,
  },
  messageBubble: {
    maxWidth: "90%",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2a8c49",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#102119",
    borderWidth: 1,
    borderColor: "rgba(184, 223, 191, 0.12)",
  },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  messageRole: {
    color: "#b8d6bf",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  userRoleText: {
    color: "#e9f8eb",
  },
  messageText: {
    color: "#edf8ef",
    fontSize: typography.body,
    lineHeight: 21,
  },
  userMessageText: {
    color: "#ffffff",
  },
  telemetryCard: {
    borderRadius: radius.lg,
    backgroundColor: "#0f1e16",
    borderWidth: 1,
    borderColor: "rgba(188, 222, 194, 0.12)",
    padding: spacing.md,
    gap: spacing.md,
  },
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  telemetryItem: {
    minWidth: "47%",
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: spacing.sm,
    gap: 4,
  },
  telemetryLabel: {
    color: "#8fae96",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  telemetryValue: {
    color: "#edf8ef",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  conversationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  conversationValue: {
    color: "#edf8ef",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  sourceList: {
    gap: 6,
  },
  sourceHeader: {
    color: "#d8ebdc",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  sourceText: {
    color: "#97b29d",
    fontSize: typography.caption,
    lineHeight: 18,
  },
  composerCard: {
    borderRadius: radius.lg,
    backgroundColor: "#0f1f16",
    borderWidth: 1,
    borderColor: "rgba(184, 223, 191, 0.12)",
    padding: spacing.md,
    gap: spacing.sm,
  },
  composerLabel: {
    color: "#edf8ef",
    fontSize: typography.body,
    fontWeight: "700",
  },
  composerInput: {
    minHeight: 130,
    borderRadius: radius.lg,
    backgroundColor: "#14261c",
    borderWidth: 1,
    borderColor: "rgba(192, 226, 198, 0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: "#ffffff",
    fontSize: typography.body,
    lineHeight: 22,
  },
  composerFooter: {
    gap: spacing.sm,
  },
  composerHelper: {
    color: "#8fae96",
    fontSize: typography.caption,
    lineHeight: 18,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: "#c3f0b5",
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonPressed: {
    opacity: 0.9,
  },
  sendButtonText: {
    color: "#0b2310",
    fontSize: typography.body,
    fontWeight: "800",
  },
});
