import React from "react";
import { Box, IconButton, Paper } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface HeroCarouselSectionProps {
  slides: Array<{ src: string; alt: string }>;
  visibleSlideCount: number;
  carouselRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const HeroCarouselSection: React.FC<HeroCarouselSectionProps> = ({
  slides,
  visibleSlideCount,
  carouselRef,
  onScroll,
  onPrev,
  onNext
}) => (
  <Paper
    className="dashboard-hero-carousel"
    sx={{
      position: "relative",
      width: "100%",
      height: "auto",
      aspectRatio: { xs: "16 / 9", md: "3 / 1" },
      overflow: "hidden",
      border: "1px solid #cfe3cb",
      borderRadius: 2,
      breakInside: "avoid",
      pageBreakInside: "avoid"
    }}
  >
    <Box
      className="dashboard-carousel-track"
      ref={carouselRef}
      onScroll={() => onScroll()}
      sx={{
        display: "flex",
        width: "100%",
        height: "100%",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" }
      }}
    >
      {slides.map((slide, index) => (
        <Box
          key={slide.src}
          sx={{
            position: "relative",
            flex: `0 0 calc(100% / ${visibleSlideCount})`,
            height: "100%",
            scrollSnapAlign: "start",
            borderRight: "none"
          }}
        >
          <Box
            component="img"
            src={slide.src}
            alt={slide.alt}
            loading={index < 8 ? "eager" : "lazy"}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0) 100%)"
            }}
          />
        </Box>
      ))}
    </Box>

    <IconButton
      className="print-hide"
      onClick={onPrev}
      sx={{
        position: "absolute",
        left: { xs: 8, md: 14 },
        top: "50%",
        transform: "translateY(-50%)",
        bgcolor: "rgba(0,0,0,0.26)",
        color: "#fff",
        zIndex: 2,
        "&:hover": { bgcolor: "rgba(0,0,0,0.4)" }
      }}
    >
      <ChevronLeftIcon />
    </IconButton>
    <IconButton
      className="print-hide"
      onClick={onNext}
      sx={{
        position: "absolute",
        right: { xs: 8, md: 14 },
        top: "50%",
        transform: "translateY(-50%)",
        bgcolor: "rgba(0,0,0,0.26)",
        color: "#fff",
        zIndex: 2,
        "&:hover": { bgcolor: "rgba(0,0,0,0.4)" }
      }}
    >
      <ChevronRightIcon />
    </IconButton>
  </Paper>
);

export default HeroCarouselSection;
