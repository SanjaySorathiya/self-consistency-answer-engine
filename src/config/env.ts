import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),

  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4.5"),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(result.error.format());
  process.exit(1);
}

export const env = result.data;
