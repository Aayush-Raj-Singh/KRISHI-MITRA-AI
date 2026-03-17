import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchMandiCatalog, type MandiCatalogResponse } from "../services/integrations";
import { fetchMandiDirectory } from "../services/mandiDirectory";
import { FALLBACK_MANDI_CATALOG } from "../pages/dashboard/constants";

const normalize = (value: string) => value.trim();
const normalizeKey = (value: string) => value.trim().toLowerCase();

const uniqueSorted = (items: string[]) => {
  const seen = new Set<string>();
  items.forEach((item) => {
    const cleaned = normalize(item);
    if (cleaned) seen.add(cleaned);
  });
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
};

export const useMandiFilterOptions = (limit = 200) => {
  const catalogQuery = useQuery({
    queryKey: ["mandi-catalog", limit],
    queryFn: () => fetchMandiCatalog({ limit }),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const directoryQuery = useQuery({
    queryKey: ["mandi-directory-options", limit],
    queryFn: () => fetchMandiDirectory({ limit }),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1
  });

  const catalog: MandiCatalogResponse =
    catalogQuery.data && catalogQuery.data.crops.length > 0
      ? catalogQuery.data
      : FALLBACK_MANDI_CATALOG;

  const options = useMemo(() => {
    const crops = catalog.crops.map((item) => item.crop);
    const markets = catalog.markets;
    const directory = directoryQuery.data || [];

    const states = directory.map((item) => item.state);
    const districts = directory.map((item) => item.district || "");
    const mandis = directory.map((item) => item.name);
    const commoditiesFromDirectory = directory.flatMap((item) => item.major_commodities || []);

    return {
      crops: uniqueSorted([...crops, ...commoditiesFromDirectory]),
      markets: uniqueSorted([...markets, ...mandis]),
      states: uniqueSorted(states),
      districts: uniqueSorted(districts),
      mandis: uniqueSorted(mandis),
      commodities: uniqueSorted([...crops, ...commoditiesFromDirectory])
    };
  }, [catalog, directoryQuery.data]);

  const cascadingMaps = useMemo(() => {
    const directory = directoryQuery.data || [];
    const districtsByState: Record<string, string[]> = {};
    const mandisByStateDistrict: Record<string, string[]> = {};
    const districtSets: Record<string, Set<string>> = {};
    const mandiSets: Record<string, Set<string>> = {};

    directory.forEach((item) => {
      const stateValue = normalize(item.state);
      const stateKey = normalizeKey(item.state);
      if (!stateValue || !stateKey) return;
      const districtValue = normalize(item.district || "");
      const districtKey = normalizeKey(item.district || "");

      if (districtValue && districtKey) {
        if (!districtSets[stateKey]) {
          districtSets[stateKey] = new Set<string>();
        }
        districtSets[stateKey].add(districtValue);
      }

      const mandiValue = normalize(item.name);
      if (mandiValue && stateKey && districtKey) {
        const mapKey = `${stateKey}||${districtKey}`;
        if (!mandiSets[mapKey]) {
          mandiSets[mapKey] = new Set<string>();
        }
        mandiSets[mapKey].add(mandiValue);
      }
    });

    Object.entries(districtSets).forEach(([stateKey, set]) => {
      districtsByState[stateKey] = Array.from(set).sort((a, b) => a.localeCompare(b));
    });

    Object.entries(mandiSets).forEach(([mapKey, set]) => {
      mandisByStateDistrict[mapKey] = Array.from(set).sort((a, b) => a.localeCompare(b));
    });

    return { districtsByState, mandisByStateDistrict };
  }, [directoryQuery.data]);

  return {
    ...options,
    getDistrictsForState: (state: string) => {
      const key = normalizeKey(state);
      return key ? cascadingMaps.districtsByState[key] || [] : [];
    },
    getMandisForDistrict: (state: string, district: string) => {
      const stateKey = normalizeKey(state);
      const districtKey = normalizeKey(district);
      if (!stateKey || !districtKey) return [];
      const mapKey = `${stateKey}||${districtKey}`;
      return cascadingMaps.mandisByStateDistrict[mapKey] || [];
    },
    isLoading: catalogQuery.isLoading || directoryQuery.isLoading
  };
};

export default useMandiFilterOptions;
