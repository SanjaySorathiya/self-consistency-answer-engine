import type { SolverProvider } from "../providers/types.js";
import { RetryExhaustedError, withRetry } from "./retry.js";
import type {
  CandidateCollection,
  CandidateFailure,
  CandidateSuccess,
} from "./types.js";

export interface CandidateCollectionOptions {
  maxRetries: number;
  retryBaseDelayMs: number;
  requestTimeoutMs: number;
}

function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`Provider request timed out after ${timeoutMs} ms.`);
      error.name = "TimeoutError";
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof RetryExhaustedError) {
    const last = error.lastError;
    return last instanceof Error ? last.message : String(last);
  }

  return error instanceof Error ? error.message : String(error);
}

export async function collectCandidates(
  prompt: string,
  providers: readonly SolverProvider[],
  options: CandidateCollectionOptions,
): Promise<CandidateCollection> {
  const startedAt = performance.now();

  const results = await Promise.allSettled(
    providers.map(async (provider): Promise<CandidateSuccess> => {
      const providerStartedAt = performance.now();

      console.log(`Starting ${provider.name} (${provider.model})...`);

      const retryResult = await withRetry(
        () => withTimeout(provider.generate(prompt), options.requestTimeoutMs),
        options.maxRetries,
        options.retryBaseDelayMs,
      );

      const latencyMs = Math.round(performance.now() - providerStartedAt);

      const candidate = {
        provider: provider.name,
        model: provider.model,
        answer: retryResult.value,
        attempts: retryResult.attempts,
        latencyMs,
      };

      console.log(
        `Completed ${provider.name} in ${latencyMs} ms ` +
          `(${retryResult.attempts} attempt(s)).`,
      );

      return candidate;
    }),
  );

  const successful: CandidateSuccess[] = [];
  const failed: CandidateFailure[] = [];

  results.forEach((result, index) => {
    const provider = providers[index];

    if (!provider) {
      return;
    }

    if (result.status === "fulfilled") {
      successful.push(result.value);

      return;
    }

    const attempts =
      result.reason instanceof RetryExhaustedError
        ? result.reason.attempts
        : options.maxRetries + 1;

    failed.push({
      provider: provider.name,
      model: provider.model,
      attempts,
      latencyMs: 0,
      error: getErrorMessage(result.reason),
    });

    console.error(
      `Failed ${provider.name} after ${attempts} attempt(s): ` +
        getErrorMessage(result.reason),
    );
  });

  return {
    successful,
    failed,
    totalLatencyMs: Math.round(performance.now() - startedAt),
  };
}
