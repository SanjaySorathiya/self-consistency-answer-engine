import type { CandidateAnswer } from "../schemas/llm.js";

export type ProviderName = "openai";

export interface SolverProvider {
  readonly name: ProviderName;
  readonly model: string;

  generate(prompt: string): Promise<CandidateAnswer>;
}
