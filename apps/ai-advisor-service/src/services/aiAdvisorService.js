import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

import env from "../config/env.js";
import { buildAdvisorPrompt } from "../lib/prompt.js";
import { parseAdvisorResponse } from "../lib/responseParser.js";
import TranslationService from "./translationService.js";

const textDecoder = new TextDecoder();

const getResponseBodyString = async (body) => {
  if (!body) return "";
  if (typeof body.transformToString === "function") {
    return body.transformToString();
  }
  if (body instanceof Uint8Array) {
    return textDecoder.decode(body);
  }
  if (Buffer.isBuffer(body)) {
    return body.toString("utf8");
  }
  return String(body);
};

const isTitanModel = (modelId) =>
  String(modelId || "")
    .toLowerCase()
    .startsWith("amazon.titan");

export class AICropAdvisorService {
  constructor({
    bedrockClient,
    translationService,
    modelId = env.bedrockModelId,
    fallbackModelId = env.bedrockFallbackModelId,
    region = env.awsRegion,
  } = {}) {
    this.bedrockClient = bedrockClient || new BedrockRuntimeClient({ region });
    this.translationService = translationService || new TranslationService({ region });
    this.modelId = modelId;
    this.fallbackModelId = fallbackModelId;
  }

  async getAdvisorResponse({ location, crop, query, language }) {
    const shouldTranslateWithAws = Boolean(language?.translateSupported && language.code !== "en");
    const normalizedQuery = shouldTranslateWithAws
      ? await this.translationService.translateText(query, {
          sourceLanguageCode: "auto",
          targetLanguageCode: "en",
        })
      : query;

    const prompt = buildAdvisorPrompt({
      location,
      crop,
      query: normalizedQuery,
      responseLanguageLabel: shouldTranslateWithAws ? "English" : language?.label || "English",
    });

    const rawOutput = await this.generateModelOutput(prompt);
    const structured = parseAdvisorResponse(rawOutput);

    return shouldTranslateWithAws
      ? this.translationService.translateAdvisorResponse(structured, language.code)
      : structured;
  }

  async generateModelOutput(prompt) {
    try {
      return await this.invokeModel(this.modelId, prompt);
    } catch (primaryError) {
      if (!this.fallbackModelId || this.fallbackModelId === this.modelId) {
        throw primaryError;
      }
      return this.invokeModel(this.fallbackModelId, prompt);
    }
  }

  async invokeModel(modelId, prompt) {
    if (isTitanModel(modelId)) {
      return this.invokeTitanModel(modelId, prompt);
    }
    return this.invokeClaudeModel(modelId, prompt);
  }

  async invokeClaudeModel(modelId, prompt) {
    const response = await this.bedrockClient.send(
      new ConverseCommand({
        modelId,
        system: [
          {
            text: "Return only strict JSON for an Indian agriculture crop advisor.",
          },
        ],
        messages: [
          {
            role: "user",
            content: [{ text: prompt }],
          },
        ],
        inferenceConfig: {
          temperature: 0.2,
          maxTokens: 900,
          topP: 0.9,
        },
      }),
    );

    const text = response?.output?.message?.content
      ?.map((item) => item?.text || "")
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Bedrock Claude returned an empty response.");
    }

    return text;
  }

  async invokeTitanModel(modelId, prompt) {
    const response = await this.bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          inputText: `User: ${prompt}\nBot:`,
          textGenerationConfig: {
            temperature: 0.2,
            topP: 0.9,
            maxTokenCount: 900,
            stopSequences: [],
          },
        }),
      }),
    );

    const rawBody = await getResponseBodyString(response.body);
    const parsedBody = JSON.parse(rawBody);
    const text = String(parsedBody?.results?.[0]?.outputText || "").trim();
    if (!text) {
      throw new Error("Bedrock Titan returned an empty response.");
    }
    return text;
  }
}

export default AICropAdvisorService;
