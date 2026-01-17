import fs from "node:fs";
import path from "node:path";

export interface ImportReplacementRule {
  find: string;
  replace: string;
}

export interface CodeSyncConfig {
  version: number;
  importReplacements: ImportReplacementRule[];
  ignoredFiles: string[];
}

const CONFIG_PATH = path.resolve(
  import.meta.dirname,
  "../../../framer-components/src/frameship-components/framer-code-sync.config.json"
);

export function loadConfig(): CodeSyncConfig {
  try {
    const content = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return { version: 1, importReplacements: [], ignoredFiles: [] };
  }
}

export function transformContent(
  content: string,
  rules: ImportReplacementRule[],
  framerPath: string
): string {
  let output = content;
  output = applyImportReplacements(output, rules, framerPath);
  output = ensureTsxExtensions(output);
  return output;
}

function applyImportReplacements(
  content: string,
  rules: ImportReplacementRule[],
  framerPath: string
): string {
  if (!rules.length) return content;

  const fromDir = getDirname(normalizePath(framerPath));
  let output = content;

  for (const rule of rules) {
    const replaceValue = rule.replace;
    let finalReplace: string;

    // If replace value is a URL, use as-is
    if (
      replaceValue.startsWith("http://") ||
      replaceValue.startsWith("https://")
    ) {
      finalReplace = replaceValue;
    } else {
      // For local paths, calculate relative path
      const targetRootPath = stripLeadingDotSlash(normalizePath(replaceValue));
      finalReplace = getRelativePath(fromDir, targetRootPath);
    }

    output = replaceImportSpecifier(output, rule.find, finalReplace);
  }
  return output;
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+/, "/");
}

function stripLeadingDotSlash(p: string): string {
  return p.startsWith("./") ? p.slice(2) : p.startsWith(".\\") ? p.slice(2) : p;
}

function getDirname(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx === -1 ? "" : p.slice(0, idx);
}

function getRelativePath(fromDir: string, toPath: string): string {
  const fromParts = fromDir ? fromDir.split("/").filter(Boolean) : [];
  const toParts = toPath.split("/").filter(Boolean);

  let i = 0;
  while (
    i < fromParts.length &&
    i < toParts.length &&
    fromParts[i] === toParts[i]
  ) {
    i++;
  }

  const upSegments = fromParts.length - i;
  const downParts = toParts.slice(i);

  const up = upSegments > 0 ? Array(upSegments).fill("..").join("/") : "";
  const down = downParts.join("/");

  let rel = up && down ? `${up}/${down}` : up || down;
  if (!rel.startsWith("../") && !rel.startsWith("./")) {
    rel = `./${rel}`;
  }
  return rel || "./";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceImportSpecifier(
  content: string,
  searchSpecifier: string,
  replacement: string
): string {
  const esc = escapeRegExp(searchSpecifier);

  // Pattern 1: import {...} from 'specifier'
  const fromPattern = new RegExp(`from\\s+(["'])${esc}\\1`, "g");
  content = content.replace(
    fromPattern,
    (_m, quote: string) => `from ${quote}${replacement}${quote}`
  );

  // Pattern 2: side-effect import: import 'specifier'
  const sePattern = new RegExp(`(^|[^\\w])import\\s+(["'])${esc}\\2`, "g");
  content = content.replace(
    sePattern,
    (_m, prefix: string, quote: string) =>
      `${prefix}import ${quote}${replacement}${quote}`
  );

  return content;
}

function ensureTsxExtensions(content: string): string {
  // Match import statements with relative paths (starting with . or ..)
  const importPattern = /(from\s+|import\s+)(["'])(\.\.[^"']*|\.\/[^"']*)\2/g;

  return content.replace(importPattern, (match, prefix, quote, importPath) => {
    // Skip if already has extension
    if (/\.(tsx|ts|jsx|js|css)$/.test(importPath)) {
      return match;
    }
    return `${prefix}${quote}${importPath}.tsx${quote}`;
  });
}
