import React from "react";
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

  const mutation = useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload)
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: RegisterPayload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      email: String(form.get("email") || "").trim() || undefined,
      password: String(form.get("password") || ""),
      location: String(form.get("location") || ""),
      farm_size: Number(form.get("farm_size") || 0),
      soil_type: String(form.get("soil_type") || ""),
      water_source: String(form.get("water_source") || ""),
      primary_crops: String(form.get("primary_crops") || "")
        .split(",")
        .map((crop) => crop.trim())
        .filter(Boolean),
      role: String(form.get("role") || "farmer"),
      language: String(form.get("language") || "en"),
      assigned_regions: String(form.get("assigned_regions") || "")
        .split(",")
        .map((region) => region.trim())
        .filter(Boolean),
    };

    mutation.mutate(payload, {
      onSuccess: (result) => {
        dispatch(setUser(result.user));
        if (result.token) {
          dispatch(setTokens(result.token));
        }
        navigate("/dashboard");
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 700, width: "100%", mx: "auto", mt: { xs: 2, md: 0 } }}>
      <Card sx={{ border: "1px solid #e6dcc9", borderRadius: 3, bgcolor: "rgba(255,255,255,0.95)" }}>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {t("auth.create")}
          </Typography>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mutation.error instanceof Error ? mutation.error.message : t("auth.registration_failed")}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                name="name"
                label={t("auth.name")}
                required
                fullWidth
                sx={alignedFieldSx}
                helperText=" "
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
                    sx={alignedFieldSx}
                    helperText=" "
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
                    sx={alignedFieldSx}
                    helperText=" "
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
                    sx={alignedFieldSx}
                    helperText={t("auth.password_range_helper")}
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
                sx={alignedFieldSx}
                helperText=" "
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
                    sx={alignedFieldSx}
                    helperText=" "
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
                  <TextField name="soil_type" label={t("auth.soil_type")} required fullWidth sx={alignedFieldSx} helperText=" " />
                </Grid>
              </Grid>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} md={6}>
                  <TextField
                    name="water_source"
                    label={t("auth.water_source")}
                    required
                    fullWidth
                    sx={alignedFieldSx}
                    helperText=" "
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
                    sx={alignedFieldSx}
                    helperText={t("auth.primary_crops_helper")}
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
                  <TextField name="role" label={t("auth.role")} select defaultValue="farmer" fullWidth sx={alignedFieldSx} helperText=" ">
                    <MenuItem value="farmer">{t("auth.role_farmer")}</MenuItem>
                    <MenuItem value="extension_officer">{t("auth.role_extension_officer")}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField name="language" label={t("auth.language")} select defaultValue="en" fullWidth sx={alignedFieldSx} helperText=" ">
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
                    sx={alignedFieldSx}
                    helperText={t("auth.assigned_regions_helper", { defaultValue: "Comma-separated districts/states" })}
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" disabled={mutation.isPending}>
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
