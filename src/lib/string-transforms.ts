import { ImportReplacementRule, StringReplacementRule } from "./types";

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

const isRegexPattern = (pattern: string): boolean =>
  pattern.startsWith("/") && pattern.lastIndexOf("/") > 0;

const buildRegexFromPattern = (pattern: string): RegExp | null => {
  const lastSlash = pattern.lastIndexOf("/");
  if (lastSlash <= 0) return null;
  const body = pattern.slice(1, lastSlash);
  const flags = pattern.slice(lastSlash + 1);

  try {
    return new RegExp(body, flags || "g");
  } catch {
    return null;
  }
};

export const applyStringReplacements = (
  content: string,
  replacements: StringReplacementRule[]
): string => {
  if (!replacements.length) return content;

  return replacements.reduce((acc, rule) => {
    if (!rule.find) return acc;

    if (isRegexPattern(rule.find)) {
      const regex = buildRegexFromPattern(rule.find);
      if (!regex) return acc;
      return acc.replace(regex, rule.replace ?? "");
    }

    const escapedFind = rule.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const literalRegex = new RegExp(escapedFind, "g");
    return acc.replace(literalRegex, rule.replace ?? "");
  }, content);
};

export const applyEnvReplacement = (
  content: string,
  replacementRules: Array<{ from: string; to: string }>
): string => {
  if (!replacementRules.length) return content;

  for (const rule of replacementRules) {
    const { from, to } = rule;

    // Escape special regex characters in environment names
    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Pattern 1: ENV.something.from -> ENV.something.to
    content = content.replace(
      new RegExp(
        `\\bENV\\.([a-zA-Z_$][a-zA-Z0-9_$]*)\\.${escapedFrom}\\b`,
        "g"
      ),
      `ENV.$1.${to}`
    );

    // Pattern 2: ENV["something"]["from"] or ENV['something']['from']
    content = content.replace(
      new RegExp(
        `\\bENV\\[(['"])([a-zA-Z_$][a-zA-Z0-9_$]*)\\1\\]\\[(['"])${escapedFrom}\\3\\]`,
        "g"
      ),
      `ENV[$1$2$1][$3${to}$3]`
    );
  }

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
