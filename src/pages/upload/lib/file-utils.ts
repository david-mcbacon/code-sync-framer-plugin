export const isIgnored = (framerPath: string, ignored: string[]): boolean => {
  if (!ignored.length) return false;
  const normalizedPath = framerPath.replace(/\\/g, "/").replace(/^\.?\//, "");
  const filename = normalizedPath.split("/").pop() || normalizedPath;
  return ignored.some((entryRaw) => {
    const entry = entryRaw.replace(/\\/g, "/").replace(/^\.?\//, "");
    if (!entry) return false;
    if (entry.includes("/")) {
      // treat as relative path match from project root (after stripping upload top folder)
      return normalizedPath === entry;
    }
    // treat as filename-only match
    return filename === entry;
  });
};
