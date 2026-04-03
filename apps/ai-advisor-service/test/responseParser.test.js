import test from "node:test";
import assert from "node:assert/strict";

import { parseAdvisorResponse } from "../src/lib/responseParser.js";

test("parseAdvisorResponse falls back to structured plain text sections", () => {
  const parsed = parseAdvisorResponse(`
    Cause: Yellowing can happen from low nitrogen or early fungal stress.
    Steps:
    - Check irrigation and drainage.
    - Test soil nutrients.
    - Apply the recommended fertilizer after soil testing.
    Precautions:
    - Avoid over-fertilizing.
    - Wear gloves when handling chemicals.
    - Contact a local agriculture officer if symptoms spread.
  `);

  assert.match(parsed.advice, /low nitrogen/i);
  assert.equal(parsed.steps.length, 3);
  assert.equal(parsed.precautions.length, 3);
});
