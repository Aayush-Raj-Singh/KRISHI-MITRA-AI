import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import LockIcon from "@mui/icons-material/Lock";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ShieldIcon from "@mui/icons-material/Shield";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { confirmPasswordReset, requestPasswordReset } from "../services/auth";
import AuthShell from "../components/common/AuthShell";
import AuthShowcase from "../components/common/AuthShowcase";

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const requestMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setNotice(t("reset_password.notice_code_sent"));
    },
  });

  const confirmMutation = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => {
      setNotice(t("reset_password.notice_password_updated"));
    },
  });

  return (
    <AuthShell>
      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        <Grid item xs={12} md={6}>
          <AuthShowcase
            title={t("reset_password.title")}
            subtitle={t("reset_password.subtitle")}
            points={[
              {
                icon: <ShieldIcon color="primary" fontSize="small" />,
                text: t("reset_password.point_secure", {
                  defaultValue: "Secure account recovery workflow",
                }),
              },
              {
                icon: <MarkEmailReadIcon color="secondary" fontSize="small" />,
                text: t("reset_password.point_otp", {
                  defaultValue: "OTP verification through SMS or email",
                }),
              },
              {
                icon: <WaterDropIcon color="primary" fontSize="small" />,
                text: t("reset_password.point_agri", {
                  defaultValue: "Continue smart irrigation and crop planning without downtime",
                }),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
          <Card sx={{ maxWidth: 560, width: "100%", mx: "auto" }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h4">{t("reset_password.title")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("reset_password.subtitle")}
                </Typography>
                {notice && <Alert severity="info">{notice}</Alert>}
                {(requestMutation.isError || confirmMutation.isError) && (
                  <Alert severity="error">
                    {requestMutation.error instanceof Error
                      ? requestMutation.error.message
                      : confirmMutation.error instanceof Error
                        ? confirmMutation.error.message
                        : t("common.request_failed")}
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      label={t("auth.phone")}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIphoneIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      label={t("reset_password.channel")}
                      value={channel}
                      onChange={(event) => setChannel(event.target.value as "sms" | "email")}
                      select
                      fullWidth
                    >
                      <MenuItem value="sms">{t("reset_password.channel_sms")}</MenuItem>
                      <MenuItem value="email">{t("reset_password.channel_email")}</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                <Button
                  variant="outlined"
                  onClick={() => requestMutation.mutate({ phone, channel })}
                  disabled={requestMutation.isPending || !phone}
                >
                  {requestMutation.isPending
                    ? t("reset_password.sending")
                    : t("reset_password.send_code")}
                </Button>
                <Divider />
                <TextField
                  label={t("reset_password.reset_code")}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MarkEmailReadIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label={t("reset_password.new_password")}
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => confirmMutation.mutate({ phone, otp, new_password: newPassword })}
                  disabled={confirmMutation.isPending || !phone || !otp || !newPassword}
                >
                  {confirmMutation.isPending
                    ? t("reset_password.updating")
                    : t("reset_password.update_password")}
                </Button>
                <Typography variant="body2">
                  <Link to="/login">{t("reset_password.back_to_login")}</Link>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AuthShell>
  );
};

export default ResetPasswordPage;
