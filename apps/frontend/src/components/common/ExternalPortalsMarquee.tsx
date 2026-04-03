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
              let fallbackLogoSrc: string | undefined;
              try {
                fallbackLogoSrc = `${new URL(portal.url).origin}/favicon.ico`;
              } catch {
                fallbackLogoSrc = undefined;
              }
              const logoSrc = portal.logoSrc || fallbackLogoSrc;

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
                      minWidth: { xs: 168, sm: 184, md: 208 },
                      height: { xs: 74, sm: 82, md: 90 },
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.96)",
                      border: "1px solid rgba(70, 106, 62, 0.12)",
                      boxShadow: "0 10px 20px rgba(31, 69, 37, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                      scrollSnapAlign: "start",
                      textAlign: "center",
                      transition: "transform 180ms ease, box-shadow 180ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 14px 28px rgba(31, 69, 37, 0.12)",
                      },
                    }}
                    aria-label={`Open ${portal.name}`}
                  >
                    {logoSrc ? (
                      <Box
                        component="img"
                        src={logoSrc}
                        alt={portal.name}
                        loading="lazy"
                        decoding="async"
                        sx={{
                          width: "min(84%, 180px)",
                          height: "min(54%, 46px)",
                          objectFit: "contain",
                          display: "block",
                        }}
                        onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                          event.currentTarget.style.display = "none";
                          const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) {
                            fallback.style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    <Typography
                      variant="subtitle1"
                      sx={{
                        display: logoSrc ? "none" : "block",
                        px: 1.5,
                        fontWeight: 800,
                        color: "#1d4027",
                        letterSpacing: 0.2,
                        lineHeight: 1.05,
                      }}
                    >
                      {portal.name}
                    </Typography>
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
