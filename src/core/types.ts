import type { CandidateAnswer } from "../schemas/llm.js";
import type { ProviderName } from "../providers/types.js";

export interface CandidateSuccess {
  provider: ProviderName;
  model: string;
  answer: CandidateAnswer;
  attempts: number;
  latencyMs: number;
}

export interface CandidateFailure {
  provider: ProviderName;
  model: string;
  attempts: number;
  latencyMs: number;
  error: string;
}

export interface CandidateCollection {
  successful: CandidateSuccess[];
  failed: CandidateFailure[];
  totalLatencyMs: number;
}
