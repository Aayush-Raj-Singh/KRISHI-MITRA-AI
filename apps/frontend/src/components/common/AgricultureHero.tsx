import React from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type AgricultureHeroProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badges?: string[];
  imageSrc?: string;
  logoSrc?: string;
  logoAlt?: string;
};

const AgricultureHero: React.FC<AgricultureHeroProps> = ({
  icon,
  title,
  subtitle,
  badges = [],
  imageSrc = "/assets/agri-slider/slide-06.jpg",
  logoSrc,
  logoAlt = "KrishiMitra-AI logo"
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 2.75, md: 3.5 },
        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e7ddcc",
        borderRadius: 3,
        background: isDark
          ? "linear-gradient(135deg, rgba(16, 40, 28, 0.98) 0%, rgba(12, 32, 22, 0.96) 55%, rgba(14, 36, 26, 0.94) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,239,226,0.96) 55%, rgba(232, 244, 236, 0.94) 100%)",
        boxShadow: isDark ? "0 18px 38px rgba(0,0,0,0.35)" : "0 18px 38px rgba(18, 44, 25, 0.12)"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: { xs: -120, md: -80 },
          top: { xs: -120, md: -90 },
          width: { xs: 240, md: 280 },
          height: { xs: 240, md: 280 },
          borderRadius: "50%",
          background: isDark
            ? `radial-gradient(circle, ${alpha(theme.palette.success.light, 0.18)} 0%, ${alpha(
                theme.palette.success.light,
                0.04
              )} 70%, rgba(31, 125, 67, 0) 100%)`
            : "radial-gradient(circle, rgba(31, 125, 67, 0.18) 0%, rgba(31, 125, 67, 0.02) 70%, rgba(31, 125, 67, 0) 100%)"
        }}
      />
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "center" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
            {logoSrc && (
              <Box
                component="img"
                src={logoSrc}
                alt={logoAlt}
                sx={{
                  height: { xs: 32, sm: 36, md: 40 },
                  width: "auto",
                  objectFit: "contain",
                  borderRadius: "50%",
                  mr: 1.25
                }}
              />
            )}
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                bgcolor: isDark ? alpha(theme.palette.success.light, 0.2) : "rgba(27, 107, 58, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {icon}
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: 'var(--app-heading-font), var(--app-body-font), serif',
                fontWeight: 600,
                letterSpacing: 0.2,
                fontSize: { xs: "1.7rem", md: "2.05rem" }
              }}
            >
              {title}
            </Typography>
          </Stack>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 560, fontSize: { xs: "1rem", md: "1.05rem" } }}
          >
            {subtitle}
          </Typography>
          {badges.length > 0 && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.75 }}>
              {badges.map((badge) => (
                <Chip
                  key={badge}
                  size="small"
                  variant="outlined"
                  label={badge}
                  sx={{
                    borderRadius: 999,
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.8)",
                    borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(27, 107, 58, 0.2)",
                    fontWeight: 600
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
        <Box
          sx={{
            width: { xs: "100%", md: 240 },
            height: { xs: 150, md: 160 },
            borderRadius: 2.5,
            border: isDark ? "1px solid rgba(255,255,255,0.16)" : "1px solid #ddceb6",
            overflow: "hidden",
            display: { xs: "none", sm: "block" }
          }}
        >
          <Box
            component="img"
            src={imageSrc}
            alt="Agriculture"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "saturate(1.05)"
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

export default AgricultureHero;
