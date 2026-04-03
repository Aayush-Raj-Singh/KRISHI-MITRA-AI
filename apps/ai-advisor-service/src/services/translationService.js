import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

import env from "../config/env.js";

export class TranslationService {
  constructor({ client, region } = {}) {
    this.client = client || new TranslateClient({ region: region || env.awsRegion });
  }

  async translateText(text, { sourceLanguageCode = "auto", targetLanguageCode = "en" } = {}) {
    const normalized = String(text || "").trim();
    if (!normalized || targetLanguageCode === "en") {
      return normalized;
    }

    const response = await this.client.send(
      new TranslateTextCommand({
        Text: normalized,
        SourceLanguageCode: sourceLanguageCode,
        TargetLanguageCode: targetLanguageCode,
      }),
    );

    return String(response.TranslatedText || normalized).trim() || normalized;
  }

  async translateAdvisorResponse(payload, targetLanguageCode) {
    if (!payload || !targetLanguageCode || targetLanguageCode === "en") {
      return payload;
    }

    const [advice, steps, precautions] = await Promise.all([
      this.translateText(payload.advice, { targetLanguageCode }),
      Promise.all(payload.steps.map((step) => this.translateText(step, { targetLanguageCode }))),
      Promise.all(
        payload.precautions.map((item) => this.translateText(item, { targetLanguageCode })),
      ),
    ]);

    return { advice, steps, precautions };
  }
}

export default TranslationService;
