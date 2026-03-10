import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import LockIcon from "@mui/icons-material/Lock";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { loginUser, type LoginPayload } from "../../services/auth";
import { useAppDispatch } from "../../store/hooks";
import { setTokens } from "../../store/authSlice";

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload)
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") || "");
    const password = String(form.get("password") || "");
    mutation.mutate(
      { phone, password },
      {
        onSuccess: (token) => {
          dispatch(setTokens(token));
          navigate("/dashboard");
        }
      }
    );
  };

  return (
    <Box sx={{ maxWidth: 460, width: "100%", mx: "auto", mt: { xs: 2, md: 0 } }}>
      <Card sx={{ border: "1px solid #e6dcc9", borderRadius: 3, bgcolor: "rgba(255,255,255,0.95)" }}>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {t("auth.welcome")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("app.subtitle")}
          </Typography>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mutation.error instanceof Error ? mutation.error.message : t("auth.login_failed")}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                name="phone"
                label={t("auth.phone")}
                required
                fullWidth
                helperText={t("auth.phone_helper")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIphoneIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                name="password"
                label={t("auth.password")}
                type="password"
                required
                fullWidth
                helperText={t("auth.password_helper")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
              <Button type="submit" variant="contained" disabled={mutation.isPending}>
                {mutation.isPending ? t("auth.signing_in") : t("auth.sign_in")}
              </Button>
            </Stack>
          </Box>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <Link to="/reset-password">{t("auth.forgot_password")}</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {t("auth.new_to_platform")}
            <Link to="/register">{t("auth.sign_up")}</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;
