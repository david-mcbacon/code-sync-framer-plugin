import fs from "node:fs";
import path from "node:path";

export interface ScannedFile {
  absolutePath: string;
  relativePath: string; // relative to frameship-components folder
  framerPath: string; // path in Framer (same as relativePath)
  mtime: number; // modification time in ms
}

export interface ScanResult {
  files: ScannedFile[];
  changedFiles: ScannedFile[];
}

export function getComponentsDir(): string {
  return process.cwd();
}

export function scanTsxFiles(ignoredFiles: string[] = []): ScannedFile[] {
  const files: ScannedFile[] = [];
  const ignoredSet = new Set(
    ignoredFiles.map((f) => f.replace(/^\.\//, "").replace(/\\/g, "/"))
  );

  function scanDir(dir: string, relativeBase: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath, path.join(relativeBase, entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
        const relativePath = path
          .join(relativeBase, entry.name)
          .replace(/\\/g, "/");

        // Skip ignored files
        if (ignoredSet.has(relativePath)) {
          continue;
        }

        const stat = fs.statSync(fullPath);
        files.push({
          absolutePath: fullPath,
          relativePath,
          framerPath: relativePath,
          mtime: stat.mtimeMs,
        });
      }
    }
  }

  scanDir(getComponentsDir());
  return files;
}

export function filterChangedFiles(
  files: ScannedFile[],
  lastPushTime: number | null
): ScannedFile[] {
  if (lastPushTime === null) {
    return files; // First push, all files are "changed"
  }
  return files.filter((f) => f.mtime > lastPushTime);
}

export function readLastPushTime(filePath: string): number | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8").trim();
    const timestamp = parseInt(content, 10);
    return isNaN(timestamp) ? null : timestamp;
  } catch {
    return null;
  }
}

export function saveLastPushTime(filePath: string, timestamp: number): void {
  fs.writeFileSync(filePath, timestamp.toString(), "utf-8");
}

interface FramerFilesCache {
  files: string[];
  lastUpdated: number;
}

export function readFramerFilesCache(filePath: string): Set<string> | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const cache: FramerFilesCache = JSON.parse(content);
    if (cache && Array.isArray(cache.files)) {
      return new Set(cache.files);
    }
    return null;
  } catch {
    return null;
  }
}

export function saveFramerFilesCache(filePath: string, filePaths: string[]): void {
  const cache: FramerFilesCache = {
    files: filePaths,
    lastUpdated: Date.now(),
  };
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), "utf-8");
}

export function updateFramerFilesCache(
  filePath: string,
  newFilePaths: string[]
): void {
  const existingCache = readFramerFilesCache(filePath);
  if (existingCache) {
    // Merge new files into existing cache
    const merged = new Set([...existingCache, ...newFilePaths]);
    saveFramerFilesCache(filePath, Array.from(merged));
  } else {
    // Create new cache with just the new files
    saveFramerFilesCache(filePath, newFilePaths);
  }
}
