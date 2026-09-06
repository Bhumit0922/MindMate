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
 * 1. Groq (Ultra-fast free LLMs like groq/compound-mini, gpt-oss-120b, qwen3.8-27b)
 * 2. Google Gemini (Free tier with gemini-3.6-flash)
 * 3. OpenRouter (Access to diverse models)
 * 4. OpenAI (Disabled by default if no credits; set ENABLE_OPENAI="true" to enable)
 */
function getProviders(): ProviderOption[] {
  const providers: ProviderOption[] = [];

  // 1. Groq (Free tier available at console.groq.com)
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "groq/compound-mini",
    });
    // Add backup high-capacity Groq model in case default hits rate limits
    providers.push({
      name: "Groq (Backup)",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      model: "openai/gpt-oss-120b",
    });
  }

  // 2. Google Gemini (Free tier available at aistudio.google.com)
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Google Gemini",
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    });
  }

  // 3. OpenRouter (Supports free models at openrouter.ai)
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "OpenRouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct",
    });
  }

  // 4. OpenAI (Only attempted if explicitly enabled, preventing zero-credit crashes)
  if (process.env.ENABLE_OPENAI === "true" && process.env.OPENAI_API_KEY) {
    providers.push({
      name: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
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
        timeout: 12000, // 12-second timeout per provider to prevent hanging
        maxRetries: 1,
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
