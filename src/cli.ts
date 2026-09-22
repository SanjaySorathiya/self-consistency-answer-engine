import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { collectCandidates } from "./core/collect-candidates.js";

const rl = createInterface({
  input,
  output,
});

function printHeader(): void {
  console.log();
  console.log("=".repeat(80));
  console.log("             SELF-CONSISTENCY ANSWER ENGINE");
  console.log("             Milestone 3 - Multi-Model simple");
  console.log("=".repeat(80));
  console.log();
}

function printDivider(): void {
  console.log();
  console.log("-".repeat(80));
}

async function main(): Promise<void> {
  printHeader();

  const prompt = await rl.question("Enter your question or prompt:\n> ");

  const normalizedPrompt = prompt.trim();

  if (!normalizedPrompt) {
    throw new Error("Prompt cannot be empty.");
  }

  console.log();
  console.log("USER PROMPT");
  console.log("===========");
  console.log(normalizedPrompt);

  printDivider();

  const candidates = await collectCandidates(normalizedPrompt);

  printDivider();

  console.log("INDEPENDENT MODEL RESPONSES");

  for (const candidate of candidates) {
    printDivider();

    console.log(`PROVIDER: ${candidate.provider.toUpperCase()} | MODEL: ${candidate.model}`);
    console.log();

    console.log("ANSWER");
    console.log("------");
    console.log(candidate.answer.answer);
    console.log();

    console.log("KEY POINTS");
    console.log("----------");

    for (const point of candidate.answer.key_points) {
      console.log(`- ${point}`);
    }

    console.log();
    console.log(`CONFIDENCE: ${candidate.answer.confidence}`);
  }

  printDivider();

  console.log(`SUCCESSFUL PROVIDERS: ${candidates.length}`);
  console.log();
  console.log("Milestone 3 complete:");
  console.log("The same prompt was processed by OpenAI, Anthropic.");
  // console.log("Final synthesis will be added in the next milestone.");
}

try {
  await main();
} catch (error) {
  console.error();
  console.error(
    "Application error:",
    error instanceof Error ? error.message : String(error),
  );

  process.exitCode = 1;
} finally {
  rl.close();
}
