import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { mandiMarketLookup } from "../data/mandiMarketGeo";
import {
  formatCoordinateLabel,
  geocodeLocation,
  reverseGeocode,
} from "../services/locationService";
import { haversineKm } from "../utils/geo";
import { getCachedWithMeta, setCached } from "../services/cache";

type Coordinates = {
  lat: number;
  lon: number;
  accuracy?: number;
};

type LocationStatus = "idle" | "locating" | "ready" | "denied" | "error";

export type LocationSnapshot = {
  coords?: Coordinates;
  city?: string;
  state?: string;
  label?: string;
  source?: "geolocation" | "manual" | "cache";
};

type LocationContextValue = {
  status: LocationStatus;
  coords?: Coordinates;
  city?: string;
  state?: string;
  label?: string;
  source?: "geolocation" | "manual" | "cache";
  manualLocation: string;
  error?: string | null;
  requestLocation: () => void;
  saveManualLocation: (value: string) => Promise<void>;
};

const LOCATION_CACHE_KEY = "user_location";
const LOCATION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const GEOLOCATION_TARGET_ACCURACY_M = 500;
const GEOLOCATION_MAX_ATTEMPTS = 3;
const GEOLOCATION_TIMEOUT_MS = 12000;
const KNOWN_MANDI_LABEL_RADIUS_KM = 35;
const LOCATION_CACHE_DECIMALS = 3;

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

type NearbyKnownMandi = {
  market: string;
  distanceKm: number;
};

const getNearbyKnownMandi = (coords?: Coordinates): NearbyKnownMandi | null => {
  if (!coords) return null;
  const origin = { lat: coords.lat, lon: coords.lon };
  const bestMatch =
    Array.from(mandiMarketLookup.values())
      .map<NearbyKnownMandi>((item) => ({
        market: item.market,
        distanceKm: haversineKm(origin, { lat: item.lat, lon: item.lon }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;
  if (bestMatch && bestMatch.distanceKm <= KNOWN_MANDI_LABEL_RADIUS_KM) {
    return bestMatch;
  }
  return null;
};

const normalizeLabel = (city?: string, state?: string, fallback?: string, coords?: Coordinates) => {
  const nearbyMandi = getNearbyKnownMandi(coords);
  if (nearbyMandi !== null) {
    const parts = [nearbyMandi.market, state].filter(Boolean);
    return parts.join(", ");
  }
  const parts = [city, state].filter(Boolean);
  if (parts.length) return parts.join(", ");
  const normalizedFallback = fallback?.trim();
  if (normalizedFallback && normalizedFallback.toLowerCase() !== "location detected") {
    return normalizedFallback;
  }
  if (coords) {
    return formatCoordinateLabel(coords.lat, coords.lon);
  }
  return "";
};

const getCurrentPositionAsync = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 0,
    });
  });

const sanitizeCoordsForCache = (coords?: Coordinates): Coordinates | undefined => {
  if (!coords) return undefined;
  return {
    lat: Number(coords.lat.toFixed(LOCATION_CACHE_DECIMALS)),
    lon: Number(coords.lon.toFixed(LOCATION_CACHE_DECIMALS)),
    accuracy: typeof coords.accuracy === "number" ? Math.round(coords.accuracy) : undefined,
  };
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [coords, setCoords] = useState<Coordinates | undefined>(undefined);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [state, setState] = useState<string | undefined>(undefined);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [source, setSource] = useState<LocationSnapshot["source"]>(undefined);
  const [manualLocation, setManualLocation] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const storeSnapshot = useCallback((snapshot: LocationSnapshot, manual?: string) => {
    setCached(LOCATION_CACHE_KEY, {
      ...snapshot,
      coords: sanitizeCoordsForCache(snapshot.coords),
      manualLocation: manual,
    });
  }, []);

  const applySnapshot = useCallback(
    (snapshot: LocationSnapshot, manual?: string, fromCache = false) => {
      setCoords(snapshot.coords);
      setCity(snapshot.city);
      setState(snapshot.state);
      setLabel(
        normalizeLabel(snapshot.city, snapshot.state, snapshot.label || manual, snapshot.coords),
      );
      setSource(fromCache ? "cache" : snapshot.source);
      if (manual) {
        setManualLocation(manual);
      }
      setStatus("ready");
      setError(null);
    },
    [],
  );

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is not supported on this device.");
      return;
    }
    setStatus("locating");
    void (async () => {
      let bestPosition: GeolocationPosition | null = null;
      let lastError: GeolocationPositionError | null = null;

      for (let attempt = 0; attempt < GEOLOCATION_MAX_ATTEMPTS; attempt += 1) {
        try {
          const position = await getCurrentPositionAsync();
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }
          if (position.coords.accuracy <= GEOLOCATION_TARGET_ACCURACY_M) {
            break;
          }
        } catch (error) {
          lastError = error as GeolocationPositionError;
          if (lastError?.code === 1) {
            break;
          }
        }
      }

      if (!bestPosition) {
        if (lastError?.code === 1) {
          setStatus("denied");
          setError("Location permission denied. Enter your location manually.");
        } else {
          setStatus("error");
          setError("Unable to fetch a fresh GPS location. Enter your location manually.");
        }
        return;
      }

      const nextCoords = {
        lat: bestPosition.coords.latitude,
        lon: bestPosition.coords.longitude,
        accuracy: bestPosition.coords.accuracy,
      };
      try {
        const place = await reverseGeocode(nextCoords.lat, nextCoords.lon);
        const nextSnapshot: LocationSnapshot = {
          coords: nextCoords,
          city: place.city,
          state: place.state,
          label: normalizeLabel(place.city, place.state, place.label),
          source: "geolocation",
        };
        applySnapshot(nextSnapshot);
        storeSnapshot(nextSnapshot, "");
        if (nextCoords.accuracy > GEOLOCATION_TARGET_ACCURACY_M) {
          setError(
            "GPS accuracy is above 500m. Move outdoors and refresh for better mandi and weather precision.",
          );
        }
      } catch {
        const fallbackLabel = formatCoordinateLabel(nextCoords.lat, nextCoords.lon);
        setCoords(nextCoords);
        setLabel(fallbackLabel);
        setSource("geolocation");
        setStatus("ready");
        setError(
          nextCoords.accuracy > GEOLOCATION_TARGET_ACCURACY_M
            ? "GPS accuracy is above 500m. Move outdoors and refresh for better mandi and weather precision."
            : null,
        );
        storeSnapshot({ coords: nextCoords, source: "geolocation", label: fallbackLabel }, "");
      }
    })();
  }, [applySnapshot, storeSnapshot]);

  const saveManualLocation = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      setManualLocation(trimmed);
      setStatus("locating");
      setError(null);
      try {
        const place = await geocodeLocation(trimmed);
        const nextSnapshot: LocationSnapshot = {
          coords: place.coords,
          city: place.city,
          state: place.state,
          label: normalizeLabel(place.city, place.state, trimmed),
          source: "manual",
        };
        applySnapshot(nextSnapshot, trimmed);
        storeSnapshot(nextSnapshot, trimmed);
      } catch (geoError) {
        const message =
          geoError instanceof Error ? geoError.message : "Unable to resolve the location.";
        setStatus("error");
        setLabel(trimmed);
        setSource("manual");
        setError(message);
        storeSnapshot({ label: trimmed, source: "manual" }, trimmed);
      }
    },
    [applySnapshot, storeSnapshot],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = getCachedWithMeta<{
      coords?: Coordinates;
      city?: string;
      state?: string;
      label?: string;
      source?: "geolocation" | "manual";
      manualLocation?: string;
    }>(LOCATION_CACHE_KEY);
    if (cached && Date.now() - cached.ts < LOCATION_TTL_MS) {
      applySnapshot(
        {
          coords: cached.value.coords,
          city: cached.value.city,
          state: cached.value.state,
          label: cached.value.label,
          source: cached.value.source,
        },
        cached.value.manualLocation,
        true,
      );
      requestLocation();
    } else {
      requestLocation();
    }
  }, [applySnapshot, requestLocation]);

  const contextValue = useMemo(
    () => ({
      status,
      coords,
      city,
      state,
      label,
      source,
      manualLocation,
      error,
      requestLocation,
      saveManualLocation,
    }),
    [
      status,
      coords,
      city,
      state,
      label,
      source,
      manualLocation,
      error,
      requestLocation,
      saveManualLocation,
    ],
  );

  return <LocationContext.Provider value={contextValue}>{children}</LocationContext.Provider>;
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
};
