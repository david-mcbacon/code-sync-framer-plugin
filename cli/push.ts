#!/usr/bin/env node
import dotenv from "dotenv";
import path from "node:path";
import readline from "node:readline";
import pc from "picocolors";
import {
  scanTsxFiles,
  filterChangedFiles,
  readLastPushTime,
  saveLastPushTime,
  type ScannedFile,
} from "./lib/file-scanner.js";
import { loadConfig } from "./lib/transform.js";
import { pushFiles } from "./lib/framer-push.js";

// Load .env from current working directory
dotenv.config({ path: path.join(process.cwd(), ".env") });

const LAST_PUSH_FILE = path.join(process.cwd(), ".framer-push-time");

// Helper function to create custom hex color
function hexColor(hex: string): (text: string) => string {
  // Remove # if present
  const cleanHex = hex.replace("#", "");
  // Convert hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  // Return function that applies ANSI color code
  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

// Parse CLI args
const args = process.argv.slice(2);
const forceAll = args.includes("--force");
const skipConfirm = args.includes("--yes");

async function main() {
  const projectUrl = process.env["FRAMER_PROJECT_URL"];
  if (!projectUrl) {
    console.error(pc.red("Error: FRAMER_PROJECT_URL not found"));
    console.error(pc.gray("Create .env in current directory with:"));
    console.error(pc.gray("  FRAMER_PROJECT_URL=https://framer.com/projects/..."));
    process.exit(1);
  }

  // Load config
  const { config, found: configFound } = loadConfig();
  if (!configFound) {
    console.log(
      pc.yellow("No framer-code-sync.config.json found, using defaults")
    );
  } else {
    console.log(
      pc.cyan(
        `Loaded config with ${pc.bold(
          config.importReplacements.length
        )} import rules`
      )
    );
  }

  // Scan files
  const allFiles = scanTsxFiles(config.ignoredFiles);
  console.log(pc.cyan(`Found ${pc.bold(allFiles.length)} .tsx files total`));

  // Filter changed files
  let filesToPush: ScannedFile[];
  if (forceAll) {
    console.log(pc.yellow("Force mode: pushing all files"));
    filesToPush = allFiles;
  } else {
    const lastPushTime = readLastPushTime(LAST_PUSH_FILE);
    if (lastPushTime) {
      console.log(
        pc.gray(`Last push: ${new Date(lastPushTime).toLocaleString()}`)
      );
    } else {
      console.log(pc.yellow("No previous push recorded, will push all files"));
    }
    filesToPush = filterChangedFiles(allFiles, lastPushTime);
  }

  if (filesToPush.length === 0) {
    console.log(pc.green("\n✓ No files to push. All files are up to date."));
    process.exit(0);
  }

  // Check which files exist in Framer to determine create vs update
  console.log(pc.cyan("Checking existing files in Framer..."));
  const { connect } = await import("framer-api");
  const framer = await connect(projectUrl);
  let existingFilePaths: Set<string>;
  try {
    const existingFiles = await framer.getCodeFiles();
    existingFilePaths = new Set(existingFiles.map((f) => f.path));
  } finally {
    await framer.disconnect();
  }

  // Categorize files
  const filesToCreate = filesToPush.filter(
    (f) => !existingFilePaths.has(f.framerPath)
  );
  const filesToUpdate = filesToPush.filter((f) =>
    existingFilePaths.has(f.framerPath)
  );

  // Show files to push
  const accentColor = hexColor("FFFFFF");
  console.log(`\n${accentColor("=".repeat(50))}`);
  console.log(`Files to push (${filesToPush.length}):`);
  console.log("=".repeat(50));

  // Show files to create (green)
  for (const file of filesToCreate) {
    const date = new Date(file.mtime).toLocaleString();
    console.log(
      `  ${pc.bold(pc.green(file.framerPath))} ${pc.gray(
        `(modified: ${date})`
      )} ${pc.gray("(new)")}`
    );
  }

  // Show files to update (yellow)
  for (const file of filesToUpdate) {
    const date = new Date(file.mtime).toLocaleString();
    console.log(
      `  ${pc.bold(pc.yellow(file.framerPath))} ${pc.gray(
        `(modified: ${date})`
      )}`
    );
  }
  console.log(accentColor("=".repeat(50)));

  // Confirm
  if (!skipConfirm) {
    const confirmed = await askConfirmation(
      pc.yellow("\nProceed with push? (Y/Enter to confirm): ")
    );
    if (!confirmed) {
      console.log(pc.red("Aborted."));
      process.exit(0);
    }
  }

  // Push files
  console.log(pc.cyan("\nPushing files...\n"));
  const result = await pushFiles(
    projectUrl,
    filesToPush,
    config.importReplacements,
    (msg) => console.log(msg)
  );

  // Save last push time
  const now = Date.now();
  saveLastPushTime(LAST_PUSH_FILE, now);

  // Summary
  console.log(`\n${pc.bold(pc.green("=".repeat(50)))}`);
  console.log(pc.bold(pc.green("Push complete!")));
  console.log(
    `  ${pc.green("Created:")} ${pc.bold(
      pc.green(result.created.length.toString())
    )}`
  );
  console.log(
    `  ${pc.blue("Updated:")} ${pc.bold(
      pc.blue(result.updated.length.toString())
    )}`
  );
  if (result.errors.length > 0) {
    console.log(
      `  ${pc.red("Errors:")} ${pc.bold(
        pc.red(result.errors.length.toString())
      )}`
    );
    for (const err of result.errors) {
      console.log(
        `    ${pc.red("-")} ${pc.red(err.path)}: ${pc.red(err.error)}`
      );
    }
  }
  console.log(pc.green("=".repeat(50)));
  process.exit(0);
}

async function askConfirmation(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "" || normalized === "y" || normalized === "yes");
    });
  });
}

main().catch((err) => {
  console.error(pc.red("Fatal error:"), err);
  process.exit(1);
});
