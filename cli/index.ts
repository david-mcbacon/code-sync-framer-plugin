#!/usr/bin/env node
import dotenv from "dotenv";
import path from "node:path";
import pc from "picocolors";

// Load .env from current working directory
dotenv.config({ path: path.join(process.cwd(), ".env") });

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
${pc.bold("framer-code-sync-cli")} - Push local .tsx files to Framer

${pc.bold("Usage:")}
  framer-code-sync-cli <command> [options]

${pc.bold("Commands:")}
  push        Push changed .tsx files to Framer

${pc.bold("Push Options:")}
  --force     Push all files, ignore last push time
  --yes       Skip confirmation prompt

${pc.bold("Setup:")}
  Create .env in your project root with:
    FRAMER_PROJECT_URL=https://framer.com/projects/...

  Optionally add framer-code-sync.config.json for transforms.
`);
}

async function main() {
  if (!command || command === "-h" || command === "--help") {
    printHelp();
    process.exit(0);
  }

  if (command === "push" || command === "-p" || command === "--push") {
    const { runPush } = await import("./push.js");
    const pushArgs = command === "push" ? args.slice(1) : args.slice(1);
    await runPush(pushArgs);
  } else {
    console.error(pc.red(`Unknown command: ${command}`));
    printHelp();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(pc.red("Fatal error:"), err);
  process.exit(1);
});
