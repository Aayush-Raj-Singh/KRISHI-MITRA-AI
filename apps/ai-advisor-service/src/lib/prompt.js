const escapeForPrompt = (value) =>
  String(value || "")
    .replace(/[<>]/g, "")
    .trim();

export const buildAdvisorPrompt = ({
  location,
  crop,
  query,
  responseLanguageLabel = "English",
  enforceJson = true,
}) => {
  const rules = [
    "You are an agricultural expert helping Indian farmers.",
    "Focus only on crop and farm advice relevant to India.",
    "Provide simple, practical guidance in language a farmer can understand.",
    "Do not give harmful, illegal, or unsafe instructions for people, animals, food, water, or soil.",
    "Do not recommend pesticide dosages unless label-safe guidance is certain; when uncertain, advise contacting a local agriculture officer or agronomist.",
    "If the problem may require lab testing, severe infestation review, or in-person inspection, say so briefly.",
  ];

  const outputRules = enforceJson
    ? [
        "Respond ONLY with valid JSON.",
        'Use exactly this shape: {"advice":"string","steps":["string"],"precautions":["string"]}.',
        "The advice field must explain the likely cause and immediate recommendation in 2 to 4 short sentences.",
        "The steps array must contain 3 to 5 concise, actionable items.",
        "The precautions array must contain 3 to 5 concise preventive or safety items.",
        "Do not include markdown, code fences, or extra keys.",
      ]
    : [];

  return [
    ...rules,
    ...outputRules,
    `Respond in ${responseLanguageLabel}.`,
    "",
    "Context:",
    `Location: ${escapeForPrompt(location)}`,
    `Crop: ${escapeForPrompt(crop)}`,
    `Problem: ${escapeForPrompt(query)}`,
    "",
    "Give:",
    "- Cause and immediate advice",
    "- Solution steps",
    "- Preventive steps",
  ].join("\n");
};

export default buildAdvisorPrompt;
