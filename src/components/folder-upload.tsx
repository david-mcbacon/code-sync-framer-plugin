import React, { useState } from "react";
import { handleFolderUpload } from "../lib/upload-logic";

export default function FolderUpload() {
  const [uploadState, setUploadState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList) => {
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
      setUploadedCount
    );
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploadState === "loading") return;

    const items = e.dataTransfer.items;
    if (!items) return;

    const files: File[] = [];

    // Collect all files from the dropped items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          await collectFiles(entry, files);
        }
      }
    }

    if (files.length > 0) {
      // Convert array to FileList-like object
      const fileList = createFileList(files);
      await processFiles(fileList);
    }
  };

  // Recursively collect files from directories
  const collectFiles = async (
    entry: FileSystemEntry,
    files: File[]
  ): Promise<void> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      return new Promise((resolve) => {
        fileEntry.file((file) => {
          files.push(file);
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();

      return new Promise((resolve) => {
        reader.readEntries(async (entries) => {
          for (const entry of entries) {
            await collectFiles(entry, files);
          }
          resolve();
        });
      });
    }
  };

  // Create a FileList-like object from an array of files
  const createFileList = (files: File[]): FileList => {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  };
  const renderUploadStatus = () => {
    switch (uploadState) {
      case "loading":
        return (
          <div
            style={{
              marginTop: "10px",
              padding: "12px",
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
                border: "2px solid var(--framer-color-tint)",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <span
              style={{ color: "var(--framer-color-tint)", fontWeight: "500" }}
            >
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
                  backgroundColor: "var(--framer-color-tint)",
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
              border: "1px solid #4caf50",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                color: "#4caf50",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              ✓
            </span>
            <span style={{ color: "#4caf50", fontWeight: "500" }}>
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
    <div
      style={{
        paddingTop: "15px",
      }}
    >
      <h4>Upload Folder</h4>
      <p>Drag and drop a folder containing .tsx files to sync with Framer.</p>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          marginTop: "10px",
          padding: "40px 20px",
          border: isDragging
            ? "2px dashed var(--framer-color-tint)"
            : "2px dashed #ccc",
          borderRadius: "8px",
          backgroundColor: isDragging
            ? "rgba(33, 150, 243, 0.05)"
            : uploadState === "loading"
            ? "transparent"
            : "transparent",
          cursor: uploadState === "loading" ? "not-allowed" : "pointer",
          opacity: uploadState === "loading" ? 0.6 : 1,
          textAlign: "center",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            fontSize: "40px",
            marginBottom: "10px",
            opacity: 0.5,
          }}
        >
          📁
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: isDragging ? "var(--framer-color-tint)" : "#666",
            marginBottom: "5px",
          }}
        >
          {isDragging
            ? "Drop folder here"
            : uploadState === "loading"
            ? "Uploading..."
            : "Drop folder here"}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#999",
          }}
        >
          Only .tsx files will be processed
        </div>
      </div>
      {renderUploadStatus()}
    </div>
  );
}
