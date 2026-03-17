import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";

const ForbiddenPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 640, mx: "auto", py: 6 }}>
        <Stack spacing={2} alignItems="center">
          <BlockIcon color="warning" sx={{ fontSize: 56 }} />
          <Typography variant="h4">
            {t("forbidden_page.title", { defaultValue: "Access restricted" })}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            {t("forbidden_page.description", {
              defaultValue: "Your account does not have permission to view this page."
            })}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/dashboard")}>
            {t("forbidden_page.back_to_dashboard", { defaultValue: "Go back to dashboard" })}
          </Button>
        </Stack>
      </Box>
    </AppLayout>
  );
};

export default ForbiddenPage;
