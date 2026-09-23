import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),

  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-haiku-4-5"),
  GEMINI_MODEL: z.string().min(1).default("gemini-flash-latest"),

  MAX_PROMPT_CHARS: z.coerce.number().int().min(200).max(500).default(500),
  MAX_OUTPUT_CHARS: z.coerce.number().int().min(200).max(700).default(700),

  REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .max(30000)
    .default(30000),

  MAX_RETRIES: z.coerce.number().int().min(0).max(2).default(2),
  RETRY_BASE_DELAY_MS: z.coerce.number().int().min(0).max(5000).default(1000),
  MIN_SOLVER_SUCCESSES: z.coerce.number().int().min(2).max(3).default(2),
  JUDGE_MODEL: z.string().min(1).default("claude-haiku-4-5"),
  JUDGE_MAX_TOKENS: z.coerce.number().int().min(200).max(800).default(800),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(result.error.format());
  process.exit(1);
}

export const env = result.data;
