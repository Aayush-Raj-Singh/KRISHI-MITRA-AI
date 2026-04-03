import { describe, expect, it, vi } from "vitest";

import { formatCoordinateLabel, reverseGeocode } from "./locationService";

describe("reverseGeocode", () => {
  it("uses the backend location endpoint when it returns a place label", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          city: "Patna",
          state: "Bihar",
          country: "India",
          label: "Patna, Bihar, India",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await reverseGeocode(25.5941, 85.1376);

    expect(result.label).toBe("Patna, Bihar, India");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to coordinates when reverse geocoding providers fail", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await reverseGeocode(28.6139, 77.209);

    expect(fetchMock).toHaveBeenCalled();
    expect(result.label).toBe(formatCoordinateLabel(28.6139, 77.209));
  });
});
