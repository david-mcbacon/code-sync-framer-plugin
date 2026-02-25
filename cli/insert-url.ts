import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import pc from "picocolors";

export async function runInsertUrl(args: string[]) {
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

  const filePath = args.find((a) => !a.startsWith("--"));
  if (!filePath) {
    console.error(pc.red("Error: file path required"));
    console.error(
      pc.gray("Usage: framer-code-sync-cli insert-url <file-path>"),
    );
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

  const { connect, isCodeFileComponentExport } = await import("framer-api");
  const framer = await connect(projectUrl);

  try {
    const files = await framer.getCodeFiles();
    const file = files.find((f) => f.path === filePath);

    if (!file) {
      console.error(pc.red(`Error: file not found in Framer: ${filePath}`));
      console.error(
        pc.gray(`Run "framer-code-sync-cli list" to see all files`),
      );
      process.exit(1);
    }

    const componentExports = file.exports.filter(isCodeFileComponentExport);

    if (componentExports.length === 0) {
      console.error(
        pc.red(`No component exports found in: ${filePath}`),
      );
      process.exit(1);
    }

    for (const exp of componentExports) {
      console.log(`${pc.cyan(exp.name)}: ${exp.insertURL}`);
    }
  } finally {
    try {
      await framer.disconnect();
    } catch {
      // ignore
    }
  }
}
