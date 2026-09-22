import type { CandidateResult } from "./types.js";
import { createProviders } from "../providers/index.js";

export async function collectCandidates(
  prompt: string,
): Promise<CandidateResult[]> {
  const providers = createProviders();
  const results: CandidateResult[] = [];

  for (const provider of providers) {
    console.log(`Calling ${provider.name} (${provider.model})...`);
    const answer = await provider.generate(prompt);
    results.push({
      provider: provider.name,
      model: provider.model,
      answer,
    });
  }

  return results;
}
