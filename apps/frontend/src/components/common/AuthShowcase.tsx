import React, { useEffect, useMemo, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

type ShowcasePoint = {
  icon: React.ReactNode;
  text: string;
};

type AuthShowcaseProps = {
  title: string;
  subtitle: string;
  points: ShowcasePoint[];
};

const showcaseSlides = [
  "/assets/agri-slider/slide-01.png",
  "/assets/agri-slider/slide-02.png",
  "/assets/agri-slider/slide-03.png",
  "/assets/agri-slider/slide-04.png",
  "/assets/agri-slider/slide-05.jpg",
  "/assets/agri-slider/slide-06.jpg",
  "/assets/agri-slider/slide-07.jpg",
  "/assets/agri-slider/slide-08.jpg",
  "/assets/agri-slider/slide-09.jpg",
  "/assets/agri-slider/slide-10.jpg",
];

const AuthShowcase: React.FC<AuthShowcaseProps> = ({ title, subtitle, points }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const duplicatedPoints = useMemo(() => points.slice(0, 4), [points]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % showcaseSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: "1px solid #e6dcc9",
        bgcolor: "rgba(255,255,255,0.9)",
        height: "100%",
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            position: "relative",
            height: { xs: 200, md: 280 },
            borderRadius: 2.2,
            overflow: "hidden",
          }}
        >
          {showcaseSlides.map((src, idx) => (
            <Box
              key={src}
              component="img"
              src={src}
              alt="Agriculture showcase"
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: idx === activeSlide ? 1 : 0,
                transition: "opacity 700ms ease",
              }}
            />
          ))}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(140deg, rgba(10,38,21,0.3) 0%, rgba(10,38,21,0.16) 35%, rgba(10,38,21,0.05) 100%)",
            }}
          />
          <Stack
            direction="row"
            spacing={0.8}
            sx={{
              position: "absolute",
              left: "50%",
              bottom: 10,
              transform: "translateX(-50%)",
              bgcolor: "rgba(0,0,0,0.22)",
              borderRadius: 999,
              px: 1,
              py: 0.5,
            }}
          >
            {showcaseSlides.map((src, idx) => (
              <Box
                key={`${src}-${idx}`}
                onClick={() => setActiveSlide(idx)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  cursor: "pointer",
                  bgcolor: idx === activeSlide ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="h4">{title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>

        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px dashed #d7c7ad",
            bgcolor: "rgba(255,255,255,0.85)",
          }}
        >
          <Stack spacing={1.25}>
            {duplicatedPoints.map((point) => (
              <Stack key={point.text} direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    bgcolor: "rgba(27,107,58,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {point.icon}
                </Box>
                <Typography variant="body2">{point.text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
};

export default AuthShowcase;
