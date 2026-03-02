import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pc from "picocolors";

export async function runList(args: string[]) {
  let envTarget = "development";
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

  dotenv.config({ path: envFilePath });

  const projectUrl = process.env["FRAMER_PROJECT_URL"];
  if (!projectUrl) {
    console.error(
      pc.red(`Error: FRAMER_PROJECT_URL not found in ${envFileName}`),
    );
    process.exit(1);
  }

  console.log(pc.cyan(`Fetching files from Framer (${envTarget})...`));

  const { connect } = await import("framer-api");
  const framer = await connect(projectUrl);

  let files: readonly { path: string }[];
  try {
    files = await framer.getCodeFiles();
  } finally {
    try {
      await framer.disconnect();
    } catch {
      // ignore
    }
  }

  if (files.length === 0) {
    console.log(pc.yellow("No files found in Framer project."));
    return;
  }

  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  console.log(`\n${pc.bold(`Files in Framer (${sorted.length}):`)}`);
  console.log("=".repeat(50));
  for (const file of sorted) {
    console.log(`  ${pc.cyan(file.path)}`);
  }
  console.log("=".repeat(50));
}
