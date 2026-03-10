import React from "react";
import { Box, ButtonBase, Grid, Paper, Stack, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { IMPORTANT_LINKS, spacingScale } from "../constants";

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface ImportantLinksSectionProps {
  t: Translate;
}

const ImportantLinksSection: React.FC<ImportantLinksSectionProps> = ({ t }) => (
  <Paper
    sx={{
      p: { xs: spacingScale.sm, md: spacingScale.md },
      border: "1px solid #e7ddcc",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(243, 237, 224, 0.96) 100%)"
    }}
  >
    <Grid container spacing={spacingScale.md} alignItems="center">
      <Grid item xs={12} md={5}>
        <Stack spacing={1.2}>
          <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 0.6, fontWeight: 700 }}>
            {t("layout.govt_caption")}
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: '"Prata", serif' }}>
            {t("dashboard_page.links.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("dashboard_page.services.subtitle")}
          </Typography>
        </Stack>
      </Grid>
      <Grid item xs={12} md={7}>
        <Grid container spacing={2}>
          {IMPORTANT_LINKS.map((link) => (
            <Grid item xs={12} sm={6} key={link.key}>
              <ButtonBase
                component="a"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  width: "100%",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  borderRadius: 2,
                  border: "1px solid rgba(231, 221, 204, 0.9)",
                  bgcolor: "rgba(255, 255, 255, 0.92)",
                  px: 2,
                  py: 1.5,
                  gap: 1.5,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 10px 22px rgba(20, 20, 20, 0.12)"
                  }
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: "rgba(27, 107, 58, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {t(link.key)}
                </Typography>
              </ButtonBase>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  </Paper>
);

export default ImportantLinksSection;
