export interface CropAdvisorRequest {
  location: string;
  crop: string;
  query: string;
  language?: string | null;
}

export interface CropAdvisorResponse {
  advice: string;
  steps: string[];
  precautions: string[];
}
