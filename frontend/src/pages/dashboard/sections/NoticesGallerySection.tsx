import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
import CampaignIcon from "@mui/icons-material/Campaign";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import PushPinIcon from "@mui/icons-material/PushPin";

import { DASHBOARD_GALLERY_IMAGES, GALLERY_PAGE_SIZE } from "../constants";

type Translate = (key: string, options?: Record<string, unknown>) => string;
type GalleryPaginationProps = {
  size?: "small" | "medium" | "large";
  page: number;
  count: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  color?: "primary" | "secondary" | "standard";
  shape?: "circular" | "rounded";
};

interface NoticesGallerySectionProps {
  t: Translate;
}
const GalleryPagination = Pagination as unknown as React.ComponentType<GalleryPaginationProps>;

const NoticesGallerySection: React.FC<NoticesGallerySectionProps> = ({ t }) => {
  const notices = [
    {
      title: t("dashboard_page.notices.item_1_title"),
      date: t("dashboard_page.notices.item_1_date")
    },
    {
      title: t("dashboard_page.notices.item_2_title"),
      date: t("dashboard_page.notices.item_2_date")
    },
    {
      title: t("dashboard_page.notices.item_3_title"),
      date: t("dashboard_page.notices.item_3_date")
    },
    {
      title: t("dashboard_page.notices.item_4_title"),
      date: t("dashboard_page.notices.item_4_date")
    }
  ];
  const scrollingNotices = [...notices, ...notices];

  const [galleryPage, setGalleryPage] = useState(1);
  const uniqueGalleryImages = useMemo(
    () => DASHBOARD_GALLERY_IMAGES.filter((image, index, all) => all.findIndex((item) => item.src === image.src) === index),
    []
  );
  const galleryPageCount = useMemo(
    () => Math.ceil(uniqueGalleryImages.length / GALLERY_PAGE_SIZE),
    [uniqueGalleryImages]
  );
  const pagedGalleryImages = useMemo(() => {
    const start = (galleryPage - 1) * GALLERY_PAGE_SIZE;
    return uniqueGalleryImages.slice(start, start + GALLERY_PAGE_SIZE);
  }, [galleryPage, uniqueGalleryImages]);

  return (
    <Grid container spacing={3} id="notices">
      <Grid item xs={12} md={6}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: 3,
            bgcolor: "#7d5231",
            boxShadow: "0 10px 20px rgba(66,45,24,0.28)"
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: "1px solid rgba(113,74,35,0.5)",
              background:
                "radial-gradient(circle at 20% 15%, rgba(255, 249, 223, 0.95), rgba(223, 194, 143, 0.96))"
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <CampaignIcon color="secondary" />
                <Typography variant="h6">{t("dashboard_page.notices.title")}</Typography>
              </Stack>
            </Stack>

            <Box
              className="notice-board-window"
              sx={{
                position: "relative",
                height: { xs: 180, md: 188 },
                overflow: "hidden",
                borderRadius: 2,
                "&:hover .notice-scroll-track": { animationPlayState: "paused" }
              }}
            >
              <Stack
                className="notice-scroll-track"
                spacing={1.1}
                sx={{
                  animation: "noticeBoardScroll 16s linear infinite",
                  "@keyframes noticeBoardScroll": {
                    "0%": { transform: "translateY(0)" },
                    "100%": { transform: "translateY(-50%)" }
                  },
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" }
                }}
              >
                {scrollingNotices.map((notice, index) => (
                  <Paper
                    key={`${notice.title}-${index}`}
                    className="notice-item"
                    data-duplicate={index >= notices.length ? "true" : "false"}
                    sx={{
                      position: "relative",
                      p: 1.1,
                      minHeight: 74,
                      border: "1px solid #d5c184",
                      bgcolor: index % 2 === 0 ? "#fff9cf" : "#ffefd6",
                      transform: index % 2 === 0 ? "rotate(-0.5deg)" : "rotate(0.5deg)",
                      boxShadow: "0 6px 14px rgba(104,74,20,0.2)"
                    }}
                  >
                    <PushPinIcon
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        color: "#9a2d22",
                        fontSize: 18
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ pr: 2, lineHeight: 1.25 }}>
                      {notice.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {notice.date}
                    </Typography>
                  </Paper>
                ))}
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
            background: "linear-gradient(180deg, #fffdf8 0%, #f8f0e4 100%)"
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
                <Typography variant="h6">Photo Gallery</Typography>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 2 }} />

            <Grid className="gallery-screen-grid" container spacing={1.2}>
              {pagedGalleryImages.map((image) => (
                <Grid item xs={6} sm={4} key={image.src}>
                  <Paper
                    sx={{
                      borderRadius: 1.5,
                      overflow: "hidden",
                      border: "1px solid #e7ddcc",
                      boxShadow: "0 4px 10px rgba(39, 31, 16, 0.16)",
                      transition: "transform 180ms ease, box-shadow 180ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 18px rgba(39, 31, 16, 0.22)"
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      sx={{
                        width: "100%",
                        height: { xs: 78, sm: 90 },
                        objectFit: "cover",
                        display: "block"
                      }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Stack className="gallery-pagination print-hide" direction="row" justifyContent="center" sx={{ mt: 1.8 }}>
              <GalleryPagination
                size="small"
                page={galleryPage}
                count={galleryPageCount}
                onChange={(_, value) => setGalleryPage(value)}
                color="primary"
                shape="rounded"
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default NoticesGallerySection;
