import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  Popover,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RefreshIcon from "@mui/icons-material/Refresh";
import AirIcon from "@mui/icons-material/Air";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useLocationContext } from "../../context/LocationContext";
import { getAQI, getCurrentWeather } from "../../services/weatherService";

const weatherEmoji = (code: number) => {
  if (code === 0) return "\u2600\uFE0F";
  if (code <= 3) return "\u26C5";
  if (code >= 45 && code <= 48) return "\uD83C\uDF2B";
  if (code >= 51 && code <= 67) return "\uD83C\uDF27";
  if (code >= 71 && code <= 86) return "\uD83C\uDF28";
  if (code >= 95) return "\u26C8";
  return "\u26C5";
};

const formatNumber = (value?: number, suffix = "") =>
  typeof value === "number" && !Number.isNaN(value) ? `${Math.round(value)}${suffix}` : "--";

interface WeatherWidgetProps {
  compact?: boolean;
  tone?: "light" | "dark";
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ compact = false, tone = "light" }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery("(max-width:900px)");
  const { coords, label, status, error, manualLocation, requestLocation, saveManualLocation } =
    useLocationContext();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [manualInput, setManualInput] = useState(manualLocation);

  useEffect(() => {
    setManualInput(manualLocation);
  }, [manualLocation]);

  const weatherQuery = useQuery({
    queryKey: ["weather-current", coords?.lat, coords?.lon],
    queryFn: () => getCurrentWeather(coords!.lat, coords!.lon),
    enabled: Boolean(coords),
    staleTime: 1000 * 60 * 10,
  });

  const aqiQuery = useQuery({
    queryKey: ["weather-aqi", coords?.lat, coords?.lon],
    queryFn: () => getAQI(coords!.lat, coords!.lon),
    enabled: Boolean(coords),
    staleTime: 1000 * 60 * 10,
  });

  const translatedCondition = useMemo(() => {
    const code = weatherQuery.data?.weatherCode;
    if (typeof code !== "number") {
      return weatherQuery.data?.condition || "--";
    }
    return t(`weather_widget.conditions.${code}`, {
      defaultValue: weatherQuery.data?.condition || "--",
    });
  }, [t, weatherQuery.data?.condition, weatherQuery.data?.weatherCode]);

  const summary = useMemo(() => {
    if (weatherQuery.isLoading || aqiQuery.isLoading) {
      return t("weather_widget.loading");
    }
    if (!weatherQuery.data || !aqiQuery.data) {
      return status === "locating" ? t("weather_widget.locating") : t("weather_widget.unavailable");
    }
    const emoji = weatherEmoji(weatherQuery.data.weatherCode);
    return `${emoji} ${formatNumber(weatherQuery.data.temperatureC, "\u00B0C")} | AQI ${formatNumber(
      aqiQuery.data.aqi,
    )} | ${formatNumber(weatherQuery.data.humidity, "%")} ${t("weather_widget.humidity_short")}`;
  }, [aqiQuery.data, status, t, weatherQuery.data, weatherQuery.isLoading, aqiQuery.isLoading]);

  const offlineMeta = useMemo(() => {
    const weatherOffline = Boolean(weatherQuery.data?.offline || weatherQuery.data?.stale);
    const aqiOffline = Boolean(aqiQuery.data?.offline || aqiQuery.data?.stale);
    const offline =
      weatherOffline || aqiOffline || (typeof navigator !== "undefined" && !navigator.onLine);
    const updatedAt = weatherQuery.data?.lastUpdated || aqiQuery.data?.lastUpdated;
    return { offline, updatedAt };
  }, [aqiQuery.data, weatherQuery.data]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSaveManual = async () => {
    if (!manualInput.trim()) return;
    await saveManualLocation(manualInput);
  };

  const popoverOpen = Boolean(anchorEl);
  const locationLabel = label || manualLocation || t("weather_widget.unknown_location");

  return (
    <>
      <ButtonBase
        onClick={handleOpen}
        aria-label={t("weather_widget.open_details")}
        sx={{
          borderRadius: 999,
          px: compact ? 1.1 : 1.4,
          py: compact ? 0.45 : 0.6,
          bgcolor: tone === "dark" ? "rgba(11, 44, 24, 0.85)" : "rgba(255,255,255,0.16)",
          border:
            tone === "dark"
              ? "1px solid rgba(255,255,255,0.25)"
              : "1px solid rgba(255,255,255,0.35)",
          color: "#fff",
          fontWeight: 700,
          fontSize: compact ? { xs: "0.78rem", md: "0.86rem" } : { xs: "0.8rem", md: "0.9rem" },
          textTransform: "none",
          whiteSpace: "normal",
          textAlign: "left",
          lineHeight: 1.15,
          maxWidth: "100%",
          "&:hover": {
            bgcolor: tone === "dark" ? "rgba(11, 44, 24, 0.95)" : "rgba(255,255,255,0.24)",
          },
        }}
      >
        {summary}
      </ButtonBase>

      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            p: 2,
            width: { xs: "90vw", sm: 340 },
            maxWidth: 380,
            borderRadius: 2.5,
            border: "1px solid rgba(23, 70, 38, 0.2)",
            background:
              "linear-gradient(135deg, rgba(249, 255, 249, 0.98), rgba(230, 246, 235, 0.98))",
            boxShadow: "0 16px 32px rgba(16, 62, 33, 0.28)",
          },
        }}
      >
        <Stack spacing={1.4}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <LocationOnIcon sx={{ color: "#1b6b3a" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {locationLabel}
              </Typography>
            </Stack>
            <IconButton
              size="small"
              onClick={requestLocation}
              aria-label={t("weather_widget.refresh_location")}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>

          {error && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <InfoOutlinedIcon sx={{ color: "#b7602a" }} fontSize="small" />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                {error}
              </Typography>
            </Stack>
          )}
          {offlineMeta.offline && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <InfoOutlinedIcon sx={{ color: "#d07a2b" }} fontSize="small" />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.25 }}>
                {t("weather_widget.offline_last_updated")}
                {offlineMeta.updatedAt
                  ? ` (${new Date(offlineMeta.updatedAt).toLocaleString()})`
                  : ""}
              </Typography>
            </Stack>
          )}

          <Divider />

          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ThermostatIcon sx={{ color: "#c75b22" }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("weather_widget.temperature")}
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: "auto" }}>
                {formatNumber(weatherQuery.data?.temperatureC, "\u00B0C")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <WaterDropIcon sx={{ color: "#1b6b3a" }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("weather_widget.humidity")}
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: "auto" }}>
                {formatNumber(weatherQuery.data?.humidity, "%")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <AirIcon sx={{ color: "#4b915c" }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("weather_widget.wind_speed")}
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: "auto" }}>
                {formatNumber(weatherQuery.data?.windSpeedKph, " km/h")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("weather_widget.condition")}
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: "auto" }}>
                {translatedCondition}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("weather_widget.aqi")}
              </Typography>
              <Typography variant="body2" sx={{ marginLeft: "auto" }}>
                {formatNumber(aqiQuery.data?.aqi)}
              </Typography>
            </Stack>
          </Stack>

          {(!coords || status === "denied" || status === "error") && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t("weather_widget.manual_hint")}
              </Typography>
              <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ mt: 1 }}>
                <TextField
                  size="small"
                  placeholder={t("weather_widget.manual_placeholder")}
                  value={manualInput}
                  onChange={(event) => setManualInput(event.target.value)}
                  fullWidth
                />
                <Button variant="contained" onClick={handleSaveManual} sx={{ minWidth: 120 }}>
                  {t("actions.save")}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </Popover>
    </>
  );
};

export default React.memo(WeatherWidget);
