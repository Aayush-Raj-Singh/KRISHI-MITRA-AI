export interface DiseasePredictionResponse {
  crop: string;
  disease: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  treatment: string[];
  prevention: string[];
  organic_solutions: string[];
  recommended_products: string[];
  advisory?: string | null;
  clarifying_questions: string[];
}

export interface DiseaseHistoryItem {
  prediction_id: string;
  user_id: string;
  crop: string;
  disease: string;
  confidence: number;
  severity: string;
  created_at: string;
  advisory?: string | null;
}
