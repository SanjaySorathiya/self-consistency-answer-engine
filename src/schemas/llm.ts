import { z } from "zod";

export const CandidateAnswerSchema = z.object({
  answer: z.string(),
  key_points: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

export type CandidateAnswer = z.infer<typeof CandidateAnswerSchema>;
