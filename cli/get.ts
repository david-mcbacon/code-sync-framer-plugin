import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pc from "picocolors";

export async function runGet(args: string[]) {
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

  // First positional arg (non-flag)
  const filePath = args.find((a) => !a.startsWith("--"));
  if (!filePath) {
    console.error(pc.red("Error: file path required"));
    console.error(pc.gray("Usage: framer-code-sync-cli get <file-path>"));
    process.exit(1);
  }

  const envFileName =
    envTarget === "development" ? ".env" : `.env.${envTarget}`;
  const envFilePath = path.join(process.cwd(), envFileName);

  if (!fs.existsSync(envFilePath)) {
    console.error(pc.red(`Error: ${envFileName} not found`));
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

  const { connect } = await import("framer-api");
  const framer = await connect(projectUrl);

  try {
    const files = await framer.getCodeFiles();
    const file = files.find((f) => f.path === filePath);

    if (!file) {
      console.error(pc.red(`Error: file not found in Framer: ${filePath}`));
      console.error(pc.gray(`Run "framer-code-sync-cli list" to see all files`));
      process.exit(1);
    }

    const versions = await file.getVersions();
    if (versions.length === 0) {
      console.error(pc.red("Error: no versions found for this file"));
      process.exit(1);
    }

    // Latest version is first
    const content = await versions[0].getContent();
    process.stdout.write(content);
  } finally {
    try {
      await framer.disconnect();
    } catch {
      // ignore
    }
  }
}
