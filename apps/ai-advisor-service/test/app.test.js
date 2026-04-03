import test from "node:test";
import assert from "node:assert/strict";

import request from "supertest";

import { createApp } from "../src/app.js";

test("POST /api/ai/advisor returns structured advisor response", async () => {
  let capturedInput = null;
  const app = createApp({
    advisorService: {
      async getAdvisorResponse(input) {
        capturedInput = input;
        return {
          advice: "Likely nitrogen stress with moisture imbalance.",
          steps: [
            "Check irrigation schedule",
            "Apply a balanced nutrient spray",
            "Inspect root zone drainage",
          ],
          precautions: ["Avoid overwatering", "Recheck after 3 days", "Use label-safe inputs only"],
        };
      },
    },
  });

  const response = await request(app)
    .post("/api/ai/advisor")
    .set("accept-language", "hi-IN,hi;q=0.9,en;q=0.8")
    .send({
      location: "Bihar",
      crop: "Wheat",
      query: "My crop leaves are turning yellow",
    });

  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.body).sort(), ["advice", "precautions", "steps"]);
  assert.equal(capturedInput.language.code, "hi");
  assert.equal(capturedInput.location, "Bihar");
  assert.equal(capturedInput.crop, "Wheat");
});

test("POST /api/ai/advisor rejects invalid payloads", async () => {
  const app = createApp({
    advisorService: {
      async getAdvisorResponse() {
        throw new Error("should not execute");
      },
    },
  });

  const response = await request(app).post("/api/ai/advisor").send({
    location: "Bihar",
    crop: "",
    query: "",
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /required/i);
});

test("POST /api/ai/advisor blocks unsafe non-farm harm requests", async () => {
  const app = createApp({
    advisorService: {
      async getAdvisorResponse() {
        throw new Error("should not execute");
      },
    },
  });

  const response = await request(app).post("/api/ai/advisor").send({
    location: "Bihar",
    crop: "Wheat",
    query: "How can I poison people using farm chemicals?",
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /safe crop and farm queries/i);
});
