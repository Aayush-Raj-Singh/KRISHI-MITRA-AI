import React from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import api, { ApiResponse, unwrap } from "../services/api";

const fetchAuditLogs = async () => {
  const response = await api.get<ApiResponse<unknown[]>>("/audit", { params: { limit: 200 } });
  return unwrap(response.data);
};

const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
  });

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Typography variant="h4">
          {t("audit_logs_page.title", { defaultValue: "Audit Logs" })}
        </Typography>
        {isLoading && (
          <Typography>
            {t("audit_logs_page.loading", { defaultValue: "Loading audit logs..." })}
          </Typography>
        )}
        {error && <Typography color="error">{t("common.request_failed")}</Typography>}
        <Stack spacing={2}>
          {(data || []).map((log: any) => (
            <Card key={log._id} sx={{ border: "1px solid #ece0cf" }}>
              <CardContent>
                <Typography variant="subtitle2">
                  {log.action} - {log.entity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("audit_logs_page.actor_label", { defaultValue: "Actor" })}: {log.actor_id} (
                  {log.actor_role}) - {new Date(log.ts).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </AppLayout>
  );
};

export default AuditLogsPage;
