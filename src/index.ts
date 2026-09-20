import "dotenv/config";
import OpenAI from "openai";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import readline from "readline";

const openai = new OpenAI();

async function startCLI() {
  const rl = createInterface({ input, output });

  console.log(":----------------------------------------------------:");
  console.log("  Welcome to your AI SELF-CONSISTENCY ANSWER ENGINE");
  console.log("  Type your question and press Enter.");
  console.log("  Type 'exit' or 'quit' to stop.");
  console.log(":----------------------------------------------------:\n");

  try {
    while (true) {
      const userInput = await rl.question("\nAsk a question: ");

      // Check if user wants to exit
      if (userInput.toLowerCase().trim() === "exit" || userInput.toLowerCase().trim() === "quit") {
        console.log("TC Goodbye!");
        break;
      }

      if (!userInput.trim()) {
        console.log("Please enter a valid question.");
        continue;
      }

      process.stdout.write("Thinking...");

      try {
        // Call OpenAI Chat Completions API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Fast and cost-effective model
          messages: [{ role: "user", content: userInput }],
        });

        // Clear "Thinking..." line and print response
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        const choice = completion.choices?.[0];
        const reply =
        typeof choice?.message?.content === "string"
            ? choice.message.content
            : "No text response received.";

        console.log(`\nAI Response:\n${reply}`);
        } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("\nError communicating with OpenAI API:", message);
        }
    }
  } finally {
    rl.close();
  }
}

startCLI();