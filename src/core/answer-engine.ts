import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { createProviders } from "../providers/index.js";
import { collectCandidates } from "./collect-candidates.js";
import { synthesizeAnswer } from "./engine-synthesis.js";

export async function runAnswerEngine(prompt: string) {
  const requestId = randomUUID();
  const normalizedPrompt = prompt.trim();

  if (!normalizedPrompt) {
    throw new Error("Prompt cannot be empty.");
  }

  const providers = createProviders();
  const candidates = await collectCandidates(normalizedPrompt, providers, 
    {
    maxRetries: env.MAX_RETRIES,
    retryBaseDelayMs: env.RETRY_BASE_DELAY_MS,
    requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
  }
);

  if (candidates.successful.length < env.MIN_SOLVER_SUCCESSES) {
    throw new Error(
      `Insufficient successful solver responses. ` +
        `Received ${candidates.successful.length}; ` +
        `minimum required is ${env.MIN_SOLVER_SUCCESSES}. ` +
        `Failed providers: ${candidates.failed.map((failure) => `${failure.provider}: ${failure.error}`).join("; ")}`,
    );
  }

  const finalAnswer = await synthesizeAnswer(
    normalizedPrompt,
    candidates.successful,
  );
  
  return {
    requestId,
    prompt: normalizedPrompt,
    candidates: candidates.successful,
    failures: candidates.failed,
    totalLatencyMs: candidates.totalLatencyMs,
    final: finalAnswer,
  };
}
