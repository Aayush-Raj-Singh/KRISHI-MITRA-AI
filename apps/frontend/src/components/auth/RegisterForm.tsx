import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { registerUser, type RegisterPayload } from "../../services/auth";
import { ApiError } from "../../services/api";
import { resolveRootBaseUrl } from "../../services/runtimeConfig";
import { useAppDispatch } from "../../store/hooks";
import { setTokens, setUser } from "../../store/authSlice";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import LockIcon from "@mui/icons-material/Lock";
import PlaceIcon from "@mui/icons-material/Place";
import LandscapeIcon from "@mui/icons-material/Landscape";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";

const phoneDigits = (value: string) => value.replace(/\D/g, "").slice(0, 10);
const capitalizeWords = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase());

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildPasswordError = (value: string) => {
  const issues: string[] = [];
  if (value.length < 8) issues.push("min 8 characters");
  if (value.length > 72) issues.push("max 72 characters");
  if (!/[A-Z]/.test(value)) issues.push("an uppercase letter");
  if (!/[a-z]/.test(value)) issues.push("a lowercase letter");
  if (!/[0-9]/.test(value)) issues.push("a number");
  if (!/[^A-Za-z0-9]/.test(value)) issues.push("a special character");
  return issues.length ? `Password must include ${issues.join(", ")}.` : "";
};

const RegisterForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const alignedFieldSx = {
    "& .MuiFormHelperText-root": {
      minHeight: 22,
      mt: 0.5
    }
  } as const;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    location: "",
    farm_size: "",
    soil_type: "",
    water_source: "",
    primary_crops: "",
    role: "farmer",
    language: "en",
    assigned_regions: ""
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline"
  );
  const [showConnectedBanner, setShowConnectedBanner] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const checkApiHealth = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setApiStatus("offline");
      return;
    }
    setApiStatus("checking");
    const rootBase = resolveRootBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${rootBase}/health`, { signal: controller.signal });
      setApiStatus(response.ok ? "online" : "offline");
    } catch {
      setApiStatus("offline");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const languageOptions = [
    { code: "en", label: t("languages.en") },
    { code: "hi", label: t("languages.hi") },
    { code: "bn", label: t("languages.bn") },
    { code: "ta", label: t("languages.ta") },
    { code: "te", label: t("languages.te") },
    { code: "mr", label: t("languages.mr") },
    { code: "gu", label: t("languages.gu") },
    { code: "kn", label: t("languages.kn") },
    { code: "pa", label: t("languages.pa") },
    { code: "as", label: t("languages.as") },
    { code: "ml", label: t("languages.ml") },
    { code: "or", label: t("languages.or") },
    { code: "ur", label: t("languages.ur") },
    { code: "ne", label: t("languages.ne") },
    { code: "sa", label: t("languages.sa") }
  ];

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (successMessage) setSuccessMessage(null);
    setServerErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    const name = form.name.trim();
    if (!name || name.length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    const phone = phoneDigits(form.phone);
    if (!phone || phone.length !== 10) {
      errors.phone = "Phone number must be 10 digits.";
    }

    const email = form.email.trim();
    if (email && !emailRegex.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    const passwordError = buildPasswordError(form.password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (!form.location.trim()) {
      errors.location = "Location is required.";
    }

    const farmSizeNumber = Number(form.farm_size);
    if (!form.farm_size || Number.isNaN(farmSizeNumber) || farmSizeNumber <= 0) {
      errors.farm_size = "Farm size must be greater than 0.";
    }

    if (!form.soil_type.trim()) {
      errors.soil_type = "Soil type is required.";
    }

    if (!form.water_source.trim()) {
      errors.water_source = "Water source is required.";
    }

    const crops = form.primary_crops
      .split(",")
      .map((crop) => crop.trim())
      .filter(Boolean);
    if (crops.length === 0) {
      errors.primary_crops = "Add at least one primary crop.";
    }

    return errors;
  }, [form]);

  const combinedErrors = useMemo(() => ({ ...validationErrors, ...serverErrors }), [validationErrors, serverErrors]);
  const isFormValid = Object.values(combinedErrors).every((value) => !value);

  const fieldError = (field: string) =>
    Boolean((touched[field] || submitAttempted) && combinedErrors[field]);
  const fieldHelper = (field: string, fallback = " ") =>
    fieldError(field) ? combinedErrors[field] : fallback;

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error("registration_error", error);
      }
      if (error instanceof ApiError) {
        const nextErrors: Record<string, string> = {};
        const details = error.details;
        if (Array.isArray(details)) {
          details.forEach((item) => {
            const loc = Array.isArray(item?.loc) ? item.loc : [];
            const field = String(loc[loc.length - 1] || "");
            if (field) {
              nextErrors[field] = String(item?.msg || "Invalid value");
            }
          });
        }
        if (!Object.keys(nextErrors).length && typeof error.message === "string") {
          if (error.message.toLowerCase().includes("phone")) {
            nextErrors.phone = error.message;
          } else if (error.message.toLowerCase().includes("email")) {
            nextErrors.email = error.message;
          } else {
            nextErrors._form = error.message;
          }
        }
        if (Object.keys(nextErrors).length) {
          setServerErrors(nextErrors);
          setSubmitAttempted(true);
        }
      }
    }
  });

  useEffect(() => {
    void checkApiHealth();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online");
      void checkApiHealth();
    };
    const handleOffline = () => {
      setNetworkStatus("offline");
      setApiStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (apiStatus === "online" && networkStatus === "online") {
      setShowConnectedBanner(true);
      const timeout = window.setTimeout(() => setShowConnectedBanner(false), 3500);
      return () => window.clearTimeout(timeout);
    }
    if (apiStatus === "offline" || networkStatus === "offline") {
      setShowConnectedBanner(false);
    }
    return undefined;
  }, [apiStatus, networkStatus]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(serverErrors).length) {
      setServerErrors({});
    }
    if (!isFormValid) return;

    const payload: RegisterPayload = {
      name: capitalizeWords(form.name),
      phone: phoneDigits(form.phone),
      email: form.email.trim() || undefined,
      password: form.password,
      location: form.location.trim(),
      farm_size: Number(form.farm_size),
      soil_type: form.soil_type.trim(),
      water_source: form.water_source.trim(),
      primary_crops: form.primary_crops
        .split(",")
        .map((crop) => crop.trim())
        .filter(Boolean),
      role: form.role,
      language: form.language,
      assigned_regions: form.assigned_regions
        .split(",")
        .map((region) => region.trim())
        .filter(Boolean)
    };

    mutation.mutate(payload, {
      onSuccess: (result) => {
        dispatch(setUser(result.user));
        if (result.token) {
          dispatch(setTokens(result.token));
        }
        setSuccessMessage("Registration successful. Redirecting to dashboard...");
        window.setTimeout(() => navigate("/dashboard"), 600);
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 700, width: "100%", mx: "auto", mt: { xs: 2, md: 0 } }}>
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {t("auth.create")}
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {(networkStatus === "offline" || apiStatus === "offline") && (
              <Alert
                severity="warning"
                action={
                  <Button color="inherit" size="small" onClick={checkApiHealth}>
                    Retry
                  </Button>
                }
              >
                You are offline.
              </Alert>
            )}
            {showConnectedBanner && (
              <Alert severity="success">Connected to internet.</Alert>
            )}
            {mutation.isError && (
              <Alert severity="error">
                {serverErrors._form
                  ? serverErrors._form
                  : mutation.error instanceof Error && mutation.error.message === "Validation error"
                    ? "Please review the highlighted fields."
                    : mutation.error instanceof Error
                      ? mutation.error.message
                      : t("auth.registration_failed")}
              </Alert>
            )}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
          </Stack>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                name="name"
                label={t("auth.name")}
                required
                fullWidth
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                onBlur={() => updateField("name", capitalizeWords(form.name))}
                sx={alignedFieldSx}
                error={fieldError("name")}
                helperText={fieldHelper("name")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <TextField
                    name="phone"
                    label={t("auth.phone")}
                    required
                    fullWidth
                    value={form.phone}
                    onChange={(event) => updateField("phone", phoneDigits(event.target.value))}
                    sx={alignedFieldSx}
                    error={fieldError("phone")}
                    helperText={fieldHelper("phone", "10 digits")}
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 10 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIphoneIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="email"
                    label={t("auth.email", { defaultValue: "Email (optional)" })}
                    fullWidth
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    sx={alignedFieldSx}
                    error={fieldError("email")}
                    helperText={fieldHelper("email")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AlternateEmailIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <TextField
                    name="password"
                    label={t("auth.password")}
                    type="password"
                    required
                    fullWidth
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    sx={alignedFieldSx}
                    error={fieldError("password")}
                    helperText={
                      fieldError("password")
                        ? validationErrors.password
                        : "Min 8 chars, upper, lower, number, special"
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
              <TextField
                name="location"
                label={t("auth.location")}
                required
                fullWidth
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                sx={alignedFieldSx}
                error={fieldError("location")}
                helperText={fieldHelper("location")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <TextField
                    name="farm_size"
                    label={t("auth.farm_size")}
                    type="number"
                    inputProps={{ step: "0.1", min: 0 }}
                    required
                    fullWidth
                    value={form.farm_size}
                    onChange={(event) => updateField("farm_size", event.target.value)}
                    sx={alignedFieldSx}
                    error={fieldError("farm_size")}
                    helperText={fieldHelper("farm_size")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LandscapeIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="soil_type"
                    label={t("auth.soil_type")}
                    required
                    fullWidth
                    value={form.soil_type}
                    onChange={(event) => updateField("soil_type", event.target.value)}
                    sx={alignedFieldSx}
                    error={fieldError("soil_type")}
                    helperText={fieldHelper("soil_type")}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <TextField
                    name="water_source"
                    label={t("auth.water_source")}
                    required
                    fullWidth
                    value={form.water_source}
                    onChange={(event) => updateField("water_source", event.target.value)}
                    sx={alignedFieldSx}
                    error={fieldError("water_source")}
                    helperText={fieldHelper("water_source")}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WaterDropIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="primary_crops"
                    label={t("auth.primary_crops")}
                    required
                    fullWidth
                    value={form.primary_crops}
                    onChange={(event) => updateField("primary_crops", event.target.value)}
                    sx={alignedFieldSx}
                    error={fieldError("primary_crops")}
                    helperText={
                      fieldError("primary_crops")
                        ? validationErrors.primary_crops
                        : t("auth.primary_crops_helper")
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AgricultureIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <TextField
                    name="role"
                    label={t("auth.role")}
                    select
                    value={form.role}
                    onChange={(event) => updateField("role", event.target.value)}
                    fullWidth
                    sx={alignedFieldSx}
                    helperText=" "
                  >
                    <MenuItem value="farmer">{t("auth.role_farmer")}</MenuItem>
                    <MenuItem value="extension_officer">{t("auth.role_extension_officer")}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="language"
                    label={t("auth.language")}
                    select
                    value={form.language}
                    onChange={(event) => updateField("language", event.target.value)}
                    fullWidth
                    sx={alignedFieldSx}
                    helperText=" "
                  >
                    {languageOptions.map((lang) => (
                      <MenuItem key={lang.code} value={lang.code}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="assigned_regions"
                    label={t("auth.assigned_regions", { defaultValue: "Assigned regions (officer/admin)" })}
                    fullWidth
                    value={form.assigned_regions}
                    onChange={(event) => updateField("assigned_regions", event.target.value)}
                    sx={alignedFieldSx}
                    helperText={t("auth.assigned_regions_helper", { defaultValue: "Comma-separated districts/states" })}
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" disabled={mutation.isPending || !isFormValid}>
                {mutation.isPending ? t("auth.creating") : t("auth.sign_up")}
              </Button>
            </Stack>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {t("auth.already_have_account")}
            <Link to="/login">{t("auth.sign_in")}</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterForm;
