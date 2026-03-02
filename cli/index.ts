#!/usr/bin/env node
import path from "node:path";
import pc from "picocolors";

// Note: Environment-specific .env files are loaded in push.ts based on --env flag

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
${pc.bold("framer-code-sync-cli")} - Push local .tsx files to Framer

${pc.bold("Usage:")}
  framer-code-sync-cli <command> [options]

${pc.bold("Commands:")}
  push        Push changed .tsx files to Framer
  list        List all files in Framer project
  get         Output content of a file in Framer
  insert-url  Output insertURL(s) for components in a Framer file

${pc.bold("Push Options:")}
  --force     Push all files, ignore last push time
  --yes       Skip confirmation prompt
  --env       Environment for ENV.tsx replacement (development|staging|production)
              Default: development

${pc.bold("Setup:")}
  Create environment-specific .env files in your project root:
    .env              (for development)
    .env.staging      (for staging)
    .env.production   (for production)
  
  Each file should contain:
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
    await runPush(args.slice(1));
  } else if (command === "list" || command === "-l" || command === "--list") {
    const { runList } = await import("./list.js");
    await runList(args.slice(1));
  } else if (command === "get") {
    const { runGet } = await import("./get.js");
    await runGet(args.slice(1));
  } else if (command === "insert-url") {
    const { runInsertUrl } = await import("./insert-url.js");
    await runInsertUrl(args.slice(1));
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
