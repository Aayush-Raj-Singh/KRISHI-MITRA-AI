import React, { useMemo } from "react";
import { Box, Card, CardContent, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CampaignIcon from "@mui/icons-material/Campaign";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import PushPinIcon from "@mui/icons-material/PushPin";

import { DASHBOARD_GALLERY_IMAGES } from "../constants";

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface NoticesGallerySectionProps {
  t: Translate;
}

const NoticesGallerySection: React.FC<NoticesGallerySectionProps> = ({ t }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const notices = useMemo(
    () => [
      {
        title: t("dashboard_page.notices.item_1_title"),
        date: t("dashboard_page.notices.item_1_date"),
        tag: t("dashboard_page.notices.priority_subsidy", {
          defaultValue: "Subsidy",
        }),
      },
      {
        title: t("dashboard_page.notices.item_2_title"),
        date: t("dashboard_page.notices.item_2_date"),
        tag: t("dashboard_page.notices.priority_procurement", {
          defaultValue: "Procurement",
        }),
      },
      {
        title: t("dashboard_page.notices.item_3_title"),
        date: t("dashboard_page.notices.item_3_date"),
        tag: t("dashboard_page.notices.priority_water", {
          defaultValue: "Water",
        }),
      },
      {
        title: t("dashboard_page.notices.item_4_title"),
        date: t("dashboard_page.notices.item_4_date"),
        tag: t("dashboard_page.notices.priority_credit", {
          defaultValue: "Support",
        }),
      },
      {
        title: t("dashboard_page.notices.item_5_title", {
          defaultValue:
            "District mandi arrival desks are extending morning intake timing this week.",
        }),
        date: t("dashboard_page.notices.item_5_date", {
          defaultValue: "Updated today",
        }),
        tag: t("dashboard_page.notices.priority_arrivals", {
          defaultValue: "Arrivals",
        }),
      },
      {
        title: t("dashboard_page.notices.item_6_title", {
          defaultValue:
            "Village extension teams are collecting crop health reports for the next advisory bulletin.",
        }),
        date: t("dashboard_page.notices.item_6_date", {
          defaultValue: "Field notice",
        }),
        tag: t("dashboard_page.notices.priority_advisory", {
          defaultValue: "Advisory",
        }),
      },
    ],
    [t],
  );

  const uniqueGalleryImages = useMemo(
    () =>
      DASHBOARD_GALLERY_IMAGES.filter(
        (image, index, all) => all.findIndex((item) => item.src === image.src) === index,
      ),
    [],
  );
  const loopingNotices = useMemo(() => [...notices, ...notices], [notices]);
  const loopingGalleryImages = useMemo(
    () => [...uniqueGalleryImages, ...uniqueGalleryImages],
    [uniqueGalleryImages],
  );
  const noticeDuration = `${Math.max(22, notices.length * 5)}s`;
  const galleryDuration = `${Math.max(28, uniqueGalleryImages.length * 2.4)}s`;

  return (
    <Grid container spacing={3} id="notices">
      <Grid item xs={12} md={6}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: 3,
            bgcolor: isDark ? "#1f3a2c" : "#7d5231",
            boxShadow: isDark ? "0 12px 22px rgba(0,0,0,0.45)" : "0 10px 20px rgba(66,45,24,0.28)",
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(113,74,35,0.5)",
              background: isDark
                ? "radial-gradient(circle at 20% 15%, rgba(34, 62, 46, 0.95), rgba(20, 43, 31, 0.96))"
                : "radial-gradient(circle at 20% 15%, rgba(255, 249, 223, 0.95), rgba(223, 194, 143, 0.96))",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.2 }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <CampaignIcon color="secondary" />
                <Typography variant="h6">{t("dashboard_page.notices.title")}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {t("dashboard_page.notices.auto_lane", {
                  defaultValue: "Auto notice lane",
                })}
              </Typography>
            </Stack>

            <Box
              className="notice-board-window"
              sx={{
                position: "relative",
                height: { xs: 218, md: 232 },
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              <Stack
                className="notice-scroll-track"
                spacing={1.1}
                sx={{
                  "--notice-gap": "10px",
                  animation: `noticeScrollMarquee ${noticeDuration} linear infinite`,
                  pr: 0.5,
                }}
              >
                {loopingNotices.map((notice, index) => {
                  const isDuplicate = index >= notices.length;
                  return (
                    <Paper
                      key={`${notice.title}-${index}`}
                      className="notice-item"
                      data-duplicate={isDuplicate ? "true" : "false"}
                      sx={{
                        position: "relative",
                        p: 1.1,
                        minHeight: 84,
                        border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #d5c184",
                        bgcolor: isDark
                          ? index % 2 === 0
                            ? "rgba(24, 56, 40, 0.92)"
                            : "rgba(20, 48, 35, 0.92)"
                          : index % 2 === 0
                            ? "#fff9cf"
                            : "#ffefd6",
                        boxShadow: isDark
                          ? "0 4px 10px rgba(0,0,0,0.24)"
                          : "0 4px 10px rgba(104,74,20,0.12)",
                      }}
                    >
                      <PushPinIcon
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          color: isDark ? "#f28b82" : "#9a2d22",
                          fontSize: 18,
                        }}
                      />
                      <Typography
                        variant="overline"
                        sx={{
                          fontWeight: 800,
                          color: isDark ? "#cde9d2" : "#84572e",
                        }}
                      >
                        {notice.tag}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ pr: 2, lineHeight: 1.25 }}>
                        {notice.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        {notice.date}
                      </Typography>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card
          id="photo-gallery"
          sx={{
            height: "100%",
            border: "1px solid #e0d0b4",
            background: "linear-gradient(180deg, #fffdf8 0%, #f8f0e4 100%)",
          }}
        >
          <CardContent>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <PhotoLibraryIcon color="primary" />
                <Typography variant="h6">
                  {t("dashboard_page.gallery.title", {
                    defaultValue: "Photo Gallery",
                  })}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {t("dashboard_page.gallery.auto_lane", {
                  defaultValue: "Auto image lane",
                })}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Box
              className="notice-gallery-window"
              sx={{
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              <Box
                className="notice-gallery-track"
                sx={{
                  "--gallery-gap": "14px",
                  display: "flex",
                  gap: "var(--gallery-gap)",
                  width: "max-content",
                  animation: `noticeGalleryMarquee ${galleryDuration} linear infinite`,
                }}
              >
                {loopingGalleryImages.map((image, index) => {
                  const isDuplicate = index >= uniqueGalleryImages.length;
                  return (
                    <Paper
                      key={`${image.src}-${index}`}
                      data-duplicate={isDuplicate ? "true" : "false"}
                      sx={{
                        width: { xs: 188, sm: 204, md: 220 },
                        borderRadius: 1.8,
                        overflow: "hidden",
                        border: "1px solid #e7ddcc",
                        boxShadow: "0 4px 10px rgba(39, 31, 16, 0.16)",
                      }}
                    >
                      <Box
                        component="img"
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        sx={{
                          width: "100%",
                          height: { xs: 116, sm: 126, md: 138 },
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default NoticesGallerySection;
