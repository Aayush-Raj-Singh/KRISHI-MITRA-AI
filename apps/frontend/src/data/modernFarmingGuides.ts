export interface ModernFarmingGuide {
  id: string;
  crop: string;
  category: string;
  season: string;
  durationDays: number;
  farmingModel: string;
  method: string;
  irrigation: string;
  nutrition: string;
  technology: string[];
  expectedYield: string;
  marketTip: string;
}

export const MODERN_FARMING_GUIDES: ModernFarmingGuide[] = [
  {
    "id": "mf-001",
    "crop": "Rice",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 125,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "4.5-6.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-002",
    "crop": "Wheat",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "4.0-5.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-003",
    "crop": "Maize",
    "category": "Cereal",
    "season": "Kharif, Rabi",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "5.0-7.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-004",
    "crop": "Barley",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.5-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-005",
    "crop": "Oat",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.8-4.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-006",
    "crop": "Sorghum",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.0-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-007",
    "crop": "Pearl Millet",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.2-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-008",
    "crop": "Finger Millet",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.5-3.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-009",
    "crop": "Foxtail Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 90,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-010",
    "crop": "Little Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 92,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.6-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-011",
    "crop": "Kodo Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.7-2.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-012",
    "crop": "Barnyard Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 85,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.5-2.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-013",
    "crop": "Proso Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 88,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.7-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-014",
    "crop": "Quinoa",
    "category": "Pseudo-cereal",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.0-3.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-015",
    "crop": "Buckwheat",
    "category": "Pseudo-cereal",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.4-2.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-016",
    "crop": "Amaranth Grain",
    "category": "Pseudo-cereal",
    "season": "Kharif",
    "durationDays": 98,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.9 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-017",
    "crop": "Triticale",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.8-5.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-018",
    "crop": "Rye",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 118,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.2-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-019",
    "crop": "Teff",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-020",
    "crop": "Job's Tears",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.5-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-021",
    "crop": "Chickpea",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-022",
    "crop": "Pigeon Pea",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 165,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.5-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-023",
    "crop": "Lentil",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.4-2.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-024",
    "crop": "Green Gram",
    "category": "Pulse",
    "season": "Kharif, Zaid",
    "durationDays": 70,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-025",
    "crop": "Black Gram",
    "category": "Pulse",
    "season": "Kharif, Zaid",
    "durationDays": 80,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-026",
    "crop": "Cowpea",
    "category": "Pulse",
    "season": "Kharif, Zaid",
    "durationDays": 85,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-027",
    "crop": "Field Pea",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-028",
    "crop": "Kidney Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.4-2.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-029",
    "crop": "Faba Bean",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-030",
    "crop": "Horse Gram",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.9-1.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-031",
    "crop": "Moth Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 90,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-032",
    "crop": "Lablab Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-033",
    "crop": "Adzuki Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-034",
    "crop": "Broad Bean",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.9 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-035",
    "crop": "Bambara Groundnut",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.2-2.1 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-036",
    "crop": "Navy Bean",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.3-2.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-037",
    "crop": "Cluster Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.1-1.9 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-038",
    "crop": "Soybean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.0-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-039",
    "crop": "Lupin",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.6-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-040",
    "crop": "Winged Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.4-2.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-041",
    "crop": "Groundnut",
    "category": "Oilseed",
    "season": "Kharif, Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.0-3.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-042",
    "crop": "Mustard",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.4-2.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-043",
    "crop": "Sesame",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-044",
    "crop": "Sunflower",
    "category": "Oilseed",
    "season": "Rabi, Zaid",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.5-2.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-045",
    "crop": "Safflower",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 135,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-046",
    "crop": "Niger Seed",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.7-1.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-047",
    "crop": "Castor",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 180,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.0-3.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-048",
    "crop": "Linseed",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 130,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-049",
    "crop": "Canola",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-050",
    "crop": "Camelina",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-051",
    "crop": "Poppy Seed",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 140,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-052",
    "crop": "Perilla",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-053",
    "crop": "Hempseed",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.1-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-054",
    "crop": "Jojoba",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.5-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-055",
    "crop": "Argan",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-056",
    "crop": "Tomato",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "45-70 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-057",
    "crop": "Potato",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "25-45 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-058",
    "crop": "Onion",
    "category": "Vegetable",
    "season": "Rabi, Kharif",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-059",
    "crop": "Garlic",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 150,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "8-12 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-060",
    "crop": "Brinjal",
    "category": "Vegetable",
    "season": "Kharif, Rabi",
    "durationDays": 140,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "35-55 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-061",
    "crop": "Chili",
    "category": "Vegetable",
    "season": "Kharif, Rabi",
    "durationDays": 170,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-062",
    "crop": "Capsicum",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 130,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "30-50 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-063",
    "crop": "Cabbage",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "35-60 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-064",
    "crop": "Cauliflower",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "25-45 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-065",
    "crop": "Broccoli",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 90,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-066",
    "crop": "Carrot",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-067",
    "crop": "Radish",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 55,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "18-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-068",
    "crop": "Beetroot",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 90,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-069",
    "crop": "Turnip",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 70,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "18-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-070",
    "crop": "Spinach",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 45,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "10-18 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-071",
    "crop": "Fenugreek Leaf",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 40,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "8-15 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-072",
    "crop": "Coriander Leaf",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 50,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "9-16 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-073",
    "crop": "Amaranthus Leaf",
    "category": "Leafy",
    "season": "Kharif, Zaid",
    "durationDays": 45,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-074",
    "crop": "Lettuce",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 55,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "15-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-075",
    "crop": "Celery",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-076",
    "crop": "Cucumber",
    "category": "Vegetable",
    "season": "Zaid, Kharif",
    "durationDays": 65,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "22-38 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-077",
    "crop": "Bottle Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 90,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "25-40 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-078",
    "crop": "Bitter Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-079",
    "crop": "Ridge Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 85,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "16-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-080",
    "crop": "Sponge Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 88,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "14-24 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-081",
    "crop": "Pumpkin",
    "category": "Vegetable",
    "season": "Kharif",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-082",
    "crop": "Ash Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "18-32 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-083",
    "crop": "Watermelon",
    "category": "Fruit Vegetable",
    "season": "Zaid",
    "durationDays": 90,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "25-40 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-084",
    "crop": "Muskmelon",
    "category": "Fruit Vegetable",
    "season": "Zaid",
    "durationDays": 82,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "18-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-085",
    "crop": "Okra",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 85,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-086",
    "crop": "French Bean",
    "category": "Vegetable",
    "season": "Rabi, Kharif",
    "durationDays": 70,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "8-14 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-087",
    "crop": "Peas",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "7-12 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-088",
    "crop": "Sweet Corn",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 80,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "10-16 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-089",
    "crop": "Zucchini",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 60,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-090",
    "crop": "Leek",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-091",
    "crop": "Banana",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 320,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "45-65 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-092",
    "crop": "Mango",
    "category": "Fruit",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "8-15 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-093",
    "crop": "Papaya",
    "category": "Fruit",
    "season": "Zaid, Kharif",
    "durationDays": 270,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "50-70 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-094",
    "crop": "Guava",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 300,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-095",
    "crop": "Pomegranate",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 300,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-096",
    "crop": "Citrus",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 330,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-097",
    "crop": "Lemon",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 320,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "12-22 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-098",
    "crop": "Orange",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 330,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "10-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-099",
    "crop": "Apple",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-100",
    "crop": "Pear",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 350,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "18-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-101",
    "crop": "Peach",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 320,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "10-18 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-102",
    "crop": "Plum",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 320,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "8-16 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-103",
    "crop": "Grapes",
    "category": "Fruit",
    "season": "Rabi, Kharif",
    "durationDays": 210,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-104",
    "crop": "Strawberry",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 140,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-105",
    "crop": "Dragon Fruit",
    "category": "Fruit",
    "season": "Zaid, Kharif",
    "durationDays": 330,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-106",
    "crop": "Turmeric",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 240,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-107",
    "crop": "Ginger",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 230,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "18-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-108",
    "crop": "Cumin",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-109",
    "crop": "Coriander Seed",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-110",
    "crop": "Fennel",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 150,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.5-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-111",
    "crop": "Cardamom",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.4-0.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-112",
    "crop": "Black Pepper",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-113",
    "crop": "Clove",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "0.8-1.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-114",
    "crop": "Cinnamon",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-115",
    "crop": "Ajwain",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 125,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.0-1.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-116",
    "crop": "Rice",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 125,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "4.5-6.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-117",
    "crop": "Wheat",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "4.0-5.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-118",
    "crop": "Maize",
    "category": "Cereal",
    "season": "Kharif, Rabi",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "5.0-7.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-119",
    "crop": "Barley",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "3.5-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-120",
    "crop": "Oat",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.8-4.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-121",
    "crop": "Sorghum",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "3.0-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-122",
    "crop": "Pearl Millet",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.2-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-123",
    "crop": "Finger Millet",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.5-3.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-124",
    "crop": "Foxtail Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 90,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-125",
    "crop": "Little Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 92,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.6-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-126",
    "crop": "Kodo Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.7-2.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-127",
    "crop": "Barnyard Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 85,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.5-2.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-128",
    "crop": "Proso Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 88,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.7-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-129",
    "crop": "Quinoa",
    "category": "Pseudo-cereal",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.0-3.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-130",
    "crop": "Buckwheat",
    "category": "Pseudo-cereal",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.4-2.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-131",
    "crop": "Amaranth Grain",
    "category": "Pseudo-cereal",
    "season": "Kharif",
    "durationDays": 98,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.9 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-132",
    "crop": "Triticale",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "3.8-5.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-133",
    "crop": "Rye",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 118,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "3.2-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-134",
    "crop": "Teff",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-135",
    "crop": "Job's Tears",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.5-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-136",
    "crop": "Chickpea",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-137",
    "crop": "Pigeon Pea",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 165,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.5-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-138",
    "crop": "Lentil",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.4-2.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-139",
    "crop": "Green Gram",
    "category": "Pulse",
    "season": "Kharif, Zaid",
    "durationDays": 70,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-140",
    "crop": "Black Gram",
    "category": "Pulse",
    "season": "Kharif, Zaid",
    "durationDays": 80,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-141",
    "crop": "Cowpea",
    "category": "Pulse",
    "season": "Kharif, Zaid",
    "durationDays": 85,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-142",
    "crop": "Field Pea",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-143",
    "crop": "Kidney Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.4-2.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-144",
    "crop": "Faba Bean",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-145",
    "crop": "Horse Gram",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.9-1.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-146",
    "crop": "Moth Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 90,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-147",
    "crop": "Lablab Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-148",
    "crop": "Adzuki Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-149",
    "crop": "Broad Bean",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.9 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-150",
    "crop": "Bambara Groundnut",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.2-2.1 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-151",
    "crop": "Navy Bean",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.3-2.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-152",
    "crop": "Cluster Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.1-1.9 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-153",
    "crop": "Soybean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.0-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-154",
    "crop": "Lupin",
    "category": "Pulse",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.6-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-155",
    "crop": "Winged Bean",
    "category": "Pulse",
    "season": "Kharif",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.4-2.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-156",
    "crop": "Groundnut",
    "category": "Oilseed",
    "season": "Kharif, Rabi",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.0-3.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-157",
    "crop": "Mustard",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.4-2.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-158",
    "crop": "Sesame",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-159",
    "crop": "Sunflower",
    "category": "Oilseed",
    "season": "Rabi, Zaid",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.5-2.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-160",
    "crop": "Safflower",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 135,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-161",
    "crop": "Niger Seed",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.7-1.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-162",
    "crop": "Castor",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 180,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "2.0-3.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-163",
    "crop": "Linseed",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 130,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-164",
    "crop": "Canola",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-165",
    "crop": "Camelina",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-166",
    "crop": "Poppy Seed",
    "category": "Oilseed",
    "season": "Rabi",
    "durationDays": 140,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-167",
    "crop": "Perilla",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-168",
    "crop": "Hempseed",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.1-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-169",
    "crop": "Jojoba",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.5-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-170",
    "crop": "Argan",
    "category": "Oilseed",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-171",
    "crop": "Tomato",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "45-70 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-172",
    "crop": "Potato",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "25-45 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-173",
    "crop": "Onion",
    "category": "Vegetable",
    "season": "Rabi, Kharif",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-174",
    "crop": "Garlic",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 150,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "8-12 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-175",
    "crop": "Brinjal",
    "category": "Vegetable",
    "season": "Kharif, Rabi",
    "durationDays": 140,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "35-55 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-176",
    "crop": "Chili",
    "category": "Vegetable",
    "season": "Kharif, Rabi",
    "durationDays": 170,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-177",
    "crop": "Capsicum",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 130,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "30-50 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-178",
    "crop": "Cabbage",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "35-60 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-179",
    "crop": "Cauliflower",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 100,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "25-45 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-180",
    "crop": "Broccoli",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 90,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-181",
    "crop": "Carrot",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-182",
    "crop": "Radish",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 55,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "18-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-183",
    "crop": "Beetroot",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 90,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-184",
    "crop": "Turnip",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 70,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "18-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-185",
    "crop": "Spinach",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 45,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "10-18 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-186",
    "crop": "Fenugreek Leaf",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 40,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "8-15 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-187",
    "crop": "Coriander Leaf",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 50,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "9-16 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-188",
    "crop": "Amaranthus Leaf",
    "category": "Leafy",
    "season": "Kharif, Zaid",
    "durationDays": 45,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-189",
    "crop": "Lettuce",
    "category": "Leafy",
    "season": "Rabi, Zaid",
    "durationDays": 55,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "15-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-190",
    "crop": "Celery",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 100,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-191",
    "crop": "Cucumber",
    "category": "Vegetable",
    "season": "Zaid, Kharif",
    "durationDays": 65,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "22-38 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-192",
    "crop": "Bottle Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 90,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "25-40 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-193",
    "crop": "Bitter Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-194",
    "crop": "Ridge Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 85,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "16-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-195",
    "crop": "Sponge Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 88,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "14-24 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-196",
    "crop": "Pumpkin",
    "category": "Vegetable",
    "season": "Kharif",
    "durationDays": 115,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-197",
    "crop": "Ash Gourd",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "18-32 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-198",
    "crop": "Watermelon",
    "category": "Fruit Vegetable",
    "season": "Zaid",
    "durationDays": 90,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "25-40 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-199",
    "crop": "Muskmelon",
    "category": "Fruit Vegetable",
    "season": "Zaid",
    "durationDays": 82,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "18-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-200",
    "crop": "Okra",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 85,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-201",
    "crop": "French Bean",
    "category": "Vegetable",
    "season": "Rabi, Kharif",
    "durationDays": 70,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "8-14 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-202",
    "crop": "Peas",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "7-12 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-203",
    "crop": "Sweet Corn",
    "category": "Vegetable",
    "season": "Kharif, Zaid",
    "durationDays": 80,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "10-16 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-204",
    "crop": "Zucchini",
    "category": "Vegetable",
    "season": "Rabi, Zaid",
    "durationDays": 60,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-205",
    "crop": "Leek",
    "category": "Vegetable",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-206",
    "crop": "Banana",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 320,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "45-65 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-207",
    "crop": "Mango",
    "category": "Fruit",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "8-15 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-208",
    "crop": "Papaya",
    "category": "Fruit",
    "season": "Zaid, Kharif",
    "durationDays": 270,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "50-70 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-209",
    "crop": "Guava",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 300,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-210",
    "crop": "Pomegranate",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 300,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "12-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-211",
    "crop": "Citrus",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 330,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "15-25 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-212",
    "crop": "Lemon",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 320,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "12-22 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-213",
    "crop": "Orange",
    "category": "Fruit",
    "season": "Kharif, Rabi",
    "durationDays": 330,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "10-20 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-214",
    "crop": "Apple",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-215",
    "crop": "Pear",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 350,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "18-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-216",
    "crop": "Peach",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 320,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "10-18 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-217",
    "crop": "Plum",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 320,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "8-16 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-218",
    "crop": "Grapes",
    "category": "Fruit",
    "season": "Rabi, Kharif",
    "durationDays": 210,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-35 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-219",
    "crop": "Strawberry",
    "category": "Fruit",
    "season": "Rabi",
    "durationDays": 140,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-220",
    "crop": "Dragon Fruit",
    "category": "Fruit",
    "season": "Zaid, Kharif",
    "durationDays": 330,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-221",
    "crop": "Turmeric",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 240,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "20-30 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-222",
    "crop": "Ginger",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 230,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "18-28 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-223",
    "crop": "Cumin",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.8-1.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-224",
    "crop": "Coriander Seed",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-225",
    "crop": "Fennel",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 150,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.5-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-226",
    "crop": "Cardamom",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.4-0.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-227",
    "crop": "Black Pepper",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-228",
    "crop": "Clove",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "0.8-1.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-229",
    "crop": "Cinnamon",
    "category": "Spice",
    "season": "Kharif",
    "durationDays": 365,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.2-2.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-230",
    "crop": "Ajwain",
    "category": "Spice",
    "season": "Rabi",
    "durationDays": 125,
    "farmingModel": "Protected + Climate-Smart",
    "method": "Climate-resilient spacing, mulch cover, and integrated pest scouting under protected management.",
    "irrigation": "Automated drip or micro-sprinkler based on ET model",
    "nutrition": "Biofertilizer + water-soluble NPK schedule with leaf tissue monitoring.",
    "technology": [
      "Polyhouse/net-house",
      "IPM traps",
      "AI disease alert"
    ],
    "expectedYield": "1.0-1.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-231",
    "crop": "Rice",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 125,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "4.5-6.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-232",
    "crop": "Wheat",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "4.0-5.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-233",
    "crop": "Maize",
    "category": "Cereal",
    "season": "Kharif, Rabi",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "5.0-7.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-234",
    "crop": "Barley",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.5-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-235",
    "crop": "Oat",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.8-4.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-236",
    "crop": "Sorghum",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 105,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.0-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-237",
    "crop": "Pearl Millet",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.2-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-238",
    "crop": "Finger Millet",
    "category": "Cereal",
    "season": "Kharif",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.5-3.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-239",
    "crop": "Foxtail Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 90,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.8 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-240",
    "crop": "Little Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 92,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.6-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-241",
    "crop": "Kodo Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.7-2.7 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-242",
    "crop": "Barnyard Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 85,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.5-2.4 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-243",
    "crop": "Proso Millet",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 88,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.7-2.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-244",
    "crop": "Quinoa",
    "category": "Pseudo-cereal",
    "season": "Rabi",
    "durationDays": 110,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.0-3.2 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-245",
    "crop": "Buckwheat",
    "category": "Pseudo-cereal",
    "season": "Rabi",
    "durationDays": 95,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.4-2.3 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-246",
    "crop": "Amaranth Grain",
    "category": "Pseudo-cereal",
    "season": "Kharif",
    "durationDays": 98,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.9 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-247",
    "crop": "Triticale",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 120,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.8-5.0 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-248",
    "crop": "Rye",
    "category": "Cereal",
    "season": "Rabi",
    "durationDays": 118,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "3.2-4.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-249",
    "crop": "Teff",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 100,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "1.8-2.6 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  },
  {
    "id": "mf-250",
    "crop": "Job's Tears",
    "category": "Millet",
    "season": "Kharif",
    "durationDays": 115,
    "farmingModel": "Precision Drip + IoT",
    "method": "Raised-bed planting, drip fertigation, and sensor-based irrigation scheduling.",
    "irrigation": "Drip lines with pressure-compensated emitters",
    "nutrition": "Split NPK through fertigation with micronutrient correction every 15 days.",
    "technology": [
      "Soil moisture sensor",
      "Weather API",
      "Mobile advisory"
    ],
    "expectedYield": "2.5-3.5 t/ha",
    "marketTip": "Use local mandi + eNAM trend signals before harvest planning."
  }
];

export const MODERN_FARMING_CATEGORIES = Array.from(
  new Set(MODERN_FARMING_GUIDES.map((guide) => guide.category))
);

export const MODERN_FARMING_SEASONS = ["Kharif", "Rabi", "Zaid", "All"];
