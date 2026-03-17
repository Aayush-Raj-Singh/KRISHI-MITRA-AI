import { AGRO_SLIDER_IMAGES } from "../../constants/agriSliderImages";
import type { MandiCatalogResponse } from "../../services/integrations";
import type { WeatherDay } from "../../services/recommendations";

export const toISODate = (date: Date) => date.toISOString().split("T")[0];

export const buildForecast = (days: number): WeatherDay[] => {
  const start = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const day = new Date(start);
    day.setDate(day.getDate() + idx + 1);
    return {
      date: toISODate(day),
      rainfall_mm: 2 + idx * 0.5,
      temperature_c: 28 + idx * 0.4
    };
  });
};

const DASHBOARD_GALLERY_FILES = [
  "agri-001.jpg",
  "agri-002.jpg",
  "agri-004.jpg",
  "agri-006.jpg",
  "agri-007.jpg",
  "agri-008.jpg",
  "agri-009.jpg",
  "agri-010.jpg",
  "agri-011.jpg",
  "agri-012.jpg",
  "agri-013.jpg",
  "agri-014.jpg",
  "agri-015.jpg",
  "agri-016.jpg",
  "agri-017.jpg",
  "agri-019.jpg",
  "agri-020.jpg",
  "agri-021.jpg",
  "agri-022.jpg",
  "agri-023.jpg",
  "agri-024.jpg",
  "agri-025.jpg",
  "agri-026.jpg",
  "agri-028.jpg",
  "agri-029.jpg"
];

export const AGRI_SLIDES: Array<{ src: string; alt: string }> = AGRO_SLIDER_IMAGES.map((fileName, index) => ({
  src: `/assets/agri-slider/${fileName}`,
  alt: `Agriculture slider image ${index + 1}`
}));

export const DASHBOARD_GALLERY_IMAGES: Array<{ src: string; alt: string }> = DASHBOARD_GALLERY_FILES.map(
  (fileName, index) => ({
    src: `/assets/agri-gallery/${fileName}`,
    alt: `Agriculture gallery image ${index + 1}`
  })
);

export const GALLERY_PAGE_SIZE = 6;
export const SLIDER_AUTOPLAY_MS = 6500;

export const spacingScale = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
  section: 8
} as const;

export const FALLBACK_MANDI_CATALOG: MandiCatalogResponse = {
  crops: [
    { crop: "Rice", category: "cereals" },
    { crop: "Wheat", category: "cereals" },
    { crop: "Maize", category: "cereals" },
    { crop: "Arhar (Tur)", category: "pulses" },
    { crop: "Chana", category: "pulses" },
    { crop: "Moong", category: "pulses" },
    { crop: "Groundnut", category: "oilseeds" },
    { crop: "Mustard", category: "oilseeds" },
    { crop: "Sesame", category: "oilseeds" },
    { crop: "Tomato", category: "vegetables" },
    { crop: "Potato", category: "vegetables" },
    { crop: "Onion", category: "vegetables" },
    { crop: "Banana", category: "fruits" },
    { crop: "Mango", category: "fruits" },
    { crop: "Guava", category: "fruits" },
    { crop: "Turmeric", category: "spices" },
    { crop: "Ginger", category: "spices" }
  ],
  markets: ["Patna", "Muzaffarpur", "Bhagalpur", "Pune", "Nashik"]
};

export const IMPORTANT_LINKS = [
  { key: "dashboard_page.links.beneficiary_status", url: "https://pmkisan.gov.in/" },
  { key: "dashboard_page.links.farmer_registration", url: "https://farmer.gov.in/" },
  { key: "dashboard_page.links.market_price_bulletin", url: "https://agmarknet.gov.in/" },
  { key: "dashboard_page.links.helpline_support", url: "https://pgportal.gov.in/" }
];
