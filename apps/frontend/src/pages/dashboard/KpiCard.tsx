import React from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { spacingScale } from "./constants";

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        height: "100%",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(231, 221, 204, 0.9)",
        background: isDark ? "rgba(16, 40, 28, 0.92)" : "rgba(255, 255, 255, 0.96)",
        boxShadow: isDark ? "0 12px 26px rgba(0,0,0,0.35)" : "0 12px 26px rgba(20, 20, 20, 0.08)"
      }}
    >
      <CardContent sx={{ p: spacingScale.sm, "&:last-child": { pb: spacingScale.sm } }}>
        <Stack direction="row" spacing={spacingScale.sm} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              bgcolor: isDark ? alpha(theme.palette.success.light, 0.2) : "rgba(27, 107, 58, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isDark
                ? "inset 0 0 0 1px rgba(255,255,255,0.12)"
                : "inset 0 0 0 1px rgba(27, 107, 58, 0.15)"
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.2 }}>
              {label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
