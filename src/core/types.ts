import type { CandidateAnswer } from "../schemas/llm.js";
import type { ProviderName } from "../providers/types.js";

export interface CandidateResult {
  provider: ProviderName;
  model: string;
  answer: CandidateAnswer;
}
