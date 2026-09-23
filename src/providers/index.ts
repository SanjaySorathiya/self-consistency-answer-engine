import type { SolverProvider } from "./types.js";

import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";

export function createProviders(): SolverProvider[] {
  return [new OpenAIProvider(), new AnthropicProvider(), new GeminiProvider()];
}
