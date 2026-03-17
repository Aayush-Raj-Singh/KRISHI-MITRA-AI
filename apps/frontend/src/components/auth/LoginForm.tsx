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

import { fetchCurrentUser, loginUser, type LoginPayload } from "../../services/auth";
import { useAppDispatch } from "../../store/hooks";
import { setTokens, setUser } from "../../store/authSlice";

const normalizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const mutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const token = await loginUser(payload);
      return { token, user: await fetchCurrentUser() };
    }
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = normalizePhone(String(form.get("phone") || ""));
    const password = String(form.get("password") || "");
    if (phone.length !== 10 || password.length < 8) {
      return;
    }
    mutation.mutate(
      { phone, password },
      {
        onSuccess: ({ token, user }) => {
          dispatch(setTokens(token));
          dispatch(setUser(user));
          navigate("/dashboard");
        }
      }
    );
  };

  return (
    <Box sx={{ maxWidth: 460, width: "100%", mx: "auto", mt: { xs: 2, md: 0 } }}>
      <Card>
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
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 10 }}
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
