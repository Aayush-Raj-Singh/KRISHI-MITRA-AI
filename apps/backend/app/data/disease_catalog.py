from __future__ import annotations

DISEASE_CATALOG = {
    "Rice": {
        "Leaf Blight": {
            "symptoms": [
                "Yellowing at leaf margins",
                "Brown streaks on leaves",
                "Leaf tips drying prematurely",
            ],
            "treatment": [
                "Apply recommended fungicide at early symptom stage",
                "Remove severely infected leaves",
            ],
            "prevention": [
                "Use certified disease-free seeds",
                "Maintain field drainage",
                "Avoid excessive nitrogen fertilizer",
            ],
            "organic_solutions": [
                "Neem oil spray (2-3 ml/L water)",
                "Trichoderma-based bio-fungicide",
            ],
            "recommended_products": ["Mancozeb 75% WP", "Copper oxychloride"],
        },
        "Healthy": {
            "symptoms": ["Leaves are uniformly green", "No visible lesions or spots"],
            "treatment": ["No treatment needed"],
            "prevention": ["Continue balanced fertilization", "Regular field monitoring"],
            "organic_solutions": ["Compost tea foliar spray"],
            "recommended_products": [],
        },
    },
    "Wheat": {
        "Rust": {
            "symptoms": [
                "Orange/brown pustules on leaves",
                "Powdery spores on leaf surface",
            ],
            "treatment": [
                "Apply triazole fungicide promptly",
                "Remove heavily infected plants",
            ],
            "prevention": [
                "Use rust-resistant varieties",
                "Avoid late sowing",
            ],
            "organic_solutions": ["Sulfur-based bio-fungicide"],
            "recommended_products": ["Propiconazole", "Tebuconazole"],
        },
        "Healthy": {
            "symptoms": ["Uniform green leaf canopy", "No rust pustules"],
            "treatment": ["No treatment needed"],
            "prevention": ["Maintain crop rotation", "Balanced irrigation"],
            "organic_solutions": ["Seaweed extract foliar spray"],
            "recommended_products": [],
        },
    },
    "Tomato": {
        "Early Blight": {
            "symptoms": [
                "Dark concentric rings on older leaves",
                "Yellowing around leaf spots",
            ],
            "treatment": [
                "Apply protective fungicide",
                "Remove lower infected leaves",
            ],
            "prevention": [
                "Avoid overhead irrigation",
                "Use mulch to prevent soil splash",
            ],
            "organic_solutions": ["Bacillus subtilis bio-fungicide"],
            "recommended_products": ["Chlorothalonil", "Mancozeb"],
        },
        "Healthy": {
            "symptoms": ["Green leaves with no concentric spots"],
            "treatment": ["No treatment needed"],
            "prevention": ["Maintain airflow between plants"],
            "organic_solutions": ["Compost tea"],
            "recommended_products": [],
        },
    },
    "Maize": {
        "Leaf Blight": {
            "symptoms": ["Long gray lesions on leaves", "Leaf tips drying"],
            "treatment": ["Apply recommended fungicide", "Remove infected leaf debris"],
            "prevention": ["Use resistant hybrids", "Ensure balanced nitrogen"],
            "organic_solutions": ["Trichoderma-based bio-fungicide"],
            "recommended_products": ["Mancozeb", "Propiconazole"],
        },
        "Healthy": {
            "symptoms": ["Uniform green leaves", "No visible lesions"],
            "treatment": ["No treatment needed"],
            "prevention": ["Maintain crop rotation"],
            "organic_solutions": ["Seaweed extract"],
            "recommended_products": [],
        },
    },
    "Potato": {
        "Early Blight": {
            "symptoms": ["Dark concentric spots on older leaves", "Yellowing around lesions"],
            "treatment": ["Apply protective fungicide", "Remove infected foliage"],
            "prevention": ["Use certified seed", "Avoid overhead irrigation"],
            "organic_solutions": ["Copper-based bio-fungicide"],
            "recommended_products": ["Chlorothalonil", "Mancozeb"],
        },
        "Healthy": {
            "symptoms": ["Healthy green canopy", "No leaf spots"],
            "treatment": ["No treatment needed"],
            "prevention": ["Ensure adequate spacing"],
            "organic_solutions": ["Compost tea"],
            "recommended_products": [],
        },
    },
}

DEFAULT_DISEASE_INFO = {
    "symptoms": ["Symptoms not found in catalog"],
    "treatment": ["Consult local agriculture officer"],
    "prevention": ["Practice crop rotation and field hygiene"],
    "organic_solutions": ["Neem oil spray"],
    "recommended_products": [],
}


def get_disease_info(crop: str, disease: str) -> dict:
    crop_data = DISEASE_CATALOG.get(crop, {})
    return crop_data.get(disease, DEFAULT_DISEASE_INFO)
