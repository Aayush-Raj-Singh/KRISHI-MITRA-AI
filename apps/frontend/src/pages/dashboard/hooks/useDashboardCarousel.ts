import { useEffect, useRef, useState } from "react";

interface UseDashboardCarouselOptions {
  slideCount: number;
  visibleSlideCount: number;
  autoplayMs: number;
}

const useDashboardCarousel = ({
  slideCount,
  visibleSlideCount,
  autoplayMs,
}: UseDashboardCarouselOptions) => {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const maxSlideIndex = Math.max(slideCount - visibleSlideCount, 0);

  const scrollToSlide = (index: number) => {
    const carousel = carouselRef.current;
    if (!carousel) {
      setActiveSlideIndex(index);
      return;
    }
    const clampedIndex = Math.max(0, Math.min(index, maxSlideIndex));
    const cardWidth = carousel.clientWidth / visibleSlideCount;
    carousel.scrollTo({
      left: clampedIndex * cardWidth,
      behavior: "smooth",
    });
    setActiveSlideIndex(clampedIndex);
  };

  const showPrevSlide = () => {
    const nextIndex = activeSlideIndex <= 0 ? maxSlideIndex : activeSlideIndex - 1;
    scrollToSlide(nextIndex);
  };

  const showNextSlide = () => {
    const nextIndex = activeSlideIndex >= maxSlideIndex ? 0 : activeSlideIndex + 1;
    scrollToSlide(nextIndex);
  };

  const handleCarouselScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cardWidth = carousel.clientWidth / visibleSlideCount;
    if (cardWidth <= 0) return;
    const index = Math.round(carousel.scrollLeft / cardWidth);
    const clampedIndex = Math.max(0, Math.min(index, maxSlideIndex));
    if (clampedIndex !== activeSlideIndex) {
      setActiveSlideIndex(clampedIndex);
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const clamped = Math.max(0, Math.min(activeSlideIndex, maxSlideIndex));
    const cardWidth = carousel.clientWidth / visibleSlideCount;
    carousel.scrollTo({ left: clamped * cardWidth });
    if (clamped !== activeSlideIndex) {
      setActiveSlideIndex(clamped);
    }
  }, [maxSlideIndex, visibleSlideCount, activeSlideIndex]);

  useEffect(() => {
    if (maxSlideIndex === 0) return;
    const timer = window.setInterval(() => {
      setActiveSlideIndex((prev) => {
        const next = prev >= maxSlideIndex ? 0 : prev + 1;
        const carousel = carouselRef.current;
        if (carousel) {
          const cardWidth = carousel.clientWidth / visibleSlideCount;
          carousel.scrollTo({ left: next * cardWidth, behavior: "smooth" });
        }
        return next;
      });
    }, autoplayMs);
    return () => window.clearInterval(timer);
  }, [maxSlideIndex, visibleSlideCount, autoplayMs]);

  return {
    carouselRef,
    handleCarouselScroll,
    showPrevSlide,
    showNextSlide,
  };
};

export default useDashboardCarousel;
