import { framer } from "framer-plugin";
import {
  CodeSyncConfig,
  ImportReplacementRule,
  StringReplacementRule,
} from "./types";
import { readFileContent, getUploadedRelativePath } from "./file-processing";

const CONFIG_CANDIDATE_NAMES = [
  "framer-code-sync.config.json",
  "framer-code-sync.config.jsonc",
];

export const loadConfigFromUpload = async (
  files: File[]
): Promise<CodeSyncConfig | null> => {
  try {
    const configFile = findConfigFile(files);
    if (!configFile) return null;
    const raw = await readFileContent(configFile);
    const parsed = parseConfigJson(raw);
    return sanitizeConfig(parsed);
  } catch (err) {
    console.warn("Failed to load config; proceeding with UI settings.", err);
    return null;
  }
};

const findConfigFile = (files: File[]): File | undefined => {
  // Treat uploaded folder's first segment as root, like code files
  return files.find((file) => {
    const relativeFromRoot = getUploadedRelativePath(file, true);
    return CONFIG_CANDIDATE_NAMES.includes(relativeFromRoot);
  });
};

const parseConfigJson = (raw: string): unknown => {
  // Support .json (strict). If .jsonc is used, perform a minimal comment strip.
  const stripped = stripJsonComments(raw);
  return JSON.parse(stripped);
};

const stripJsonComments = (input: string): string => {
  // Simple JSONC comment removal: removes // and /* */ outside of strings.
  // This is not a fully compliant parser but works for typical config files.
  let output = "";
  let inString = false;
  let stringChar: string | null = null;
  let escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const next = i + 1 < input.length ? input[i + 1] : "";

    if (!inString) {
      // Line comment
      if (c === "/" && next === "/") {
        while (i < input.length && input[i] !== "\n") i++;
        continue;
      }
      // Block comment
      if (c === "/" && next === "*") {
        i += 2;
        while (i < input.length) {
          if (
            input[i] === "*" &&
            i + 1 < input.length &&
            input[i + 1] === "/"
          ) {
            i++;
            break;
          }
          i++;
        }
        continue;
      }
      if (c === '"' || c === "'") {
        inString = true;
        stringChar = c;
        output += c;
        continue;
      }
      output += c;
      continue;
    }

    // Inside string
    if (escaped) {
      output += c;
      escaped = false;
      continue;
    }
    if (c === "\\") {
      output += c;
      escaped = true;
      continue;
    }
    if (c === stringChar) {
      inString = false;
      stringChar = null;
      output += c;
      continue;
    }
    output += c;
  }
  return output;
};

const sanitizeConfig = (raw: unknown): CodeSyncConfig => {
  const out: CodeSyncConfig = {};
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.version === "number") out.version = obj.version;
    if (Array.isArray(obj.importReplacements)) {
      out.importReplacements = obj.importReplacements
        .map((r) => {
          if (!r || typeof r !== "object") return { find: "", replace: "" };
          const rec = r as Record<string, unknown>;
          const find = typeof rec.find === "string" ? rec.find.trim() : "";
          const replace =
            typeof rec.replace === "string" ? rec.replace.trim() : "";
          return { find, replace };
        })
        .filter((r) => r.find && r.replace);
    }
    if (Array.isArray(obj.ignoredFiles)) {
      out.ignoredFiles = obj.ignoredFiles
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .map((s) => s.replace(/\\/g, "/"))
        .map((s) => s.replace(/^\.?\//, ""))
        .filter(Boolean) as string[];
    }
    if (Array.isArray(obj.stringReplacements)) {
      out.stringReplacements = obj.stringReplacements
        .map((rule) => {
          if (!rule || typeof rule !== "object") return null;
          const rec = rule as Record<string, unknown>;
          const find = typeof rec.find === "string" ? rec.find : "";
          const replace = typeof rec.replace === "string" ? rec.replace : "";
          return find ? { find, replace } : null;
        })
        .filter(Boolean) as StringReplacementRule[];
    }
  }
  return out;
};

export const mergeImportReplacementRules = (
  baseRules: ImportReplacementRule[],
  overrideRules: ImportReplacementRule[]
): ImportReplacementRule[] => {
  const map = new Map<string, string>();
  for (const r of baseRules) {
    if (r.find && r.replace) map.set(r.find, r.replace);
  }
  for (const r of overrideRules) {
    if (r.find && r.replace) map.set(r.find, r.replace);
  }
  return Array.from(map.entries()).map(([find, replace]) => ({
    find,
    replace,
  }));
};

export const mergeIgnoredFiles = (
  baseIgnored: string[],
  overrideIgnored: string[]
): string[] => {
  const set = new Set<string>();
  for (const s of baseIgnored) if (s) set.add(s);
  for (const s of overrideIgnored) if (s) set.add(s);
  return Array.from(set);
};

export const loadImportReplacementRules = async (): Promise<
  ImportReplacementRule[]
> => {
  try {
    const raw = await framer.getPluginData("importReplacements");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((r) => ({
        find: typeof r.find === "string" ? r.find.trim() : "",
        replace: typeof r.replace === "string" ? r.replace.trim() : "",
      }))
      .filter((r) => r.find && r.replace);
  } catch {
    return [];
  }
};

export const loadIgnoredFiles = async (): Promise<string[]> => {
  try {
    const raw = await framer.getPluginData("ignoredFiles");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((s) => (typeof s === "string" ? s.trim() : ""))
      .map((s) => s.replace(/\\/g, "/"))
      .map((s) => s.replace(/^\.?\//, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
};

export const loadEnvReplacementSelection = async (): Promise<string | null> => {
  try {
    const value = await framer.getPluginData("envReplacementTarget");
    if (!value) return null;
    return value;
  } catch {
    return null;
  }
};

export const loadStringReplacementRules = async (): Promise<
  StringReplacementRule[]
> => {
  try {
    const raw = await framer.getPluginData("stringReplacements");
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((rule) => {
        if (!rule || typeof rule !== "object") return null;
        const rec = rule as Record<string, unknown>;
        const find = typeof rec.find === "string" ? rec.find : "";
        const replace = typeof rec.replace === "string" ? rec.replace : "";
        return find ? { find, replace } : null;
      })
      .filter(Boolean) as StringReplacementRule[];
  } catch {
    return [];
  }
};
