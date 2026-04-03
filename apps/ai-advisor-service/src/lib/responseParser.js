import HttpError from "./httpError.js";

const normalizeList = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new HttpError(502, `Model response field "${fieldName}" was not an array.`);
  }

  const items = value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!items.length) {
    throw new HttpError(502, `Model response field "${fieldName}" was empty.`);
  }

  return items;
};

const cleanListItem = (value) =>
  String(value || "")
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[\).\s-]+/, "")
    .trim();

const splitInlineList = (value) =>
  String(value || "")
    .split(/\s*(?:\r?\n|;|\u2022)\s*/)
    .map(cleanListItem)
    .filter(Boolean);

const parseJsonCandidate = (text) => {
  const direct = text.trim();
  try {
    return JSON.parse(direct);
  } catch {}

  const fenced = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  const start = direct.indexOf("{");
  const end = direct.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(direct.slice(start, end + 1));
    } catch {}
  }
  return null;
};

const parseStructuredTextCandidate = (text) => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const result = {
    advice: "",
    steps: [],
    precautions: [],
  };

  let currentSection = "advice";

  for (const line of lines) {
    const adviceMatch = line.match(
      /^(?:advice|cause|cause and immediate advice|likely cause)\s*:\s*(.*)$/i,
    );
    if (adviceMatch) {
      currentSection = "advice";
      if (adviceMatch[1]) {
        result.advice = result.advice
          ? `${result.advice} ${adviceMatch[1].trim()}`
          : adviceMatch[1].trim();
      }
      continue;
    }

    const stepsMatch = line.match(/^(?:solution|steps?|solution steps?)\s*:\s*(.*)$/i);
    if (stepsMatch) {
      currentSection = "steps";
      result.steps.push(...splitInlineList(stepsMatch[1]));
      continue;
    }

    const precautionsMatch = line.match(
      /^(?:precautions?|preventive steps?|prevention|safety)\s*:\s*(.*)$/i,
    );
    if (precautionsMatch) {
      currentSection = "precautions";
      result.precautions.push(...splitInlineList(precautionsMatch[1]));
      continue;
    }

    if (currentSection === "advice") {
      result.advice = result.advice
        ? `${result.advice} ${cleanListItem(line)}`
        : cleanListItem(line);
      continue;
    }

    const cleaned = cleanListItem(line);
    if (!cleaned) {
      continue;
    }

    if (currentSection === "steps") {
      result.steps.push(cleaned);
    } else if (currentSection === "precautions") {
      result.precautions.push(cleaned);
    }
  }

  if (!result.advice || !result.steps.length || !result.precautions.length) {
    return null;
  }

  return result;
};

export const parseAdvisorResponse = (text) => {
  const parsed =
    parseJsonCandidate(String(text || "")) || parseStructuredTextCandidate(String(text || ""));
  if (!parsed) {
    throw new HttpError(502, "Model did not return valid JSON.");
  }
  const advice = String(parsed?.advice || "").trim();
  if (!advice) {
    throw new HttpError(502, 'Model response field "advice" was empty.');
  }

  return {
    advice,
    steps: normalizeList(parsed?.steps, "steps"),
    precautions: normalizeList(parsed?.precautions, "precautions"),
  };
};

export default parseAdvisorResponse;
