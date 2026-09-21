import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  // OPENAI_MODEL: z.string().default(env.OPENAI_MODEL),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration.");
  console.error(result.error.format());
  process.exit(1);
}

export const env = result.data;
