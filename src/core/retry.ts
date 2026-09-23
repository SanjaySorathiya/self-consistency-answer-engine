// 401 / 403 / 400
//     ↓
// NO retry

// 408 / 409 / 429
//     ↓
// retry

// 500+
//     ↓
// retry

// timeout / connection
//     ↓
// retry

export interface RetryResult<T> {
  value: T;
  attempts: number;
}

export class RetryExhaustedError extends Error {
  readonly attempts: number;
  readonly lastError: unknown;

  constructor(message: string, attempts: number, lastError: unknown) {
    super(message);

    this.name = "RetryExhaustedError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

function getObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function getStatusCode(error: unknown): number | undefined {
  const object = getObject(error);
  const status = object?.["status"];

  return typeof status === "number" ? status : undefined;
}

export function isRetryableError(error: unknown): boolean {
  const object = getObject(error);

  if (typeof object?.["retryable"] === "boolean") {
    return object["retryable"] as boolean;
  }

  if (error instanceof SyntaxError || object?.["name"] === "ZodError") {
    return false;
  }

  const status = getStatusCode(error);

  if (status !== undefined) {
    return status === 408 || status === 409 || status === 429 || status >= 500;
  }

  const name = typeof object?.["name"] === "string" ? object["name"] : "";
  const message = error instanceof Error ? error.message : String(error);
  const retryableText = `${name} ${message}`.toLowerCase();

  return (
    retryableText.includes("timeout") ||
    retryableText.includes("connection") ||
    retryableText.includes("fetch failed") ||
    retryableText.includes("econnreset") ||
    retryableText.includes("etimedout") ||
    retryableText.includes("enotfound")
  );
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number,
): Promise<RetryResult<T>> {
  let attempts = 0;
  let lastError: unknown;

  while (attempts <= maxRetries) {
    attempts++;
    
    try {
      const value = await operation();

      return {
        value,
        attempts,
      };
    } catch (error) {
      lastError = error;

      const canRetry = attempts <= maxRetries && isRetryableError(error);

      if (!canRetry) {
        throw new RetryExhaustedError(
          `Operation failed after ${attempts} attempt(s).`,
          attempts,
          error,
        );
      }

      const delay = baseDelayMs * Math.pow(2, attempts - 1);
      await sleep(delay);
    }
  }

  throw new RetryExhaustedError(
    `Operation failed after ${attempts} attempt(s).`,
    attempts,
    lastError,
  );
}
