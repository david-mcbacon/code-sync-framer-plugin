import fs from "node:fs";
import type { ScannedFile } from "./file-scanner.js";
import { transformContent, type ImportReplacementRule } from "./transform.js";

const DUMMY_CONTENT = `export default function Test() { return <div>Test</div> }`;
const CONCURRENCY = 10; // Max parallel requests

export interface PushResult {
  created: string[];
  updated: string[];
  errors: Array<{ path: string; error: string }>;
}

interface CodeFile {
  id: string;
  path: string;
  setFileContent(code: string): Promise<CodeFile>;
}

export interface Framer {
  getCodeFiles(): Promise<readonly CodeFile[]>;
  createCodeFile(name: string, code: string): Promise<CodeFile>;
  disconnect(): Promise<void>;
}

async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array(Math.min(limit, items.length))
    .fill(null)
    .map(() => worker());
  await Promise.all(workers);
  return results;
}

export async function pushFiles(
  newFiles: ScannedFile[],
  existingFiles: ScannedFile[],
  importRules: ImportReplacementRule[],
  onProgress: (message: string) => void,
  envTarget: string = "staging",
  framer?: Framer,
): Promise<PushResult> {
  const result: PushResult = { created: [], updated: [], errors: [] };

  if (!framer) {
    throw new Error("Framer connection is required");
  }

  // Phase 1: Create new files with dummy content (parallel)
  if (newFiles.length > 0) {
    onProgress(`Creating ${newFiles.length} new files...`);
    const createdFiles = await runWithConcurrency(
      newFiles,
      async (file) => {
        try {
          const created = await framer.createCodeFile(
            file.framerPath,
            DUMMY_CONTENT,
          );
          onProgress(`  Created: ${file.framerPath}`);
          return { file, created, error: null };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          onProgress(`  Error creating ${file.framerPath}: ${msg}`);
          return { file, created: null, error: msg };
        }
      },
      CONCURRENCY,
    );

    // Phase 2: Update new files with real content (parallel)
    const successfulCreates = createdFiles.filter((r) => r.created !== null);
    if (successfulCreates.length > 0) {
      onProgress(
        `Updating ${successfulCreates.length} new files with content...`,
      );
      await runWithConcurrency(
        successfulCreates,
        async ({ file, created }) => {
          try {
            const rawContent = fs.readFileSync(file.absolutePath, "utf-8");
            const transformed = transformContent(
              rawContent,
              importRules,
              file.framerPath,
              envTarget,
            );
            await created!.setFileContent(transformed);
            result.created.push(file.framerPath);
            onProgress(`  Updated: ${file.framerPath}`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("waitForComponentLoader timeout")) {
              result.created.push(file.framerPath);
              onProgress(`  Updated: ${file.framerPath}`);
            } else {
              result.errors.push({ path: file.framerPath, error: msg });
              onProgress(`  Error updating ${file.framerPath}: ${msg}`);
            }
          }
        },
        CONCURRENCY,
      );
    }

    // Record creation errors
    for (const { file, error } of createdFiles) {
      if (error) result.errors.push({ path: file.framerPath, error });
    }
  }

  // Phase 3: Update existing files (parallel)
  if (existingFiles.length > 0) {
    onProgress("Fetching existing code files...");
    const codeFiles = await framer.getCodeFiles();
    const codeFileMap = new Map<string, CodeFile>();
    for (const cf of codeFiles) {
      codeFileMap.set(cf.path, cf);
    }

    onProgress(`Updating ${existingFiles.length} existing files...`);
    await runWithConcurrency(
      existingFiles,
      async (file) => {
        const codeFile = codeFileMap.get(file.framerPath);
        if (!codeFile) {
          const msg = `File not found in Framer (skipped to avoid duplicate): ${file.framerPath}`;
          onProgress(`  Warning: ${msg}`);
          result.errors.push({ path: file.framerPath, error: msg });
          return;
        }
        try {
          const rawContent = fs.readFileSync(file.absolutePath, "utf-8");
          const transformed = transformContent(
            rawContent,
            importRules,
            file.framerPath,
            envTarget,
          );
          await codeFile.setFileContent(transformed);
          result.updated.push(file.framerPath);
          onProgress(`  Updated: ${file.framerPath}`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("waitForComponentLoader timeout")) {
            result.updated.push(file.framerPath);
            onProgress(`  Updated: ${file.framerPath}`);
          } else {
            result.errors.push({ path: file.framerPath, error: msg });
            onProgress(`  Error: ${file.framerPath}: ${msg}`);
          }
        }
      },
      CONCURRENCY,
    );
  }

  return result;
}
