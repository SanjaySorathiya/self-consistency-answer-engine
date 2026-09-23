import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { runAnswerEngine } from "./core/answer-engine.js";

const rl = createInterface({
  input,
  output,
});

function divider(): void {
  console.log("\n" + "=".repeat(80));
}

function printCandidate(candidate: {
  provider: string;
  model: string;
  attempts: number;
  latencyMs: number;
  answer: {
    answer: string;
    key_points: string[];
    confidence: "low" | "medium" | "high";
  };
}): void {
  divider();

  console.log(`PROVIDER : ${candidate.provider.toUpperCase()}`);
  console.log(`MODEL    : ${candidate.model}`);
  console.log(`LATENCY  : ${candidate.latencyMs} ms`);
  console.log(`ATTEMPTS : ${candidate.attempts}`);
  console.log(`CONFIDENCE: ${candidate.answer.confidence}`);
  console.log("\nANSWER");
  console.log("------");
  console.log(candidate.answer.answer);
  console.log("\nKEY POINTS");
  console.log("----------");

  for (const point of candidate.answer.key_points) {
    console.log(`- ${point}`);
  }
}

async function main(): Promise<void> {
  divider();
  console.log("\nSELF-CONSISTENCY ANSWER ENGINE");
  console.log("Milestone 4 - Multi-model synthesis");
  divider();

  const prompt = await rl.question("Enter your question or prompt:\n> ");

  if (!prompt.trim()) {
    throw new Error("Prompt cannot be empty.");
  }

  console.log("\nRunning independent solvers...");
  const result = await runAnswerEngine(prompt);
  divider();
  console.log("REQUEST");
  console.log("-------");
  console.log(result.requestId);
  console.log("\nPROMPT");
  console.log("------");
  console.log(result.prompt);
  divider();
  console.log("INDEPENDENT MODEL RESPONSES");

  for (const candidate of result.candidates) {
    printCandidate(candidate);
  }

  if (result.failures.length > 0) {
    divider();
    console.log("FAILED PROVIDERS");

    for (const failure of result.failures) {
      console.log(`\n${failure.provider}`);
      console.log(`Model: ${failure.model}`);
      console.log(`Attempts: ${failure.attempts}`);
      console.log(`Error: ${failure.error}`);
    }
  }

  divider();
  console.log("FINAL SYNTHESIZED ANSWER");
  console.log("\n" + result.final.final_answer);

  divider();
  console.log("AGREEMENTS");

  for (const item of result.final.agreements) {
    console.log(`- ${item}`);
  }

  divider();
  console.log("DISAGREEMENTS");

  if (result.final.disagreements.length === 0) {
    console.log("None explicitly identified.");
  }

  for (const item of result.final.disagreements) {
    console.log(`- ${item}`);
  }

  divider();
  console.log("UNCERTAINTIES");

  if (result.final.uncertainties.length === 0) {
    console.log("None explicitly identified.");
  }

  for (const item of result.final.uncertainties) {
    console.log(`- ${item}`);
  }

  divider();
  console.log(`Total solver orchestration time: ${result.totalLatencyMs} ms`);
}

try {
  await main();
} catch (error) {
  console.error("\nApplication error:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  rl.close();
}
