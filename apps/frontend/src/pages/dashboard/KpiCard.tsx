import React from "react";
import { Box, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { spacingScale } from "./constants";

interface KpiCardProps {
  label: string;
  value: string;
  caption?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, caption, icon, loading = false }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        height: "100%",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(231, 221, 204, 0.9)",
        background: isDark
          ? "linear-gradient(180deg, rgba(16, 40, 28, 0.96) 0%, rgba(11, 31, 21, 0.94) 100%)"
          : "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 249, 0.98) 100%)",
        boxShadow: isDark ? "0 12px 26px rgba(0,0,0,0.35)" : "0 12px 26px rgba(20, 20, 20, 0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: 4,
          background: isDark
            ? "linear-gradient(90deg, rgba(95, 209, 139, 0.25), rgba(95, 209, 139, 0.7), rgba(95, 209, 139, 0.18))"
            : "linear-gradient(90deg, rgba(27, 107, 58, 0.18), rgba(27, 107, 58, 0.72), rgba(27, 107, 58, 0.16))",
        }}
      />
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
                : "inset 0 0 0 1px rgba(27, 107, 58, 0.15)",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, letterSpacing: 0.2 }}
            >
              {label}
            </Typography>
            {loading ? (
              <>
                <Skeleton variant="text" width={110} height={34} />
                <Skeleton variant="text" width={120} height={22} />
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {value}
                </Typography>
                {caption ? (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.4 }}
                  >
                    {caption}
                  </Typography>
                ) : null}
              </>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
