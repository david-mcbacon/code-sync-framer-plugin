import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import dotenv from "dotenv";
import pc from "picocolors";
import {
  scanTsxFiles,
  filterChangedFiles,
  readLastPushTime,
  saveLastPushTime,
  readFramerFilesCache,
  saveFramerFilesCache,
  updateFramerFilesCache,
  type ScannedFile,
} from "./lib/file-scanner.js";
import { loadConfig } from "./lib/transform.js";
import { pushFiles } from "./lib/framer-push.js";

const CACHE_DIR = path.join(process.cwd(), ".framer-code-sync-cli");

function getCacheFilePath(envTarget: string, baseName: string): string {
  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // For default environment (development), use base name without suffix
  // For other environments, add suffix
  const fileName =
    envTarget === "development" ? baseName : `${baseName}.${envTarget}`;

  return path.join(CACHE_DIR, fileName);
}

function hexColor(hex: string): (text: string) => string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return (text: string) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

export async function runPush(args: string[]) {
  const forceAll = args.includes("--force");
  const skipConfirm = args.includes("--yes");
  const refreshCache = args.includes("--refresh") || args.includes("--refetch");

  // Parse --env or --environment argument
  let envTarget = "development"; // default
  const envIndex = args.findIndex(
    (arg) => arg === "--env" || arg === "--environment",
  );
  if (envIndex !== -1 && envIndex + 1 < args.length) {
    const envValue = args[envIndex + 1];
    const validEnvs = ["development", "staging", "production"];
    if (validEnvs.includes(envValue)) {
      envTarget = envValue;
    } else {
      console.error(
        pc.red(
          `Error: Invalid environment "${envValue}". Must be one of: ${validEnvs.join(", ")}`,
        ),
      );
      process.exit(1);
    }
  }

  // Load environment-specific .env file
  const envFileName =
    envTarget === "development" ? ".env" : `.env.${envTarget}`;
  const envFilePath = path.join(process.cwd(), envFileName);

  if (!fs.existsSync(envFilePath)) {
    console.error(pc.red(`Error: ${envFileName} not found`));
    console.error(pc.gray(`Create ${envFileName} in current directory with:`));
    console.error(
      pc.gray("  FRAMER_PROJECT_URL=https://framer.com/projects/..."),
    );
    process.exit(1);
  }

  // Load the environment-specific .env file
  dotenv.config({ path: envFilePath });

  // Get environment-specific cache file paths
  const LAST_PUSH_FILE = getCacheFilePath(envTarget, ".framer-push-time");
  const FRAMER_FILES_CACHE = getCacheFilePath(envTarget, ".framer-files.json");

  const projectUrl = process.env["FRAMER_PROJECT_URL"];
  if (!projectUrl) {
    console.error(
      pc.red(`Error: FRAMER_PROJECT_URL not found in ${envFileName}`),
    );
    console.error(pc.gray(`Ensure ${envFileName} contains:`));
    console.error(
      pc.gray("  FRAMER_PROJECT_URL=https://framer.com/projects/..."),
    );
    process.exit(1);
  }

  // Load config
  const { config, found: configFound } = loadConfig();
  if (!configFound) {
    console.log(
      pc.yellow("No framer-code-sync.config.json found, using defaults"),
    );
  } else {
    console.log(
      pc.cyan(
        `Loaded config with ${pc.bold(
          config.importReplacements.length,
        )} import rules`,
      ),
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
        pc.gray(`Last push: ${new Date(lastPushTime).toLocaleString()}`),
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
  let existingFilePaths: Set<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let framer: any = null;

  // Try to load from cache first (unless refresh is requested)
  if (!refreshCache) {
    const cachedFiles = readFramerFilesCache(FRAMER_FILES_CACHE);
    if (cachedFiles) {
      console.log(pc.cyan("Using cached Framer file structure..."));
      existingFilePaths = cachedFiles;
    } else {
      // Cache doesn't exist, fetch from Framer
      console.log(pc.cyan("Cache not found. Fetching files from Framer..."));
      const { connect } = await import("framer-api");
      framer = await connect(projectUrl);
      try {
        const existingFiles = await framer.getCodeFiles();
        existingFilePaths = new Set(
          existingFiles.map((f: { path: string }) => f.path),
        );
        saveFramerFilesCache(FRAMER_FILES_CACHE, Array.from(existingFilePaths));
        console.log(pc.green(`Cached ${existingFilePaths.size} files`));
      } catch (err) {
        await framer.disconnect();
        throw err;
      }
    }
  } else {
    // Refresh flag set, fetch from Framer
    console.log(pc.cyan("Refreshing cache from Framer..."));
    const { connect } = await import("framer-api");
    framer = await connect(projectUrl);
    try {
      const existingFiles = await framer.getCodeFiles();
      existingFilePaths = new Set(
        existingFiles.map((f: { path: string }) => f.path),
      );
      saveFramerFilesCache(FRAMER_FILES_CACHE, Array.from(existingFilePaths));
      console.log(pc.green(`Cached ${existingFilePaths.size} files`));
    } catch (err) {
      await framer.disconnect();
      throw err;
    }
  }

  // Categorize files
  const filesToCreate = filesToPush.filter(
    (f) => !existingFilePaths.has(f.framerPath),
  );
  const filesToUpdate = filesToPush.filter((f) =>
    existingFilePaths.has(f.framerPath),
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
        `(modified: ${date})`,
      )} ${pc.gray("(new)")}`,
    );
  }

  // Show files to update (yellow)
  for (const file of filesToUpdate) {
    const date = new Date(file.mtime).toLocaleString();
    console.log(
      `  ${pc.bold(pc.yellow(file.framerPath))} ${pc.gray(
        `(modified: ${date})`,
      )}`,
    );
  }
  console.log(accentColor("=".repeat(50)));

  // Confirm
  if (!skipConfirm) {
    const confirmed = await askConfirmation(
      pc.yellow("\nProceed with push? (Y/Enter to confirm): "),
    );
    if (!confirmed) {
      console.log(pc.red("Aborted."));
      // Disconnect if we have a connection
      if (framer) {
        try {
          await framer.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      }
      process.exit(0);
    }
  }

  // If we don't have a connection yet (used cache), connect now for push
  if (!framer) {
    console.log(pc.cyan("Connecting to Framer for push..."));
    const { connect } = await import("framer-api");
    framer = await connect(projectUrl);
  }

  // Push files
  console.log(pc.cyan("\nPushing files...\n"));
  console.log(pc.gray(`Environment: ${pc.bold(envTarget)}`));
  const result = await pushFiles(
    projectUrl,
    filesToPush,
    config.importReplacements,
    (msg) => console.log(msg),
    envTarget,
    framer,
  );

  // Disconnect after push
  try {
    await framer.disconnect();
  } catch (err) {
    console.error(pc.gray(`Disconnect error (ignored): ${err}`));
  }

  // Update cache with newly created files
  if (result.created.length > 0) {
    updateFramerFilesCache(FRAMER_FILES_CACHE, result.created);
  }

  // Save last push time
  const now = Date.now();
  saveLastPushTime(LAST_PUSH_FILE, now);

  // Summary
  console.log(`\n${pc.bold(pc.green("=".repeat(50)))}`);
  console.log(pc.bold(pc.green("Push complete!")));
  console.log(
    `  ${pc.green("Created:")} ${pc.bold(
      pc.green(result.created.length.toString()),
    )}`,
  );
  console.log(
    `  ${pc.blue("Updated:")} ${pc.bold(
      pc.blue(result.updated.length.toString()),
    )}`,
  );
  if (result.errors.length > 0) {
    console.log(
      `  ${pc.red("Errors:")} ${pc.bold(
        pc.red(result.errors.length.toString()),
      )}`,
    );
    for (const err of result.errors) {
      console.log(
        `    ${pc.red("-")} ${pc.red(err.path)}: ${pc.red(err.error)}`,
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
