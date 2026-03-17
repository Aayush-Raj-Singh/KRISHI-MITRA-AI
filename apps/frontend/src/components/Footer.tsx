import React from "react";
import { Box, Container, Grid, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const Footer: React.FC = () => (
  <Box component="footer" sx={{ bgcolor: "#0f2d1e", color: "#ffffff", py: { xs: 4, md: 5 } }}>
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              KrishiMitra-AI
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Agriculture Services Portal
            </Typography>
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Navigation
            </Typography>
            <Stack spacing={0.6}>
              <Link component="a" href="#features" color="inherit" underline="hover">
                About
              </Link>
              <Link component={RouterLink} to="/services" color="inherit" underline="hover">
                Services
              </Link>
              <Link component={RouterLink} to="/advisory" color="inherit" underline="hover">
                Advisory
              </Link>
              <Link component="a" href="#features" color="inherit" underline="hover">
                FAQ
              </Link>
              <Link component="a" href="#footer" color="inherit" underline="hover">
                Contact
              </Link>
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Support
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Helpdesk: support@krishimitra.ai
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
              Helpline: 1800-123-123
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  </Box>
);

export default Footer;
