import React from "react";
import { Box, ButtonBase, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import type { PortalBadge } from "./layoutPortalData";

interface ExternalPortalsMarqueeProps {
  externalPortals: PortalBadge[];
  slidingExternalPortals: PortalBadge[];
  horizontalSectionPaddingSx: SxProps<Theme>;
  contentShellSx: SxProps<Theme>;
}

const ExternalPortalsMarquee: React.FC<ExternalPortalsMarqueeProps> = ({
  externalPortals,
  slidingExternalPortals,
  horizontalSectionPaddingSx,
  contentShellSx
}) => (
  <Box
    sx={{
      ...horizontalSectionPaddingSx,
      py: { xs: 2.5, md: 3.5 },
      borderTop: "1px solid #b9d8b5",
      borderBottom: "1px solid #b9d8b5",
      bgcolor: "#d9efd4"
    }}
  >
    <Box sx={contentShellSx}>
      <Box
        sx={{
          overflow: "hidden",
          py: 1,
          "&:hover .external-links-track": {
            animationPlayState: "paused"
          }
        }}
      >
        <Box
          className="external-links-track"
          sx={{
            display: "flex",
            gap: { xs: 1.5, sm: 2.5, md: 4 },
            width: "max-content",
            animation: "externalLinksSlide 28s linear infinite",
            "@keyframes externalLinksSlide": {
              "0%": { transform: "translateX(0)" },
              "100%": { transform: "translateX(-50%)" }
            },
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none"
            }
          }}
        >
          {slidingExternalPortals.map((portal, index) => (
            <Tooltip key={`${portal.url}-${index}`} title={portal.name} placement="top">
              <ButtonBase
                className="external-link-card"
                data-duplicate={index >= externalPortals.length ? "true" : "false"}
                component="a"
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  minWidth: { xs: 160, sm: 180, md: 210 },
                  height: { xs: 82, sm: 92, md: 100 },
                  borderRadius: 1.5,
                  bgcolor: "rgba(255,255,255,0.85)",
                  border: "1px solid #dedede",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 2
                }}
              >
                <Box
                  component="img"
                  src={portal.logoSrc}
                  alt={portal.name}
                  sx={{
                    width: "100%",
                    maxWidth: 170,
                    maxHeight: 64,
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.12))"
                  }}
                />
              </ButtonBase>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Box>
  </Box>
);

export default ExternalPortalsMarquee;
