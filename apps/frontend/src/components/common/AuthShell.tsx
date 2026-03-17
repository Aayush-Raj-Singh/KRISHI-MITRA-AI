import React from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const headerBadges = [
  {
    name: "Azadi Ka Amrit Mahotsav",
    url: "https://amritmahotsav.nic.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/azadi-ka-amrit-mahotsav.png"
  },
  {
    name: "G20 India",
    url: "https://www.g20.org/en/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/g20.png"
  },
  {
    name: "Digital India",
    url: "https://www.digitalindia.gov.in/",
    logoSrc: "https://www.nfsm.gov.in/assets/img/clients/degitalindia.png"
  }
];
const authMaxWidth = 1320;
const authShellContainerSx = {
  width: "100%",
  maxWidth: authMaxWidth,
  mx: "auto"
} as const;
const authHorizontalPaddingSx = {
  px: { xs: 2, md: 4 }
} as const;

type AuthShellProps = {
  children: React.ReactNode;
};

const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#e7f3e4",
        backgroundImage:
          "linear-gradient(rgba(221, 241, 216, 0.97), rgba(230, 245, 224, 0.97)), url('/assets/backgrounds/OIP.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat"
      }}
    >
      <Box
        component="header"
        sx={{
          bgcolor: "#1a6a34",
          color: "#fff",
          ...authHorizontalPaddingSx,
          py: 1.5,
          borderBottom: "1px solid #175b2d"
        }}
      >
        <Box sx={authShellContainerSx}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ButtonBase onClick={() => navigate("/")} aria-label="Go to dashboard">
                <Box
                  component="img"
                  src="/assets/logo/krishimitra-ai-icon-transparent.png"
                  alt="KrishiMitra-AI logo"
                  sx={{
                    height: { xs: 36, sm: 40, md: 44 },
                    width: "auto",
                    objectFit: "contain",
                    mr: 1.25,
                    borderRadius: "50%"
                  }}
                />
              </ButtonBase>
              <Box>
                <Typography variant="h6" sx={{ color: "#fff", lineHeight: 1.2 }}>
                  {t("app.title")}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                  {t("layout.dbt_portal")}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
              {headerBadges.map((badge) => (
                <ButtonBase
                  key={badge.name}
                  component="a"
                  href={badge.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.95)",
                    borderRadius: 999,
                    px: 1.2,
                    py: 0.6,
                    border: "1px solid rgba(255,255,255,0.2)"
                  }}
                >
                  <Box component="img" src={badge.logoSrc} alt={badge.name} sx={{ height: 30, width: "auto" }} />
                </ButtonBase>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Box component="main" sx={{ ...authHorizontalPaddingSx, py: { xs: 2.5, md: 3.5 } }}>
        <Box sx={authShellContainerSx}>{children}</Box>
      </Box>

      <Box
        component="footer"
        sx={{
          bgcolor: "#0f4a2c",
          color: "#fff",
          ...authHorizontalPaddingSx,
          py: 1.5,
          borderTop: "1px solid rgba(255,255,255,0.15)"
        }}
      >
        <Box sx={authShellContainerSx}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
            <Typography variant="body2">{t("layout.dbt_portal")}</Typography>
            <Typography variant="body2">
              {t("layout.helpline")}: 1800-000-000
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthShell;
