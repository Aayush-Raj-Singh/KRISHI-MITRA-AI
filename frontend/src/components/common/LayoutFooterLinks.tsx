import React from "react";
import { Box, ButtonBase, Divider, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface FooterLink {
  label: string;
  path: string;
}

interface LayoutFooterLinksProps {
  appTitle: string;
  dbtPortalLabel: string;
  otherLinksLabel: string;
  helpdeskLabel: string;
  helplineLabel: string;
  footerFeatureColumns: FooterLink[][];
  onNavigate: (path: string) => void;
  horizontalSectionPaddingSx: SxProps<Theme>;
  contentShellSx: SxProps<Theme>;
}

const LayoutFooterLinks: React.FC<LayoutFooterLinksProps> = ({
  appTitle,
  dbtPortalLabel,
  otherLinksLabel,
  helpdeskLabel,
  helplineLabel,
  footerFeatureColumns,
  onNavigate,
  horizontalSectionPaddingSx,
  contentShellSx
}) => (
  <Box
    component="footer"
    sx={{
      bgcolor: "#165a2f",
      background: "linear-gradient(90deg, #134b28 0%, #1c6b38 55%, #15532b 100%)",
      color: "#fff",
      ...horizontalSectionPaddingSx,
      py: { xs: 2.2, md: 2.8 }
    }}
  >
    <Box sx={contentShellSx}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {otherLinksLabel}
      </Typography>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.28)", mb: 2 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: { xs: 0.75, md: 1.1 },
          mb: 2.2
        }}
      >
        {footerFeatureColumns.map((column, columnIndex) => (
          <Stack key={`footer-column-${columnIndex}`} spacing={0.65}>
            {column.map((link) => (
              <ButtonBase
                key={link.path}
                onClick={() => onNavigate(link.path)}
                sx={{
                  justifyContent: "flex-start",
                  color: "rgba(255,255,255,0.94)",
                  fontSize: "1.13rem",
                  py: 0.15
                }}
              >
                {link.label}
              </ButtonBase>
            ))}
          </Stack>
        ))}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", mb: 1.5 }} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
        <Box>
          <Typography variant="subtitle1">{appTitle}</Typography>
          <Typography variant="body2">{dbtPortalLabel}</Typography>
        </Box>
        <Stack spacing={0.35}>
          <Typography variant="body2">{helpdeskLabel}: support@krishimitra.ai</Typography>
          <Typography variant="body2">{helplineLabel}: 1800-123-123</Typography>
        </Stack>
      </Stack>
    </Box>
  </Box>
);

export default LayoutFooterLinks;
