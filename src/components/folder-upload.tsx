import React, { useState } from "react";
import { framer } from "framer-plugin";
import { withPermission } from "../utils/permission-utils";

export default function FolderUpload() {
  const [uploadState, setUploadState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const handleFolderUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    // Convert FileList to Array for easier processing
    const tsxFiles = Array.from(files).filter((file) =>
      file.name.endsWith(".tsx")
    );

    if (tsxFiles.length === 0) {
      console.log("No .tsx files found in the selected folder.");
      return;
    }

    try {
      // Load import replacement rules and ignored files saved in project data
      const [rules, ignored] = await Promise.all([
        loadImportReplacementRules(),
        loadIgnoredFiles(),
      ]);

      console.log("rules", rules);
      console.log("ignored", ignored);

      // Initialize upload state
      setUploadState("loading");
      setTotalFiles(tsxFiles.length);
      setUploadedCount(0);

      // Get all existing code files in Framer
      const existingFiles = await framer.getCodeFiles();
      const existingFileMap = new Map(
        existingFiles.map((file) => [file.path || file.name, file])
      );

      // PHASE 1: Create all files with dummy content
      type FramerCodeFile = {
        path?: string;
        name: string;
        setFileContent: (code: string) => Promise<unknown>;
      };
      const fileProcessingData: Array<{
        file: File;
        framerPath: string;
        existingFile?: FramerCodeFile;
        createdFile?: FramerCodeFile;
      }> = [];

      for (const file of tsxFiles) {
        try {
          const fullPath = file.webkitRelativePath || file.name;

          // Remove the first level folder (treat uploaded folder as root)
          const pathParts = fullPath.split("/");
          const framerPath =
            pathParts.length > 1 ? pathParts.slice(1).join("/") : pathParts[0];

          // Skip ignored files (match by filename or relative path)
          if (isIgnored(framerPath, ignored)) {
            continue;
          }

          // Check if file already exists
          const existingFile = existingFileMap.get(framerPath);

          if (existingFile) {
            // File exists, will update later
            fileProcessingData.push({ file, framerPath, existingFile });
          } else {
            // Create new file with dummy content
            const createdFile = await withPermission({
              permission: "createCodeFile",
              action: async () => {
                return await framer.createCodeFile(
                  framerPath,
                  "export default function Test() { return <div>Test</div> }"
                );
              },
            });
            fileProcessingData.push({ file, framerPath, createdFile });
          }
        } catch (error) {
          console.error(`Error in Phase 1 for file ${file.name}:`, error);
          setUploadState("error");
          return;
        }
      }

      // Update total files after filtering out ignored ones
      setTotalFiles(fileProcessingData.length);

      // PHASE 2: Replace dummy content with actual content
      const updatePromises = fileProcessingData.map(async (data) => {
        try {
          const { file, existingFile, createdFile } = data;

          // Read the actual file content
          const actualContent = await readFileContent(file);
          const framerPath = data.framerPath;
          const transformedContent = applyImportReplacements(
            actualContent,
            rules,
            framerPath
          );

          if (existingFile) {
            // Update existing file
            // await existingFile.setFileContent(actualContent);
            console.log("updating existing file", framerPath);
            await withPermission({
              permission: "CodeFile.setFileContent",
              action: async () => {
                return await existingFile.setFileContent(transformedContent);
              },
            });
          } else if (createdFile) {
            // Update newly created file
            console.log("updating newly created file", framerPath);
            await withPermission({
              permission: "CodeFile.setFileContent",
              action: async () => {
                return await createdFile.setFileContent(transformedContent);
              },
            });
          }

          // Update progress
          setUploadedCount((prev) => prev + 1);
        } catch (error) {
          console.error(`Error in Phase 2 for file ${data.file.name}:`, error);
          setUploadState("error");
          return;
        }
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Set success state
      setUploadState("success");

      // Reset to idle after showing success for 3 seconds
      setTimeout(() => {
        setUploadState("idle");
        setUploadedCount(0);
        setTotalFiles(0);
      }, 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadState("error");
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  type ImportReplacementRule = { search: string; bundlePath: string };

  const loadImportReplacementRules = async (): Promise<
    ImportReplacementRule[]
  > => {
    try {
      const raw = await framer.getPluginData("importReplacements");
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((r) => ({
          search: typeof r.search === "string" ? r.search.trim() : "",
          bundlePath:
            typeof r.bundlePath === "string" ? r.bundlePath.trim() : "",
        }))
        .filter((r) => r.search && r.bundlePath);
    } catch {
      return [];
    }
  };

  const loadIgnoredFiles = async (): Promise<string[]> => {
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

  const isIgnored = (framerPath: string, ignored: string[]): boolean => {
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

  const applyImportReplacements = (
    content: string,
    rules: ImportReplacementRule[],
    framerPath: string
  ): string => {
    if (!rules.length) return content;
    const fromDir = getDirname(normalizePath(framerPath));
    let output = content;
    for (const rule of rules) {
      const targetRootPath = stripLeadingDotSlash(
        normalizePath(rule.bundlePath)
      );
      const relative = getRelativePath(fromDir, targetRootPath);
      output = replaceImportSpecifier(output, rule.search, relative);
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
  const renderUploadStatus = () => {
    switch (uploadState) {
      case "loading":
        return (
          <div
            style={{
              marginTop: "10px",
              padding: "12px",
              backgroundColor: "#e3f2fd",
              border: "1px solid #2196f3",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #2196f3",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <span style={{ color: "#1976d2", fontWeight: "500" }}>
              Uploading files... {uploadedCount}/{totalFiles}
            </span>
            <div
              style={{
                flex: 1,
                height: "4px",
                backgroundColor: "#bbdefb",
                borderRadius: "2px",
                marginLeft: "10px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#2196f3",
                  borderRadius: "2px",
                  width: `${
                    totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0
                  }%`,
                  transition: "width 0.3s ease",
                }}
              ></div>
            </div>
          </div>
        );
      case "success":
        return (
          <div
            style={{
              marginTop: "10px",
              padding: "12px",
              backgroundColor: "#e8f5e8",
              border: "1px solid #4caf50",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                color: "#2e7d32",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              ✓
            </span>
            <span style={{ color: "#2e7d32", fontWeight: "500" }}>
              Successfully uploaded {uploadedCount} files to Framer!
            </span>
          </div>
        );
      case "error":
        return (
          <div
            style={{
              marginTop: "10px",
              padding: "12px",
              backgroundColor: "#ffebee",
              border: "1px solid #f44336",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  color: "#c62828",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                ✗
              </span>
              <span style={{ color: "#c62828", fontWeight: "500" }}>
                Upload failed. Please try again.
              </span>
            </div>
            <button
              onClick={() => setUploadState("idle")}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#d32f2f")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#f44336")
              }
            >
              Try Again
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ marginBottom: "20px", marginTop: "20px" }}>
      <h4>Upload Folder</h4>
      <p>Upload a folder containing .tsx files to sync with Framer.</p>
      <input
        type="file"
        // @ts-expect-error - webkitdirectory is not a valid attribute
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderUpload}
        disabled={uploadState === "loading"}
        style={{
          marginTop: "10px",
          cursor: uploadState === "loading" ? "not-allowed" : "pointer",
          width: "100%",
          opacity: uploadState === "loading" ? 0.6 : 1,
        }}
      />
      {renderUploadStatus()}

      {/* Add CSS animation for the loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
