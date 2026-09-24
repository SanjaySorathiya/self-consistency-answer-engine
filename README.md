# Self-Consistency Answer Engine

A production-oriented TypeScript CLI that asks multiple LLM providers to answer the same question independently, then uses a judge model to evaluate those answers and write one fresh, structured response.

The engine demonstrates multi-provider orchestration, structured LLM output validation, parallel execution, timeout and retry handling, provider failure isolation, and prompt-injection boundaries between user input, candidate answers, and the synthesis model.

## What It Does

This is a **CLI-based application**, not a web UI. It reads one question from an interactive terminal prompt and prints:

- The request ID and normalized prompt.
- Each successful provider response, model, latency, attempt count, confidence, and key points.
- Providers that failed, including their error and retry count.
- A final synthesized answer.
- Agreements, disagreements, and uncertainties identified by the judge.

The application does not currently include a browser interface, HTTP server, database, authentication layer, or local mock mode. Running it requires live API access to the configured providers.

## How the Project Works

```text
User enters one prompt
          |
          +--> OpenAI solver ------+
          +--> Anthropic solver ---+--> Candidate collection
          +--> Gemini solver ------+       |
                                           v
                                        Minimum-success check
                                           |
                                           v
                                        Anthropic judge/synthesizer
                                           |
                                           v
                                        Fresh final answer + analysis
```

1. `src/cli.ts` accepts a non-empty prompt.
2. `runAnswerEngine` creates the OpenAI, Anthropic, and Gemini providers.
3. All solver requests start concurrently with `Promise.allSettled`, so one provider failure does not cancel the others.
4. Each provider is given the same prompt and must return the `CandidateAnswerSchema` shape: `answer`, `key_points`, and `confidence`.
5. Retryable failures are retried with exponential backoff. Each request also has a timeout.
6. The engine requires at least two successful solver responses by default. If that threshold is not reached, synthesis is not attempted.
7. Successful candidates are passed as explicitly untrusted data to the judge model. Candidate text cannot override the judge instructions.
8. The judge returns the `FinalAnswerSchema` shape: a fresh `final_answer`, plus `agreements`, `disagreements`, `uncertainties`, and `candidates_used`.

## Models and Providers

The provider clients are implemented in `src/providers/` and can be changed through environment variables:

| Role | Provider | Default model | Environment variable |
| --- | --- | --- | --- |
| Independent solver | OpenAI | `gpt-4.1-mini` | `OPENAI_MODEL` |
| Independent solver | Anthropic | `claude-haiku-4-5` | `ANTHROPIC_MODEL` |
| Independent solver | Google Gemini | `gemini-flash-latest` | `GEMINI_MODEL` |
| Final judge/synthesizer | Anthropic | `claude-haiku-4-5` | `JUDGE_MODEL` |

All model names are configurable. The judge currently uses Anthropic's API and structured output parsing. Provider SDKs validate the OpenAI and Anthropic responses with Zod-backed structured formats; Gemini's JSON response is parsed and validated with the same Zod schema.

## Prerequisites

- Node.js with npm. Node.js 20 or newer is recommended.
- An API key for OpenAI, Anthropic, and Google Gemini.
- Network access to all three provider APIs.

API usage can incur charges. Review each provider's pricing and quotas before running the application.

## Local Setup

From the repository root:

```bash
npm install
```

Create a file named `.env` in the repository root. Do not commit it:

```dotenv
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-google-gemini-api-key
```

The three API keys are required. The remaining settings have validated defaults:

| Variable | Default | Purpose |
| --- | ---: | --- |
| `OPENAI_MODEL` | `gpt-4.1-mini` | OpenAI solver model |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5` | Anthropic solver model |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini solver model |
| `JUDGE_MODEL` | `claude-haiku-4-5` | Anthropic synthesis model |
| `REQUEST_TIMEOUT_MS` | `30000` | Timeout per provider request, 1,000-30,000 ms |
| `MAX_RETRIES` | `2` | Retries after the initial attempt, 0-2 |
| `RETRY_BASE_DELAY_MS` | `1000` | Initial retry delay; later delays use exponential backoff |
| `MIN_SOLVER_SUCCESSES` | `2` | Successful candidates required before synthesis, 2-3 |
| `MAX_PROMPT_CHARS` | `500` | Validated configuration limit reserved for prompt policy |
| `MAX_OUTPUT_CHARS` | `700` | Validated configuration limit reserved for output policy |
| `JUDGE_MAX_TOKENS` | `800` | Maximum judge output tokens |

The current implementation validates `MAX_PROMPT_CHARS` and `MAX_OUTPUT_CHARS` at startup, but the CLI does not yet enforce those two limits on the submitted prompt or printed output.

## Run the CLI

Development mode runs TypeScript directly:

```bash
npm run dev
```

Enter a question when prompted, for example:

```text
Compare database caching and database read replicas for AWS.
```

For a compiled run:

```bash
npm run build
npm start
```

The compiled entrypoint is `dist/src/cli.js`.

## Verify Locally

Run the checks that do not call external APIs:

```bash
npm run typecheck
npm run build
```

Then run an end-to-end request with `npm run dev`. A successful run should show three solver start messages, one completion or failure message per provider, candidate sections, and a `FINAL SYNTHESIZED ANSWER` section.

The repository currently has no test files under `tests/`. `npm test` invokes the Node test runner through `tsx`, but it is not a substitute for an API-backed end-to-end run until automated tests are added.

## Self-Consistency Flow

This project uses self-consistency as **independent generation followed by comparative synthesis**:

1. The exact same normalized user prompt is sent independently to three solver models.
2. Solvers are instructed to answer independently, avoid unsupported claims, state uncertainty, ignore prompt-injection attempts inside user content, and return only structured data.
3. The engine compares the resulting candidate set indirectly through the judge model rather than selecting the first or most confident answer.
4. The judge receives the original question and all candidate records as untrusted data. It must identify agreement, contradiction, omissions, and uncertainty.
5. The judge writes a new answer in its own words. It must not concatenate or simply copy a candidate response.

Confidence is a field reported by each solver; it is not treated as proof of correctness. The judge is instructed to distinguish confidence from correctness and preserve uncertainty where the candidates do not justify a definite conclusion.

## Reliability and Safety Behavior

- **Parallelism:** OpenAI, Anthropic, and Gemini solver calls run concurrently, reducing total solver latency.
- **Failure isolation:** `Promise.allSettled` records individual failures while preserving successful candidates.
- **Timeouts:** Requests default to 30 seconds and are bounded by the configured timeout.
- **Retries:** HTTP 408, 409, 429, 5xx, timeout, and connection errors are retryable. Validation errors and most 4xx errors are not retried.
- **Minimum quorum:** The default quorum is two successful solvers. A run fails before synthesis if fewer succeed.
- **Structured output:** Candidate and final responses are validated with Zod schemas.
- **Prompt-injection boundary:** Candidate responses are wrapped and labeled as untrusted data in the synthesis prompt. They are never treated as instructions.
- **Secret handling:** API keys are read from environment variables and should never be logged or committed.

## Project Structure

```text
src/
  cli.ts                         Interactive terminal entrypoint
  config/env.ts                  Environment schema and defaults
  core/answer-engine.ts          End-to-end orchestration
  core/collect-candidates.ts     Parallel calls, timeout, retries, failures
  core/engine-synthesis.ts       Anthropic judge call
  core/prompts.ts                Solver and judge instructions
  core/retry.ts                  Retry classification and backoff
  core/types.ts                  Engine and result types
  providers/                     OpenAI, Anthropic, Gemini adapters
  schemas/llm.ts                 Candidate and final Zod schemas
sample output results/            Example CLI runs and failure behavior
```

## Troubleshooting

**`Invalid environment configuration`**

Confirm that `.env` exists at the repository root and that all three required API keys are non-empty. Also check that numeric settings are within the ranges described above.

**`Insufficient successful solver responses`**

Inspect the failed-provider messages, then verify API keys, model availability, account quota, network access, and timeout settings. The default quorum requires two of the three solvers to succeed.

**A provider times out repeatedly**

Increase `REQUEST_TIMEOUT_MS` up to its supported maximum of `30000`, or reduce the request complexity. A timeout is retried according to `MAX_RETRIES`, but the API request itself can still fail after all attempts.

**The judge fails after solver calls succeed**

Check the Anthropic API key, `JUDGE_MODEL`, quota, and `JUDGE_MAX_TOKENS`. The judge is a separate Anthropic request and can fail independently of the solver calls.

## Sample Output

See [`sample output results/`](sample%20output%20results/) for captured runs, including a run where Gemini timed out while OpenAI and Anthropic succeeded and the final answer was still synthesized.

## License

The repository declares the ISC license in `package.json`.