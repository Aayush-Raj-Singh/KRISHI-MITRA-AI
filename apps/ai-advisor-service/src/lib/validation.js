import HttpError from "./httpError.js";

const cleanText = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const rejectMarkup = (value, fieldName) => {
  if (/[<>]/.test(value)) {
    throw new HttpError(400, `${fieldName} contains invalid characters.`);
  }
};

export const validateAdvisorRequest = (payload) => {
  const location = cleanText(payload?.location);
  const crop = cleanText(payload?.crop);
  const query = cleanText(payload?.query);
  const language = cleanText(payload?.language).toLowerCase();

  if (!location || !crop || !query) {
    throw new HttpError(400, "location, crop, and query are required.");
  }
  if (location.length > 120 || crop.length > 120) {
    throw new HttpError(400, "location and crop must be 120 characters or fewer.");
  }
  if (query.length > 1000) {
    throw new HttpError(400, "query must be 1000 characters or fewer.");
  }

  rejectMarkup(location, "location");
  rejectMarkup(crop, "crop");

  return {
    location,
    crop,
    query,
    language: language || undefined,
  };
};

export default validateAdvisorRequest;
