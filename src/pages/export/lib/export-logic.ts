import { type CodeFile, framer } from "framer-plugin";
import JSZip from "jszip";
import { getFilteredFiles } from "./utils";

interface HandleExportProps {
  selectedFolder: string | null;
  setIsLoading: (isLoading: boolean) => void;
  codeFiles: CodeFile[];
}

export async function handleExport({
  selectedFolder,
  setIsLoading,
  codeFiles,
}: HandleExportProps) {
  setIsLoading(true);

  try {
    // Get filtered code files
    const filesToExport = getFilteredFiles(selectedFolder, codeFiles);

    if (filesToExport.length === 0) {
      setIsLoading(false);
      framer.notify(
        selectedFolder
          ? `No code files found in folder "${selectedFolder}".`
          : "No code files found in this project."
      );
      return;
    }

    const fileCount = filesToExport.length;
    const fileWord = fileCount === 1 ? "file" : "files";

    // If only one file, download it directly without zipping
    if (fileCount === 1) {
      const codeFile = filesToExport[0];
      const fileName = codeFile.path || codeFile.name;
      const blob = new Blob([codeFile.content], { type: "text/plain" });

      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsLoading(false);
      framer.notify(`Successfully exported ${fileName}!`, {
        variant: "success",
      });
      return;
    }

    // Create a new JSZip instance for multiple files
    const zip = new JSZip();

    // Add each code file to the zip
    for (const codeFile of filesToExport) {
      const filePath = codeFile.path || codeFile.name;

      // If a folder is selected, strip the parent folders before the selected folder
      let zipPath = filePath;
      if (selectedFolder) {
        // Get the parent path (everything before the last segment of selectedFolder)
        const lastSlashIndex = selectedFolder.lastIndexOf("/");
        const parentPath =
          lastSlashIndex !== -1
            ? selectedFolder.substring(0, lastSlashIndex + 1)
            : "";

        // Strip the parent path from the file path
        if (parentPath && filePath.startsWith(parentPath)) {
          zipPath = filePath.substring(parentPath.length);
        }
      }

      zip.file(zipPath, codeFile.content);
    }

    let name = "framer-code-files";

    // If a folder is selected, use the folder name
    if (selectedFolder) {
      const folderName = selectedFolder.split("/").pop() || selectedFolder;
      name = folderName;
    } else {
      // Otherwise, use the project name
      try {
        const projectInfo = await framer.getProjectInfo();
        if (projectInfo.name) {
          name = projectInfo.name;
        }
      } catch (error) {
        console.error("Error getting project info:", error);
      }
    }

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Create a download link and trigger the download
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsLoading(false);
    framer.notify(`Successfully exported ${fileCount} code ${fileWord}!`, {
      variant: "success",
    });
  } catch (error) {
    console.error("Export failed:", error);
    setIsLoading(false);
    framer.notify(
      `Export failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      {
        variant: "error",
        durationMs: Infinity,
      }
    );
  }
}
