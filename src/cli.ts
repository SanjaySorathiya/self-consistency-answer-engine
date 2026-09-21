import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { OpenAIProvider } from "./providers/openai.js";

const rl = createInterface({
  input,
  output,
});

function printHeader(): void {
  console.log();
  console.log("=".repeat(72));
  console.log("        SELF-CONSISTENCY ANSWER ENGINE");
  console.log("        Milestone 2 - OpenAI");
  console.log("=".repeat(72));
  console.log();
}

async function main(): Promise<void> {
  printHeader();

  const prompt = await rl.question("Enter your question or prompt:\n> ");

  const normalizedPrompt = prompt.trim();

  if (!normalizedPrompt) {
    throw new Error("Prompt cannot be empty.");
  }

  const provider = new OpenAIProvider();

  console.log();
  console.log(`Calling ${provider.name} (${provider.model})...`);

  const result = await provider.generate(normalizedPrompt);

  console.log();
  console.log("MODEL ANSWER");
  console.log("============");
  console.log(result.answer);

  console.log();
  console.log("KEY POINTS");
  console.log("==========");

  for (const point of result.key_points) {
    console.log(`- ${point}`);
  }

  console.log();
  console.log(`Confidence: ${result.confidence}`);
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
