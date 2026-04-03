import test from "node:test";
import assert from "node:assert/strict";

import { buildAdvisorPrompt } from "../src/lib/prompt.js";

test("buildAdvisorPrompt includes required context and JSON rules", () => {
  const prompt = buildAdvisorPrompt({
    location: "Bihar",
    crop: "Wheat",
    query: "Leaves are turning yellow",
    responseLanguageLabel: "Hindi",
  });

  assert.match(prompt, /Location: Bihar/);
  assert.match(prompt, /Crop: Wheat/);
  assert.match(prompt, /Problem: Leaves are turning yellow/);
  assert.match(prompt, /Respond ONLY with valid JSON/);
  assert.match(prompt, /Respond in Hindi/);
});
