import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateProfile } from "../services/auth";
import { setUser } from "../store/authSlice";

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const languageOptions = useMemo(
    () => [
      { code: "en", label: t("languages.en") },
      { code: "hi", label: t("languages.hi") }
    ],
    [t]
  );

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profile_image_url: user?.profile_image_url || "",
    location: user?.location || "",
    farm_size: user?.farm_size ? String(user.farm_size) : "",
    soil_type: user?.soil_type || "",
    water_source: user?.water_source || "",
    primary_crops: user?.primary_crops?.join(", ") || "",
    language: user?.language || "en",
    risk_view_consent: Boolean(user?.risk_view_consent),
    notifications: user?.preferences?.notifications ?? true,
    voice_input: user?.preferences?.voice_input ?? true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError(t("profile.photo_invalid", { defaultValue: "Please choose an image file." }));
      return;
    }
    const maxSizeMb = 2;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setPhotoError(
        t("profile.photo_too_large", {
          defaultValue: "Image must be under {{size}}MB.",
          size: maxSizeMb
        })
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, profile_image_url: result }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      profile_image_url: user?.profile_image_url || "",
      location: user?.location || "",
      farm_size: user?.farm_size ? String(user.farm_size) : "",
      soil_type: user?.soil_type || "",
      water_source: user?.water_source || "",
      primary_crops: user?.primary_crops?.join(", ") || "",
      language: user?.language || "en",
      risk_view_consent: Boolean(user?.risk_view_consent),
      notifications: user?.preferences?.notifications ?? true,
      voice_input: user?.preferences?.voice_input ?? true
    });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const farmSize = form.farm_size ? Number(form.farm_size) : undefined;
      const payload = {
        name: form.name || undefined,
        email: form.email || undefined,
        profile_image_url: form.profile_image_url ? form.profile_image_url : null,
        location: form.location || undefined,
        farm_size: farmSize && farmSize > 0 ? farmSize : undefined,
        soil_type: form.soil_type || undefined,
        water_source: form.water_source || undefined,
        primary_crops: form.primary_crops
          ? form.primary_crops.split(",").map((item) => item.trim()).filter(Boolean)
          : undefined,
        language: form.language || undefined,
        risk_view_consent: form.risk_view_consent,
        preferences: {
          notifications: form.notifications,
          voice_input: form.voice_input
        }
      };
      const updated = await updateProfile(payload);
      dispatch(setUser(updated));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const roleCode = user?.role || "farmer";
  const roleLabel =
    roleCode === "farmer"
      ? t("auth.role_farmer")
      : roleCode === "extension_officer"
        ? t("auth.role_extension_officer")
        : roleCode === "admin"
          ? t("layout.role_admin")
          : roleCode.replace("_", " ");

  const summaryItems = [
    { label: t("auth.location"), value: user?.location || "-" },
    {
      label: t("auth.farm_size"),
      value: user?.farm_size ? `${user.farm_size}` : "-"
    },
    { label: t("auth.soil_type"), value: user?.soil_type || "-" },
    { label: t("auth.water_source"), value: user?.water_source || "-" },
    { label: t("auth.language"), value: user?.language ? user.language.toUpperCase() : "-" },
    {
      label: t("profile.notifications", { defaultValue: "Notifications" }),
      value: user?.preferences?.notifications ? t("profile.yes", { defaultValue: "Yes" }) : t("profile.no", { defaultValue: "No" })
    },
    {
      label: t("profile.voice_input", { defaultValue: "Voice input" }),
      value: user?.preferences?.voice_input ? t("profile.yes", { defaultValue: "Yes" }) : t("profile.no", { defaultValue: "No" })
    },
    {
      label: t("profile.risk_consent", { defaultValue: "Share risk profile with officers" }),
      value: user?.risk_view_consent ? t("profile.yes", { defaultValue: "Yes" }) : t("profile.no", { defaultValue: "No" })
    }
  ];

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<AgricultureIcon color="primary" />}
          title={t("profile.title", { defaultValue: "Farmer Profile" })}
          subtitle={t("profile.subtitle", { defaultValue: "Update your KrishiMitra profile and preferences." })}
          badges={[roleLabel, t("auth.location"), t("dashboard.crop")]}
          imageSrc="/assets/agri-slider/slide-03.png"
        />

        <Card sx={{ border: "1px solid #e7ddcc" }}>
          <CardContent>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={3}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={user?.profile_image_url || undefined}
                    alt={user?.name || t("profile.title", { defaultValue: "Farmer Profile" })}
                    sx={{
                      width: 96,
                      height: 96,
                      border: "2px solid rgba(27, 107, 58, 0.2)",
                      boxShadow: "0 12px 24px rgba(16, 66, 35, 0.2)"
                    }}
                  />
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {user?.name || "-"}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {roleLabel}
                    </Typography>
                    <Typography variant="body2">{user?.phone || "-"}</Typography>
                    {user?.email && <Typography variant="body2">{user.email}</Typography>}
                  </Box>
                </Stack>
                <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ letterSpacing: 0.6, textTransform: "uppercase" }}
                  >
                    {t("profile.member_since", { defaultValue: "Member Since" })}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ letterSpacing: 0.6, textTransform: "uppercase", mt: 1 }}
                  >
                    {t("profile.last_updated", { defaultValue: "Last Updated" })}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : "-"}
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              <Grid container spacing={3}>
                {summaryItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.label}>
                    <Stack spacing={0.5}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ letterSpacing: 0.6, textTransform: "uppercase" }}
                      >
                        {item.label}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.value}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
                <Grid item xs={12} md={8}>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ letterSpacing: 0.6, textTransform: "uppercase" }}
                    >
                      {t("auth.primary_crops")}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      {(user?.primary_crops || []).length > 0 ? (
                        user?.primary_crops.map((crop) => <Chip key={crop} label={crop} size="small" />)
                      ) : (
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          -
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ border: "1px solid #e7ddcc" }}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{t("profile.edit_title", { defaultValue: "Profile Details" })}</Typography>
              {error && <Alert severity="error">{error}</Alert>}
              {saved && <Alert severity="success">{t("profile.saved", { defaultValue: "Profile updated." })}</Alert>}
              {photoError && <Alert severity="warning">{photoError}</Alert>}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Avatar
                  src={form.profile_image_url || undefined}
                  alt={form.name || t("profile.title", { defaultValue: "Farmer Profile" })}
                  sx={{ width: 72, height: 72, border: "1px solid rgba(27, 107, 58, 0.2)" }}
                />
                <Stack spacing={1}>
                  <Typography variant="subtitle1">
                    {t("profile.photo_label", { defaultValue: "Profile photo" })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("profile.photo_helper", {
                      defaultValue: "Upload a clear photo (JPG or PNG, max 2MB)."
                    })}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button component="label" variant="outlined">
                      {t("profile.upload_photo", { defaultValue: "Upload photo" })}
                      <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                    </Button>
                    {form.profile_image_url && (
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => setForm((prev) => ({ ...prev, profile_image_url: "" }))}
                      >
                        {t("profile.remove_photo", { defaultValue: "Remove" })}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("auth.name")}
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("auth.phone")}
                    value={user?.phone || ""}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("profile.email", { defaultValue: "Email" })}
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t("auth.location")}
                    value={form.location}
                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t("auth.farm_size")}
                    value={form.farm_size}
                    onChange={(event) => setForm((prev) => ({ ...prev, farm_size: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t("auth.soil_type")}
                    value={form.soil_type}
                    onChange={(event) => setForm((prev) => ({ ...prev, soil_type: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={t("auth.water_source")}
                    value={form.water_source}
                    onChange={(event) => setForm((prev) => ({ ...prev, water_source: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t("auth.primary_crops")}
                    value={form.primary_crops}
                    onChange={(event) => setForm((prev) => ({ ...prev, primary_crops: event.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label={t("auth.language")}
                    value={form.language}
                    onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
                  >
                    {languageOptions.map((option) => (
                      <MenuItem key={option.code} value={option.code}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Typography variant="subtitle1">{t("profile.preferences_title", { defaultValue: "Preferences" })}</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.notifications}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, notifications: event.target.checked }))
                      }
                    />
                  }
                  label={t("profile.notifications", { defaultValue: "Notifications" })}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.voice_input}
                      onChange={(event) => setForm((prev) => ({ ...prev, voice_input: event.target.checked }))}
                    />
                  }
                  label={t("profile.voice_input", { defaultValue: "Voice input" })}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.risk_view_consent}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, risk_view_consent: event.target.checked }))
                      }
                    />
                  }
                  label={t("profile.risk_consent", { defaultValue: "Share risk profile with officers" })}
                />
              </Stack>

              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? t("actions.submitting") : t("profile.save", { defaultValue: "Save changes" })}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </AppLayout>
  );
};

export default ProfilePage;
