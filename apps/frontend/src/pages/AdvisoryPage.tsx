import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MicIcon from "@mui/icons-material/Mic";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SendIcon from "@mui/icons-material/Send";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import TranslateIcon from "@mui/icons-material/Translate";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import PlaceIcon from "@mui/icons-material/Place";
import { useTranslation } from "react-i18next";

import type { CropAdvisorResponse } from "@krishimitra/shared";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { useLocationContext } from "../context/LocationContext";
import { getCachedWithMeta, setCached } from "../services/cache";
import { fetchAiAdvisorAdvice } from "../services/aiAdvisor";
import { useAppSelector } from "../store/hooks";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

type ChatMessage = {
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
  messages: ChatMessage[];
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

const ADVISORY_CACHE_KEY = "advisory:external-thread";
const ADVISOR_PROVIDER_LABEL = "Amazon Bedrock";
const ADVISOR_MODEL_LABEL = "AI Crop Advisor";

const normalizeAdvisorLanguage = (value?: string | null) => {
  const normalized = (value || "en").trim().toLowerCase();
  const base = normalized.split(/[-_]/)[0];
  return base || "en";
};

const advisoryCopySource = {
  runtimeSubtitle:
    "Use the external crop advisor with crop and location context for practical field guidance.",
  contextTitle: "Advisory context",
  contextSubtitle:
    "This advisor uses your location, crop, and problem statement for every response.",
  locationLabel: "Location",
  cropLabel: "Crop",
  useDetectedLocation: "Use detected location",
  useProfileDefaults: "Use profile defaults",
  quickPromptsTitle: "Quick prompts",
  usageTipsTitle: "How to ask better questions",
  usageTip1:
    "Describe symptoms, crop stage, irrigation changes, and recent weather in one message.",
  usageTip2:
    "Mention whether the issue is spreading and what you already tried so the response stays practical.",
  quickPrompt1: "My crop leaves are turning yellow. What should I inspect first?",
  quickPrompt2: "Should I irrigate today or wait for the next weather window?",
  quickPrompt3: "What mandi signals should I check before selling this week?",
  quickPrompt4: "How do I prevent disease after unseasonal rain?",
  contextRequiredError: "Location and crop are required before sending an advisory request.",
  cacheLoadedPrefix: "Loaded cached advisory history from",
  cacheFallbackPrefix: "Live advisory is unavailable. Showing cached advisory from",
  unavailableError: "The external advisory service is unavailable right now.",
  latestAdviceTitle: "Latest advisory snapshot",
  problemLabel: "Problem",
  adviceLabel: "Advice",
  recommendationsLabel: "Steps",
  safeguardsLabel: "Precautions",
  providerLabel: "Provider",
  modelLabel: "Model",
  updatedLabel: "Updated",
  currentScopeLabel: "Current scope",
  noMessages:
    "Start with a crop issue, irrigation question, or mandi decision to receive structured advice.",
  detectedLocationHelper:
    "Detected location is taken from the current device or saved profile location.",
  profileDefaultsHelper: "Profile defaults use your saved registration location and primary crop.",
  latestAdviceEmpty: "No advisory response yet.",
  responseReady: "External advisor ready",
} as const;

const resolveSpeechLang = (lang: string) => {
  const map: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    te: "te-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    kn: "kn-IN",
    pa: "pa-IN",
    as: "as-IN",
    ml: "ml-IN",
    or: "or-IN",
    ur: "ur-IN",
    ne: "ne-NP",
    sa: "hi-IN",
  };
  return map[lang] || "en-IN";
};

const formatTimestamp = (value: string, language: string) => {
  try {
    return new Date(value).toLocaleString(language);
  } catch {
    return new Date(value).toLocaleString();
  }
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
    model: typeof candidate.model === "string" ? candidate.model : ADVISOR_MODEL_LABEL,
    language: typeof candidate.language === "string" ? candidate.language : "en",
    location: candidate.location,
    crop: candidate.crop,
    query: typeof candidate.query === "string" ? candidate.query : "",
    createdAt:
      typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
  };
};

const AdvisoryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const {
    label: detectedLocation,
    source: detectedLocationSource,
    error: locationError,
  } = useLocationContext();
  const copy = useTranslatedStrings(useMemo(() => advisoryCopySource, []));
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastMeta, setLastMeta] = useState<AdvisoryRuntimeMeta | null>(null);
  const [contextLocation, setContextLocation] = useState("");
  const [contextCrop, setContextCrop] = useState("");
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const preferredLanguage = normalizeAdvisorLanguage(i18n.language || user?.language || "en");
  const profileCrop = user?.primary_crops?.[0]?.trim() || "";
  const profileLocation = user?.location?.trim() || "";
  const liveLocation = (detectedLocation || profileLocation).trim();
  const locationSourceLabel =
    detectedLocationSource === "geolocation"
      ? "GPS"
      : detectedLocationSource === "manual"
        ? "Manual"
        : detectedLocationSource === "cache"
          ? "Cached"
          : "Profile";

  const speechSynthesisAvailable =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  const speechRecognition = useMemo(() => {
    if (typeof window === "undefined") return null;
    const browserWindow = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognitionCtor =
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = resolveSpeechLang(preferredLanguage);
    recognition.continuous = false;
    recognition.interimResults = false;
    return recognition;
  }, [preferredLanguage]);

  const quickPrompts = useMemo(
    () => [copy.quickPrompt1, copy.quickPrompt2, copy.quickPrompt3, copy.quickPrompt4],
    [copy.quickPrompt1, copy.quickPrompt2, copy.quickPrompt3, copy.quickPrompt4],
  );

  useEffect(() => {
    const cached = getCachedWithMeta<AdvisoryCacheValue>(ADVISORY_CACHE_KEY);
    if (!cached?.value) {
      return;
    }
    setMessages(Array.isArray(cached.value.messages) ? cached.value.messages : []);
    setLastMeta(normalizeCachedRuntimeMeta(cached.value.meta));
    if (cached.value.context?.location) {
      setContextLocation(cached.value.context.location);
    }
    if (cached.value.context?.crop) {
      setContextCrop(cached.value.context.crop);
    }
    setNotice({ kind: "cached", updatedAt: new Date(cached.ts).toISOString() });
  }, []);

  useEffect(() => {
    if (!contextLocation && liveLocation) {
      setContextLocation(liveLocation);
    }
  }, [contextLocation, liveLocation]);

  useEffect(() => {
    if (!contextCrop && profileCrop) {
      setContextCrop(profileCrop);
    }
  }, [contextCrop, profileCrop]);

  const noticeMessage = useMemo(() => {
    if (!notice) return null;
    if (notice.kind === "error") {
      return notice.message;
    }
    const formatted = formatTimestamp(notice.updatedAt, preferredLanguage);
    if (notice.kind === "cached") {
      return `${copy.cacheLoadedPrefix} ${formatted}.`;
    }
    return `${copy.cacheFallbackPrefix} ${formatted}.`;
  }, [copy.cacheFallbackPrefix, copy.cacheLoadedPrefix, notice, preferredLanguage]);

  const persistConversation = (
    nextMessages: ChatMessage[],
    nextMeta: AdvisoryRuntimeMeta | null,
    nextContext: { location: string; crop: string },
  ) => {
    setCached(ADVISORY_CACHE_KEY, {
      messages: nextMessages,
      meta: nextMeta,
      context: nextContext,
    } satisfies AdvisoryCacheValue);
  };

  const handleSend = async (text?: string) => {
    const payload = (text ?? message).trim();
    if (!payload || submitting) return;

    const location = contextLocation.trim();
    const crop = contextCrop.trim();
    if (!location || !crop) {
      setNotice({ kind: "error", message: copy.contextRequiredError });
      return;
    }

    const nextMessages = [...messages, { role: "user", content: payload } as ChatMessage];
    setMessages(nextMessages);
    setMessage("");
    setSubmitting(true);
    setNotice(null);

    try {
      const response = await fetchAiAdvisorAdvice({
        location,
        crop,
        query: payload,
        language: preferredLanguage,
      });

      const runtimeMeta: AdvisoryRuntimeMeta = {
        ...response,
        provider: "bedrock",
        model: ADVISOR_MODEL_LABEL,
        language: preferredLanguage,
        location,
        crop,
        query: payload,
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
        } as ChatMessage,
      ];

      setMessages(updatedMessages);
      setLastMeta(runtimeMeta);
      persistConversation(updatedMessages, runtimeMeta, { location, crop });
    } catch (error) {
      const cached = getCachedWithMeta<AdvisoryCacheValue>(ADVISORY_CACHE_KEY);
      if (cached?.value) {
        setMessages(Array.isArray(cached.value.messages) ? cached.value.messages : []);
        setLastMeta(normalizeCachedRuntimeMeta(cached.value.meta));
        if (cached.value.context?.location) {
          setContextLocation(cached.value.context.location);
        }
        if (cached.value.context?.crop) {
          setContextCrop(cached.value.context.crop);
        }
        setNotice({ kind: "fallback", updatedAt: new Date(cached.ts).toISOString() });
      } else {
        setNotice({
          kind: "error",
          message: error instanceof Error ? error.message : copy.unavailableError,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoice = () => {
    if (!speechRecognition || submitting) return;
    setListening(true);
    speechRecognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setListening(false);
    };
    speechRecognition.onerror = () => {
      setListening(false);
    };
    speechRecognition.start();
  };

  const handleSpeak = (text: string, index: number) => {
    if (!speechSynthesisAvailable) return;
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = resolveSpeechLang(preferredLanguage);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleUseDetectedLocation = () => {
    if (liveLocation) {
      setContextLocation(liveLocation);
    }
  };

  const handleUseProfileDefaults = () => {
    if (profileLocation) {
      setContextLocation(profileLocation);
    } else if (liveLocation) {
      setContextLocation(liveLocation);
    }
    if (profileCrop) {
      setContextCrop(profileCrop);
    }
  };

  const heroBadges = useMemo(
    () => [
      ADVISOR_PROVIDER_LABEL,
      contextCrop || profileCrop || t("dashboard.crop"),
      contextLocation || liveLocation || copy.locationLabel,
    ],
    [contextCrop, contextLocation, copy.locationLabel, liveLocation, profileCrop, t],
  );

  const assistantReplies = messages.filter((item) => item.role === "assistant");
  const latestAssistantReply = assistantReplies[assistantReplies.length - 1]?.content || null;

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<TipsAndUpdatesIcon color="primary" />}
          title={t("advisory.title")}
          subtitle={copy.runtimeSubtitle}
          badges={heroBadges}
          imageSrc="/assets/agri-slider/slide-04.png"
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            icon={<TranslateIcon />}
            label={`${t("advisory_page.language_label")}: ${preferredLanguage.toUpperCase()}`}
          />
          <Chip icon={<TipsAndUpdatesIcon />} label={ADVISOR_PROVIDER_LABEL} variant="outlined" />
          <Chip
            icon={<PlaceIcon />}
            label={`${contextLocation || liveLocation || copy.locationLabel} · ${locationSourceLabel}`}
          />
          <Chip icon={<AgricultureIcon />} label={contextCrop || profileCrop || copy.cropLabel} />
          <Chip label={copy.responseReady} color="success" variant="outlined" />
        </Stack>

        {noticeMessage ? (
          <Alert
            severity={
              notice?.kind === "error" ? "error" : notice?.kind === "fallback" ? "warning" : "info"
            }
          >
            {noticeMessage}
          </Alert>
        ) : null}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={2.2}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {copy.contextTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {copy.contextSubtitle}
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    label={copy.locationLabel}
                    value={contextLocation}
                    onChange={(event) => setContextLocation(event.target.value)}
                    helperText={locationError || copy.detectedLocationHelper}
                  />
                  <TextField
                    fullWidth
                    label={copy.cropLabel}
                    value={contextCrop}
                    onChange={(event) => setContextCrop(event.target.value)}
                    helperText={copy.profileDefaultsHelper}
                  />

                  <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<MyLocationIcon />}
                      onClick={handleUseDetectedLocation}
                      disabled={!liveLocation}
                    >
                      {copy.useDetectedLocation}
                    </Button>
                    <Button
                      variant="text"
                      onClick={handleUseProfileDefaults}
                      disabled={!profileLocation && !profileCrop && !liveLocation}
                    >
                      {copy.useProfileDefaults}
                    </Button>
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {copy.quickPromptsTitle}
                    </Typography>
                    <Stack spacing={1}>
                      {quickPrompts.map((prompt) => (
                        <Chip key={prompt} label={prompt} onClick={() => void handleSend(prompt)} />
                      ))}
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {copy.usageTipsTitle}
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        {copy.usageTip1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {copy.usageTip2}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  {messages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {copy.noMessages}
                    </Typography>
                  ) : null}

                  {messages.map((item, index) => (
                    <Box
                      key={`${item.role}-${index}`}
                      sx={{
                        alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                        bgcolor:
                          item.role === "user"
                            ? isDark
                              ? "rgba(95, 209, 139, 0.18)"
                              : "rgba(27, 107, 58, 0.15)"
                            : isDark
                              ? "rgba(20, 63, 43, 0.92)"
                              : "#fff",
                        borderRadius: 2,
                        border: "1px solid #e4dccf",
                        px: 2,
                        py: 1,
                        maxWidth: "82%",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Typography variant="body2" sx={{ flex: 1, whiteSpace: "pre-line" }}>
                          {item.content}
                        </Typography>
                        {item.role === "assistant" && speechSynthesisAvailable ? (
                          <IconButton size="small" onClick={() => handleSpeak(item.content, index)}>
                            {speakingIndex === index ? (
                              <StopCircleIcon fontSize="small" />
                            ) : (
                              <VolumeUpIcon fontSize="small" />
                            )}
                          </IconButton>
                        ) : null}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Chip
                      icon={<TipsAndUpdatesIcon />}
                      label={`${copy.providerLabel}: ${ADVISOR_PROVIDER_LABEL}`}
                      variant="outlined"
                    />
                    <Chip label={`${copy.modelLabel}: ${ADVISOR_MODEL_LABEL}`} variant="outlined" />
                    <Chip
                      label={`${copy.currentScopeLabel}: ${contextCrop || profileCrop || "--"} · ${contextLocation || liveLocation || "--"}`}
                    />
                  </Stack>

                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {copy.latestAdviceTitle}
                    </Typography>
                    {lastMeta ? (
                      <Stack spacing={1.4}>
                        <Typography variant="caption" color="text.secondary">
                          {copy.updatedLabel}:{" "}
                          {formatTimestamp(lastMeta.createdAt, preferredLanguage)}
                        </Typography>
                        <Box>
                          <Typography variant="subtitle2">{copy.problemLabel}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lastMeta.query}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2">{copy.adviceLabel}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lastMeta.advice}
                          </Typography>
                        </Box>
                        {lastMeta.steps.length > 0 ? (
                          <Box>
                            <Typography variant="subtitle2">{copy.recommendationsLabel}</Typography>
                            <Stack spacing={0.6} sx={{ mt: 0.8 }}>
                              {lastMeta.steps.map((step, index) => (
                                <Typography
                                  key={`${lastMeta.createdAt}-step-${index + 1}`}
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {index + 1}. {step}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        ) : null}
                        {lastMeta.precautions.length > 0 ? (
                          <Box>
                            <Typography variant="subtitle2">{copy.safeguardsLabel}</Typography>
                            <Stack spacing={0.6} sx={{ mt: 0.8 }}>
                              {lastMeta.precautions.map((item, index) => (
                                <Typography
                                  key={`${lastMeta.createdAt}-precaution-${index + 1}`}
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {index + 1}. {item}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>
                        ) : null}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {latestAssistantReply || copy.latestAdviceEmpty}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={t("advisory.placeholder")}
                  />
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color={listening ? "secondary" : "primary"}
                      onClick={handleVoice}
                      disabled={!speechRecognition || submitting}
                    >
                      <MicIcon />
                    </IconButton>
                    <Button
                      variant="contained"
                      endIcon={<SendIcon />}
                      onClick={() => void handleSend()}
                      disabled={submitting}
                    >
                      {submitting ? t("actions.sending") : t("actions.send")}
                    </Button>
                  </Stack>
                </Stack>
                {!speechRecognition ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {t("advisory_page.voice_not_supported")}
                  </Typography>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default AdvisoryPage;
