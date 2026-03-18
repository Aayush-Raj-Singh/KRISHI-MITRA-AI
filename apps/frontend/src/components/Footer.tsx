import React, { useMemo } from "react";
import { Box, Container, Grid, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useTranslatedStrings } from "../utils/useTranslatedStrings";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const footerCopy = useTranslatedStrings(
    useMemo(
      () => ({
        navigation: "Navigation",
        about: "About",
        faq: "FAQ",
        contact: "Contact",
        support: "Support",
        helpdeskContact: "Helpdesk: support@krishimitra.ai",
        helplineContact: "Helpline: 1800-123-123"
      }),
      []
    )
  );

  return (
    <Box component="footer" sx={{ bgcolor: "#0f2d1e", color: "#ffffff", py: { xs: 4, md: 5 } }}>
      <Container
        maxWidth={false}
        sx={{
          width: "min(100%, var(--app-shell-width))",
          maxWidth: "var(--app-shell-width)",
          px: "var(--app-shell-inline-pad) !important"
        }}
      >
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("app.title")}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {t("layout.dbt_portal")}
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {footerCopy.navigation}
            </Typography>
            <Stack spacing={0.6}>
              <Link component="a" href="#features" color="inherit" underline="hover">
                {footerCopy.about}
              </Link>
              <Link component={RouterLink} to="/services" color="inherit" underline="hover">
                {t("layout.services")}
              </Link>
              <Link component={RouterLink} to="/advisory" color="inherit" underline="hover">
                {t("nav.advisory")}
              </Link>
              <Link component="a" href="#features" color="inherit" underline="hover">
                {footerCopy.faq}
              </Link>
              <Link component="a" href="#footer" color="inherit" underline="hover">
                {footerCopy.contact}
              </Link>
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {footerCopy.support}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {footerCopy.helpdeskContact}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {footerCopy.helplineContact}
            </Typography>
          </Stack>
        </Grid>
      </Grid>
      </Container>
    </Box>
  );
};

export default Footer;
