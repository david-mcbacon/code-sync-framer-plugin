import { Dispatch } from "react";
import { SetStateAction } from "react";
import { UploadState } from "./types";
import { handleFolderUpload } from "./upload-logic";

export const processFiles = async (
  files: FileList | null,
  setUploadState: Dispatch<SetStateAction<UploadState>>,
  setTotalFiles: Dispatch<SetStateAction<number>>,
  setUploadedCount: Dispatch<SetStateAction<number>>,
  overwriteAll: boolean
) => {
  if (!files) return;

  // Check if no .tsx files were found
  const tsxFiles = Array.from(files).filter((file) =>
    file.name.endsWith(".tsx")
  );
  if (tsxFiles.length === 0) {
    console.log("No .tsx files found in the selected folder.");
    return;
  }

  await handleFolderUpload(
    files,
    setUploadState,
    setTotalFiles,
    setUploadedCount,
    overwriteAll
  );
};

// Helper function to traverse the directory tree
export const traverseFileTree = async (
  item: any,
  path: string,
  files: File[]
): Promise<void> => {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file((file: File) => {
        // Preserve the relative path
        Object.defineProperty(file, "webkitRelativePath", {
          value: path + file.name,
          writable: false,
        });
        files.push(file);
        resolve();
      });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      dirReader.readEntries(async (entries: any[]) => {
        for (const entry of entries) {
          await traverseFileTree(entry, path + item.name + "/", files);
        }
        resolve();
      });
    }
  });
};

// Helper function to create a FileList-like object
export const createFileList = (files: File[]): FileList => {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
};
