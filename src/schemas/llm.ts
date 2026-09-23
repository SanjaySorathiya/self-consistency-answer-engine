import { z } from "zod";

export const CandidateAnswerSchema = z.object({
  answer: z.string(),
  key_points: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

export type CandidateAnswer = z.infer<typeof CandidateAnswerSchema>;

export const FinalAnswerSchema = z.object({
  final_answer: z.string(),
  agreements: z.array(z.string()),
  disagreements: z.array(z.string()),
  uncertainties: z.array(z.string()),
  candidates_used: z.array(z.enum(["openai", "anthropic", "gemini"])),
});

export type FinalAnswer = z.infer<typeof FinalAnswerSchema>;
