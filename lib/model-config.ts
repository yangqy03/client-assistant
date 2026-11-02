import { createOpenAI } from "@ai-sdk/openai";
import { createGateway, type LanguageModel } from "ai";
export type ModelConfig = {
  provider: "openai" | "gateway";
  modelId: string;
  model: LanguageModel;
};
export function configuredModel(
  env: Record<string, string | undefined> = process.env,
): ModelConfig | null {
  // The user's direct OpenAI connection takes precedence. No credential fallback.
  const provider = env.MODEL_PROVIDER || "openai";
  if (provider === "openai") {
    if (!env.OPENAI_API_KEY?.trim()) return null;
    const modelId = env.OPENAI_MODEL?.trim() || "gpt-6.1-sol";
    const openai = createOpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: "https://api.openai.com/v1",
    });
    return { provider: "openai", modelId, model: openai.responses(modelId) };
  }
  if (provider === "gateway") {
    if (!env.AI_GATEWAY_API_KEY?.trim() || !env.AI_MODEL?.trim()) return null;
    return {
      provider: "gateway",
      modelId: env.AI_MODEL,
      model: createGateway({ apiKey: env.AI_GATEWAY_API_KEY })(env.AI_MODEL),
    };
  }
  return null;
}
