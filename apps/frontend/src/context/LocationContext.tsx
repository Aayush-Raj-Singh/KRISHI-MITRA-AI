import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { geocodeLocation, reverseGeocode } from "../services/locationService";
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

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const normalizeLabel = (city?: string, state?: string, fallback?: string) => {
  const parts = [city, state].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return fallback || "";
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
    setCached(LOCATION_CACHE_KEY, { ...snapshot, manualLocation: manual });
  }, []);

  const applySnapshot = useCallback((snapshot: LocationSnapshot, manual?: string, fromCache = false) => {
    setCoords(snapshot.coords);
    setCity(snapshot.city);
    setState(snapshot.state);
    setLabel(snapshot.label || normalizeLabel(snapshot.city, snapshot.state, manual));
    setSource(fromCache ? "cache" : snapshot.source);
    if (manual) {
      setManualLocation(manual);
    }
    setStatus("ready");
    setError(null);
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is not supported on this device.");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        try {
          const place = await reverseGeocode(nextCoords.lat, nextCoords.lon);
          const nextSnapshot: LocationSnapshot = {
            coords: nextCoords,
            city: place.city,
            state: place.state,
            label: normalizeLabel(place.city, place.state, place.label),
            source: "geolocation"
          };
          applySnapshot(nextSnapshot);
          storeSnapshot(nextSnapshot, "");
        } catch (geoError) {
          const message = geoError instanceof Error ? geoError.message : "Unable to resolve location.";
          setCoords(nextCoords);
          setLabel("Location detected");
          setSource("geolocation");
          setStatus("ready");
          setError(message);
          storeSnapshot({ coords: nextCoords, source: "geolocation", label: "Location detected" }, "");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError("Location permission denied. Enter your location manually.");
        } else {
          setStatus("error");
          setError("Unable to fetch location. Enter your location manually.");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 10 }
    );
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
          source: "manual"
        };
        applySnapshot(nextSnapshot, trimmed);
        storeSnapshot(nextSnapshot, trimmed);
      } catch (geoError) {
        const message = geoError instanceof Error ? geoError.message : "Unable to resolve the location.";
        setStatus("error");
        setLabel(trimmed);
        setSource("manual");
        setError(message);
        storeSnapshot({ label: trimmed, source: "manual" }, trimmed);
      }
    },
    [applySnapshot, storeSnapshot]
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
          source: cached.value.source
        },
        cached.value.manualLocation,
        true
      );
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
      saveManualLocation
    }),
    [status, coords, city, state, label, source, manualLocation, error, requestLocation, saveManualLocation]
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

