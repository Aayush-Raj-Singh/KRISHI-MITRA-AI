import type { MandiDirectoryItem } from "@krishimitra/shared";

const normalize = (value: string) => value.trim();
const normalizeKey = (value: string) => value.trim().toLowerCase();

const uniqueSorted = (items: string[]) => {
  const seen = new Set<string>();
  items.forEach((item) => {
    const cleaned = normalize(item);
    if (cleaned) {
      seen.add(cleaned);
    }
  });
  return Array.from(seen).sort((left, right) => left.localeCompare(right));
};

export const buildMandiOptions = (directory: MandiDirectoryItem[]) => {
  const districtsByState: Record<string, string[]> = {};
  const mandisByStateDistrict: Record<string, string[]> = {};
  const districtSets: Record<string, Set<string>> = {};
  const mandiSets: Record<string, Set<string>> = {};

  directory.forEach((item) => {
    const stateValue = normalize(item.state);
    const stateKey = normalizeKey(item.state);
    const districtValue = normalize(item.district || "");
    const districtKey = normalizeKey(item.district || "");
    const mandiValue = normalize(item.name);

    if (stateKey && districtValue) {
      districtSets[stateKey] ??= new Set<string>();
      districtSets[stateKey].add(districtValue);
    }

    if (stateKey && districtKey && mandiValue) {
      const mapKey = `${stateKey}||${districtKey}`;
      mandiSets[mapKey] ??= new Set<string>();
      mandiSets[mapKey].add(mandiValue);
    }
  });

  Object.entries(districtSets).forEach(([stateKey, value]) => {
    districtsByState[stateKey] = Array.from(value).sort((left, right) => left.localeCompare(right));
  });

  Object.entries(mandiSets).forEach(([mapKey, value]) => {
    mandisByStateDistrict[mapKey] = Array.from(value).sort((left, right) =>
      left.localeCompare(right),
    );
  });

  return {
    states: uniqueSorted(directory.map((item) => item.state)),
    districts: uniqueSorted(directory.map((item) => item.district || "")),
    mandis: uniqueSorted(directory.map((item) => item.name)),
    commodities: uniqueSorted(directory.flatMap((item) => item.major_commodities || [])),
    getDistrictsForState: (state: string) => districtsByState[normalizeKey(state)] || [],
    getMandisForDistrict: (state: string, district: string) =>
      mandisByStateDistrict[`${normalizeKey(state)}||${normalizeKey(district)}`] || [],
  };
};
