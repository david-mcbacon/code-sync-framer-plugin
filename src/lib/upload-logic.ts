import { framer } from "framer-plugin";
import { withPermission } from "../utils/permission-utils";
import { CodeSyncConfig, FramerCodeFile, FileProcessingData } from "./types";
import { readFileContent, getUploadedRelativePath } from "./file-processing";
import {
  loadConfigFromUpload,
  loadImportReplacementRules,
  loadIgnoredFiles,
  loadEnvReplacementSetting,
  mergeImportReplacementRules,
  mergeIgnoredFiles,
} from "./config-loader";
import {
  applyImportReplacements,
  applyEnvReplacement,
  ensureTsxExtensions,
} from "./string-transforms";
import { isIgnored } from "./file-utils";

export const handleFolderUpload = async (
  files: FileList | null,
  setUploadState: (state: "idle" | "loading" | "success" | "error") => void,
  setTotalFiles: (count: number) => void,
  setUploadedCount: (count: number) => void
): Promise<void> => {
  if (!files) return;

  // Convert FileList to Array for easier processing
  const allFiles = Array.from(files);

  // Optionally load a config file from the uploaded folder, e.g. framer-code-sync.config.json
  const config = await loadConfigFromUpload(allFiles);

  // Filter only .tsx files to upload
  const tsxFiles = allFiles.filter((file) => file.name.endsWith(".tsx"));

  if (tsxFiles.length === 0) {
    console.log("No .tsx files found in the selected folder.");
    return;
  }

  try {
    // Load import replacement rules, ignored files, and env replacement setting saved in project data
    const [uiRules, uiIgnored, uiEnvReplacementEnabled] = await Promise.all([
      loadImportReplacementRules(),
      loadIgnoredFiles(),
      loadEnvReplacementSetting(),
    ]);

    // Merge UI settings with config (config takes precedence)
    const mergedRules = mergeImportReplacementRules(
      uiRules,
      config?.importReplacements || []
    );
    const mergedIgnored = mergeIgnoredFiles(
      uiIgnored,
      config?.ignoredFiles || []
    );
    const mergedEnvReplacementEnabled =
      typeof config?.envReplacement === "boolean"
        ? config.envReplacement
        : uiEnvReplacementEnabled;

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
    const fileProcessingData: FileProcessingData[] = [];

    for (const file of tsxFiles) {
      try {
        const framerPath = getUploadedRelativePath(file);

        // Skip ignored files (match by filename or relative path)
        if (isIgnored(framerPath, mergedIgnored)) {
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
        let transformedContent = applyImportReplacements(
          actualContent,
          mergedRules,
          framerPath
        );

        // Apply ENV replacement if enabled
        if (mergedEnvReplacementEnabled) {
          transformedContent = applyEnvReplacement(transformedContent);
        }

        // Ensure all relative imports have .tsx extension
        transformedContent = ensureTsxExtensions(transformedContent);

        if (existingFile) {
          // Update existing file
          await withPermission({
            permission: "CodeFile.setFileContent",
            action: async () => {
              return await existingFile.setFileContent(transformedContent);
            },
          });
        } else if (createdFile) {
          // Update newly created file
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
