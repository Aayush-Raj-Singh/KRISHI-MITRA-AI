import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Divider,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import SendIcon from "@mui/icons-material/Send";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import TranslateIcon from "@mui/icons-material/Translate";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { fetchAdvisorySlaTelemetry, sendAdvisoryMessage, type ChatResponse } from "../services/advisory";
import { useAppSelector } from "../store/hooks";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AdvisoryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const canViewTelemetry = user?.role === "extension_officer" || user?.role === "admin";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [lastMeta, setLastMeta] = useState<ChatResponse | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const speechSynthesisAvailable =
    typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

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
      sa: "hi-IN"
    };
    return map[lang] || "en-IN";
  };

  const quickPrompts = [
    t("advisory_page.quick_prompt_1"),
    t("advisory_page.quick_prompt_2"),
    t("advisory_page.quick_prompt_3"),
    t("advisory_page.quick_prompt_4")
  ];

  const speechRecognition = useMemo(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return null;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    return recognition;
  }, []);

  const mutation = useMutation({
    mutationFn: sendAdvisoryMessage,
    onSuccess: (response) => {
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
      setLastMeta(response);
    }
  });

  const telemetryQuery = useQuery({
    queryKey: ["advisory-sla-telemetry"],
    queryFn: () => fetchAdvisorySlaTelemetry({ window_minutes: 1440, sla_target_ms: 3000 }),
    enabled: canViewTelemetry,
    refetchInterval: 60000,
  });

  const handleSend = (text?: string) => {
    const payload = (text ?? message).trim();
    if (!payload) return;
    setMessages((prev) => [...prev, { role: "user", content: payload }]);
    setMessage("");
    mutation.mutate({ message: payload, language: i18n.language });
  };

  const handleVoice = () => {
    if (!speechRecognition) return;
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
    utterance.lang = resolveSpeechLang(i18n.language);
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<TipsAndUpdatesIcon color="primary" />}
          title={t("advisory.title")}
          subtitle={t("advisory_page.subtitle")}
          badges={[t("advisory_page.powered_by_bedrock"), t("dashboard.crop"), t("dashboard.water")]}
          imageSrc="/assets/agri-slider/slide-04.png"
        />
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip icon={<TranslateIcon />} label={`${t("advisory_page.language_label")}: ${i18n.language.toUpperCase()}`} />
          <Chip icon={<TipsAndUpdatesIcon />} label={t("advisory_page.powered_by_bedrock")} variant="outlined" />
          {canViewTelemetry && telemetryQuery.data && (
            <>
              <Chip
                label={`P95 ${Math.round(telemetryQuery.data.p95_latency_ms)}ms`}
                color={telemetryQuery.data.sla_compliant ? "success" : "warning"}
                variant="outlined"
              />
              <Chip
                label={`Fallback ${telemetryQuery.data.fallback_responses}/${telemetryQuery.data.total_requests}`}
                variant="outlined"
              />
            </>
          )}
        </Stack>

        {mutation.isError && (
          <Alert severity="error">
            {mutation.error instanceof Error ? mutation.error.message : t("advisory_page.failed_service")}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("advisory_page.quick_prompts_title")}
                </Typography>
                <Stack spacing={1} sx={{ mb: 3 }}>
                  {quickPrompts.map((prompt) => (
                    <Chip key={prompt} label={prompt} onClick={() => handleSend(prompt)} />
                  ))}
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  {t("advisory_page.usage_tips_title")}
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {t("advisory_page.usage_tip_1")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("advisory_page.usage_tip_2")}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  {messages.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {t("advisory.placeholder")}
                    </Typography>
                  )}
                  {messages.map((item, index) => (
                    <Box
                      key={`${item.role}-${index}`}
                      sx={{
                        alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                        bgcolor: item.role === "user" ? "rgba(27, 107, 58, 0.15)" : "#fff",
                        borderRadius: 2,
                        border: "1px solid #e4dccf",
                        px: 2,
                        py: 1,
                        maxWidth: "80%"
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {item.content}
                        </Typography>
                        {item.role === "assistant" && speechSynthesisAvailable && (
                          <IconButton size="small" onClick={() => handleSpeak(item.content, index)}>
                            {speakingIndex === index ? <StopCircleIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                          </IconButton>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {lastMeta && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Typography variant="caption" color="text.secondary">
                      {t("advisory_page.model")}: {lastMeta.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("advisory_page.conversation_id")}: {lastMeta.conversation_id}
                    </Typography>
                  </Stack>
                  {lastMeta.sources.length > 0 && (
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t("advisory_page.sources")}
                      </Typography>
                      {lastMeta.sources.map((source) => (
                        <Typography key={source.title} variant="caption" color="text.secondary">
                          {source.title}: {source.reference}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            )}

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
                    <IconButton color={listening ? "secondary" : "primary"} onClick={handleVoice} disabled={!speechRecognition}>
                      <MicIcon />
                    </IconButton>
                    <Button
                      variant="contained"
                      endIcon={<SendIcon />}
                      onClick={() => handleSend()}
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? t("actions.sending") : t("actions.send")}
                    </Button>
                  </Stack>
                </Stack>
                {!speechRecognition && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    {t("advisory_page.voice_not_supported")}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default AdvisoryPage;
