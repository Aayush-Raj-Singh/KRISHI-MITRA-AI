import React from "react";
import { Card, CardContent, Chip, Paper, Stack, Typography } from "@mui/material";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface RealtimeEventItem {
  id: string;
  summary: string;
  time: string;
  severity?: "info" | "success" | "warning";
}

interface RealtimeUpdatesSectionProps {
  t: Translate;
  wsStatus: string;
  events: RealtimeEventItem[];
}

const RealtimeUpdatesSection: React.FC<RealtimeUpdatesSectionProps> = ({ t, wsStatus, events }) => {
  if (events.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">{t("dashboard_page.live_updates")}</Typography>
          <Chip
            label={t(`dashboard_page.ws_status.${wsStatus}`, { defaultValue: wsStatus })}
            color={wsStatus === "open" ? "success" : "default"}
            size="small"
          />
        </Stack>
        <Stack spacing={1.2} sx={{ mt: 2 }}>
          {events.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: 1.25,
                borderColor: "rgba(27, 107, 58, 0.2)",
                bgcolor: "rgba(255,255,255,0.9)"
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                <Typography variant="body2">{item.summary}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(item.time).toLocaleString()}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default RealtimeUpdatesSection;
