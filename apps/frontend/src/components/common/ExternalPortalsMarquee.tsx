import React from "react";
import { Box, ButtonBase, Tooltip, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import type { PortalBadge } from "./layoutPortalData";

interface ExternalPortalsMarqueeProps {
  externalPortals: PortalBadge[];
  slidingExternalPortals: PortalBadge[];
  horizontalSectionPaddingSx: SxProps<Theme>;
  contentShellSx: SxProps<Theme>;
  onExternalLink?: (url: string) => void;
}

const ExternalPortalsMarquee: React.FC<ExternalPortalsMarqueeProps> = ({
  externalPortals,
  slidingExternalPortals,
  horizontalSectionPaddingSx,
  contentShellSx,
  onExternalLink,
}) => {
  const marqueeItems =
    slidingExternalPortals.length > externalPortals.length
      ? slidingExternalPortals
      : externalPortals;
  const shouldAnimate = marqueeItems.length > externalPortals.length;
  const marqueeDuration = `${Math.max(34, externalPortals.length * 4)}s`;

  return (
    <Box
      sx={{
        ...horizontalSectionPaddingSx,
        py: { xs: 2.5, md: 3.5 },
        borderTop: "1px solid #b9d8b5",
        borderBottom: "1px solid #b9d8b5",
        bgcolor: "#d9efd4",
      }}
    >
      <Box sx={contentShellSx}>
        <Box
          className="render-smooth-section external-links-marquee"
          sx={{
            overflow: "hidden",
            py: 1,
          }}
        >
          <Box
            className="external-links-track"
            sx={{
              "--external-gap": { xs: "14px", sm: "18px", md: "24px" },
              "--external-duration": marqueeDuration,
              display: "flex",
              gap: "var(--external-gap)",
              width: "max-content",
              pr: 0.5,
              animation: shouldAnimate
                ? "externalLinksMarquee var(--external-duration) linear infinite"
                : "none",
            }}
          >
            {marqueeItems.map((portal, index) => {
              const isDuplicate = shouldAnimate && index >= externalPortals.length;
              const previewImage = portal.imageSrc || portal.logoSrc;

              return (
                <Tooltip
                  key={`${portal.url}-${index}`}
                  title={portal.caption ? `${portal.name}: ${portal.caption}` : portal.name}
                  placement="top"
                >
                  <ButtonBase
                    className="external-link-card"
                    data-duplicate={isDuplicate ? "true" : "false"}
                    component={onExternalLink ? "button" : "a"}
                    href={onExternalLink ? undefined : portal.url}
                    target={onExternalLink ? undefined : "_blank"}
                    rel={onExternalLink ? undefined : "noopener noreferrer"}
                    onClick={onExternalLink ? () => onExternalLink(portal.url) : undefined}
                    sx={{
                      minWidth: { xs: 196, sm: 220, md: 244 },
                      height: { xs: 112, sm: 122, md: 132 },
                      borderRadius: 2.25,
                      bgcolor: "rgba(255,255,255,0.88)",
                      border: "1px solid rgba(70, 106, 62, 0.12)",
                      boxShadow: "0 14px 24px rgba(31, 69, 37, 0.10)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      justifyContent: "flex-start",
                      overflow: "hidden",
                      position: "relative",
                      scrollSnapAlign: "start",
                      textAlign: "left",
                      transition: "transform 180ms ease, box-shadow 180ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 18px 30px rgba(31, 69, 37, 0.14)",
                      },
                    }}
                    aria-label={`Open ${portal.name}`}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        height: { xs: 62, sm: 70, md: 76 },
                        overflow: "hidden",
                        borderBottom: "1px solid rgba(70, 106, 62, 0.08)",
                      }}
                    >
                      {previewImage && (
                        <Box
                          component="img"
                          src={previewImage}
                          alt={portal.name}
                          loading="lazy"
                          decoding="async"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(90deg, rgba(247,250,243,0.16), rgba(247,250,243,0.02) 38%, rgba(20,52,30,0.28))",
                        }}
                      />
                      {portal.logoSrc && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: "rgba(255,255,255,0.92)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 18px rgba(16, 34, 22, 0.16)",
                            p: 0.8,
                          }}
                        >
                          <Box
                            component="img"
                            src={portal.logoSrc}
                            alt={portal.name}
                            loading="lazy"
                            decoding="async"
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ px: 1.35, py: 1.1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 800,
                          color: "#1d4027",
                          lineHeight: 1.1,
                        }}
                      >
                        {portal.name}
                      </Typography>
                      {portal.caption && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.35,
                            color: "rgba(29, 64, 39, 0.72)",
                            fontWeight: 700,
                          }}
                        >
                          {portal.caption}
                        </Typography>
                      )}
                    </Box>
                  </ButtonBase>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ExternalPortalsMarquee;
