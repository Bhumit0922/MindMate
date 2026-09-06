import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export interface AIFallbackConfig {
  messages: ChatCompletionMessageParam[];
  maxTokens?: number;
  temperature?: number;
}

interface ProviderOption {
  name: string;
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
}

/**
 * Gets the list of available providers configured via environment variables in priority order.
 * Priority:
 * 1. OpenAI (Primary)
 * 2. Groq (Free, ultra-fast Llama-3)
 * 3. Gemini (Google free tier via OpenAI-compatible endpoint)
 * 4. OpenRouter (Access to free/low-cost models)
 */
function getProviders(): ProviderOption[] {
  const providers: ProviderOption[] = [];

  // 1. OpenAI
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  }

  // 2. Groq (Free tier available at console.groq.com)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });
  }

  // 3. Google Gemini (Free tier available at aistudio.google.com via OpenAI-compatible endpoint)
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Google Gemini",
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });
  }

  // 4. OpenRouter (Supports free models at openrouter.ai)
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "OpenRouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free",
    });
  }

  return providers;
}

/**
 * Executes a chat completion with automatic fallback across providers.
 * If Provider 1 runs out of credits, hits rate limits, or fails, Provider 2 is automatically attempted, and so on.
 */
export async function getAIFallbackCompletion({
  messages,
  maxTokens,
  temperature = 0.7,
}: AIFallbackConfig): Promise<{ content: string; provider: string; model: string }> {
  const providers = getProviders();

  if (providers.length === 0) {
    throw new Error(
      "No AI API keys configured. Please add at least one of OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY to your environment variables."
    );
  }

  const errors: Array<{ provider: string; error: string }> = [];

  for (const provider of providers) {
    try {
      console.log(`[AI Fallback] Attempting completion with provider: ${provider.name} (${provider.model})`);

      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      });

      const response = await client.chat.completions.create({
        model: provider.model,
        messages,
        temperature,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log(`[AI Fallback] Successfully generated response with ${provider.name}`);
        return {
          content,
          provider: provider.name,
          model: provider.model,
        };
      }

      throw new Error(`Empty response returned from ${provider.name}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(
        `[AI Fallback] Provider ${provider.name} failed (${errorMessage}). Trying next provider...`
      );
      errors.push({
        provider: provider.name,
        error: errorMessage,
      });
    }
  }

  // If all providers failed:
  const failureSummary = errors
    .map((e) => `${e.provider}: ${e.error}`)
    .join(" | ");
  throw new Error(`All AI providers failed. Summary: ${failureSummary}`);
}
