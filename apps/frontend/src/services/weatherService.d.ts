export type CurrentWeather = {
  temperatureC: number;
  humidity: number;
  windSpeedKph: number;
  weatherCode: number;
  condition: string;
  observedAt: string;
  source: string;
  cached?: boolean;
  stale?: boolean;
  offline?: boolean;
  lastUpdated?: string;
};

export type AQIResult = {
  aqi: number;
  pm10?: number;
  pm2_5?: number;
  o3?: number;
  co?: number;
  no2?: number;
  so2?: number;
  observedAt: string;
  source: string;
  cached?: boolean;
  stale?: boolean;
  offline?: boolean;
  lastUpdated?: string;
};

export function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather>;
export function getAQI(lat: number, lon: number): Promise<AQIResult>;
