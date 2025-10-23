import { framer } from "framer-plugin";
import { withPermission } from "../utils/permission-utils";
import {
  FileProcessingData,
  EnvReplacementRule,
  StringReplacementRule,
  UploadState,
} from "./types";
import { readFileContent, getUploadedRelativePath } from "./file-processing";
import {
  loadConfigFromUpload,
  loadImportReplacementRules,
  loadIgnoredFiles,
  loadEnvReplacementSelection,
  loadStringReplacementRules,
  mergeImportReplacementRules,
  mergeIgnoredFiles,
} from "./config-loader";
import {
  applyImportReplacements,
  applyEnvReplacement,
  applyStringReplacements,
  ensureTsxExtensions,
} from "./string-transforms";
import { isIgnored } from "./file-utils";
import { Dispatch, SetStateAction } from "react";

export const handleFolderUpload = async (
  files: FileList | null,
  setUploadState: Dispatch<SetStateAction<UploadState>>,
  setTotalFiles: Dispatch<SetStateAction<number>>,
  setUploadedCount: Dispatch<SetStateAction<number>>,
  overwriteAll: boolean = false
): Promise<void> => {
  if (!files) return;

  // Convert FileList to Array for easier processing
  const allFiles = Array.from(files);

  // Optionally load a config file from the uploaded folder, e.g. framer-code-sync.config.json
  const config = await loadConfigFromUpload(allFiles);

  // Filter only .tsx files to upload
  let tsxFiles = allFiles.filter((file) => file.name.endsWith(".tsx"));

  if (tsxFiles.length === 0) {
    console.log("No .tsx files found in the selected folder.");
    return;
  }

  try {
    // Load import replacement rules, ignored files, and env replacement setting saved in project data
    // Also get the last upload date
    const [
      uiRules,
      uiIgnored,
      envSelectionRaw,
      lastUploadDateStr,
      uiStringReplacements,
    ] = await Promise.all([
      loadImportReplacementRules(),
      loadIgnoredFiles(),
      loadEnvReplacementSelection(),
      framer.getPluginData("lastUploadDate"),
      loadStringReplacementRules(),
    ]);
    const envSelection = envSelectionRaw?.trim()
      ? envSelectionRaw.trim()
      : null;

    // Filter files based on last modified date (only if overwriteAll is false)
    if (!overwriteAll && lastUploadDateStr) {
      const lastUploadDate = parseInt(lastUploadDateStr, 10);
      const originalCount = tsxFiles.length;
      tsxFiles = tsxFiles.filter((file) => file.lastModified > lastUploadDate);

      console.log(
        `Filtered ${
          originalCount - tsxFiles.length
        } unchanged files. Uploading ${tsxFiles.length} modified files.`
      );

      if (tsxFiles.length === 0) {
        console.log("No files have been modified since last upload.");
        setUploadState("no-changes");

        // Reset to idle after showing no-changes message for 3 seconds
        setTimeout(() => {
          setUploadState("idle");
        }, 3000);
        return;
      }
    }

    // Merge UI settings with config (config takes precedence)
    const mergedRules = mergeImportReplacementRules(
      uiRules,
      config?.importReplacements || []
    );
    const mergedIgnored = mergeIgnoredFiles(
      uiIgnored,
      config?.ignoredFiles || []
    );
    const mergedStringReplacements: StringReplacementRule[] = [
      ...uiStringReplacements,
      ...(config?.stringReplacements || []),
    ];
    // Build env replacement rules from UI selection
    const envReplacementRules: EnvReplacementRule[] = [];
    if (envSelection) {
      envReplacementRules.push({ from: "development", to: envSelection });
    }

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

        // Apply ENV replacement if rules are configured
        if (envReplacementRules.length > 0) {
          transformedContent = applyEnvReplacement(
            transformedContent,
            envReplacementRules
          );
        }

        if (mergedStringReplacements.length > 0) {
          transformedContent = applyStringReplacements(
            transformedContent,
            mergedStringReplacements
          );
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

    // Calculate and store the max modified date from all uploaded files
    const maxModifiedDate = Math.max(
      ...tsxFiles.map((file) => file.lastModified)
    );
    await framer.setPluginData("lastUploadDate", maxModifiedDate.toString());

    console.log(
      `Updated last upload date to: ${new Date(maxModifiedDate).toISOString()}`
    );

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
