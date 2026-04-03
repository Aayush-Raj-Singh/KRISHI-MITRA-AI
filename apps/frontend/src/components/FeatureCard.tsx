import React from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTheme as useMuiTheme } from "@mui/material/styles";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(27, 107, 58, 0.18)",
        background: isDark
          ? "linear-gradient(140deg, rgba(20, 63, 43, 0.96) 0%, rgba(17, 52, 36, 0.96) 100%)"
          : "linear-gradient(140deg, rgba(236, 248, 239, 0.98) 0%, rgba(216, 240, 225, 0.98) 100%)",
        boxShadow: isDark ? "0 16px 28px rgba(0,0,0,0.4)" : "0 18px 28px rgba(16, 66, 35, 0.12)",
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: isDark ? "rgba(95, 209, 139, 0.2)" : "rgba(27, 107, 58, 0.14)",
              color: isDark ? "#7ee4a3" : "#1b6b3a",
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
