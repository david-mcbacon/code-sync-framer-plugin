import { ImportReplacementRule } from "./types";

export const applyImportReplacements = (
  content: string,
  rules: ImportReplacementRule[],
  framerPath: string
): string => {
  if (!rules.length) return content;
  const fromDir = getDirname(normalizePath(framerPath));
  let output = content;
  for (const rule of rules) {
    const replaceValue = rule.replace;
    let finalReplace: string;

    // If replace value is a URL (starts with http:// or https://), use it as-is
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
};

const normalizePath = (p: string): string =>
  p.replace(/\\/g, "/").replace(/\/+/, "/");

const stripLeadingDotSlash = (p: string): string =>
  p.startsWith("./") ? p.slice(2) : p.startsWith(".\\") ? p.slice(2) : p;

const getDirname = (p: string): string => {
  const idx = p.lastIndexOf("/");
  return idx === -1 ? "" : p.slice(0, idx);
};

const getRelativePath = (fromDir: string, toPath: string): string => {
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
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceImportSpecifier = (
  content: string,
  searchSpecifier: string,
  replacement: string
): string => {
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
};

export const applyEnvReplacement = (content: string): string => {
  // Replace ENV.property.development with ENV.property.production
  // Pattern 1: ENV.something.development
  content = content.replace(
    /\bENV\.([a-zA-Z_$][a-zA-Z0-9_$]*)\.development\b/g,
    "ENV.$1.production"
  );

  // Pattern 2: ENV["something"]["development"] or ENV['something']['development']
  content = content.replace(
    /\bENV\[(['"])([a-zA-Z_$][a-zA-Z0-9_$]*)\1\]\[(['"])development\3\]/g,
    "ENV[$1$2$1][$3production$3]"
  );

  return content;
};

export const ensureTsxExtensions = (content: string): string => {
  // Match import statements with relative paths (starting with . or ..)
  // Captures: from "path" or from 'path' or import "path" or import 'path'
  const importPattern = /(from\s+|import\s+)(["'])(\.\.[^"']*|\.\/[^"']*)\2/g;

  return content.replace(importPattern, (match, prefix, quote, path) => {
    // Skip if already has .tsx, .ts, .jsx, .js, or .css extension
    if (/\.(tsx|ts|jsx|js|css)$/.test(path)) {
      return match;
    }

    // Add .tsx extension
    return `${prefix}${quote}${path}.tsx${quote}`;
  });
};
