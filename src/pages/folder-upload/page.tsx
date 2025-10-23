import React, { useState, useRef } from "react";
import {
  processFiles,
  traverseFileTree,
  createFileList,
} from "../../lib/folder-utils";
import UploadSettings from "./components/upload-settings";
import { UploadState } from "../../lib/types";

export default function FolderUploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("no-changes");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [overwriteAll, setOverwriteAll] = useState(false);
  const [envTarget, setEnvTarget] = useState<string>("production");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploadState === "loading") return;

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Process all dropped items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
          await traverseFileTree(item, "", files);
        }
      }
    }

    // Convert array to FileList-like object
    const fileList = createFileList(files);
    await processFiles(
      fileList,
      setUploadState,
      setTotalFiles,
      setUploadedCount,
      overwriteAll
    );
  };

  const handleClick = () => {
    if (uploadState === "loading") return;
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    await processFiles(
      files,
      setUploadState,
      setTotalFiles,
      setUploadedCount,
      overwriteAll
    );

    // Clear the file input after upload attempt
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderUploadStatus = () => {
    switch (uploadState) {
      case "idle":
        return (
          <>
            <p
              style={{
                margin: "0",
                color: isDragging
                  ? "var(--framer-color-tint)"
                  : "var(--framer-color-text-secondary)",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              {isDragging
                ? "Drop folder here"
                : "Drag folder or click to browse"}
            </p>
            <p
              style={{
                margin: "5px 0 0 0",
                color: "var(--framer-color-text-tertiary)",
                fontSize: "12px",
              }}
            >
              Drag and drop a folder containing .tsx files to sync with Framer.
            </p>
          </>
        );
      case "loading":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid var(--framer-color-tint)",
                  borderTop: "2px solid transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span
                style={{ color: "var(--framer-color-tint)", fontWeight: "500" }}
              >
                Uploading files... {uploadedCount}/{totalFiles}
              </span>
            </div>

            <div
              style={{
                height: "5px",
                // backgroundColor: "var(--framer-color-tint)",
                background: `linear-gradient(to right, var(--framer-color-tint) ${
                  (uploadedCount / totalFiles) * 100
                }%, var(--framer-color-text-tertiary) ${
                  (uploadedCount / totalFiles) * 100
                }%)`,
                borderRadius: "5px",
                border: "1px solid var(--framer-color-text-tertiary)",
                // width: `${
                //   totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0
                // }%`,
                width: "150px",
                transition: "width 0.3s ease",
              }}
            ></div>
          </div>
        );
      case "success":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              gap: "5px",
            }}
          >
            <p
              style={{
                color: "#4caf50",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              ✓
            </p>
            <p style={{ color: "#4caf50", fontWeight: "500" }}>
              Successfully uploaded {uploadedCount} files to Framer!
            </p>
          </div>
        );
      case "error":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                gap: "5px",
              }}
            >
              <p style={{ color: "#f44336", fontWeight: "500" }}>
                Upload failed. Please try again.
              </p>
            </div>
            <button
              onClick={() => setUploadState("idle")}
              style={{
                padding: "6px 12px",
                backgroundColor: "var(--framer-color-bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--framer-color-text)",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                lineHeight: "1",
                fontWeight: "500",
              }}
            >
              Try Again
            </button>
          </div>
        );
      case "no-changes":
        return (
          <div
            style={{
              padding: "10px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              justifyContent: "center",
              gap: "5px",
            }}
          >
            <span
              style={{
                color: "var(--framer-color-tint)",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              ✓
            </span>
            <span
              style={{ color: "var(--framer-color-tint)", fontWeight: "500" }}
            >
              All files are up to date! No changes detected since last upload.
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        paddingTop: "10px",
        position: "relative",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        // @ts-expect-error - webkitdirectory is not a valid attribute
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileInputChange}
        style={{ display: "none", height: "100%" }}
      />

      <UploadSettings
        envTarget={envTarget}
        setEnvTarget={setEnvTarget}
        overwriteAll={overwriteAll}
        setOverwriteAll={setOverwriteAll}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: "40px 20px",
          height: "86%",
          border: isDragging
            ? "2px dashed var(--framer-color-tint)"
            : uploadState === "error"
            ? "2px dashed #f44336"
            : uploadState === "success"
            ? "2px dashed #4caf50"
            : "2px dashed var(--framer-color-bg-tertiary)",
          borderRadius: "8px",
          backgroundColor: isDragging
            ? "rgba(0, 123, 255, 0.05)"
            : uploadState === "loading"
            ? "transparent"
            : "transparent",
          textAlign: "center",
          cursor: uploadState === "loading" ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "48px",
            marginBottom: "10px",
            opacity: 0.5,
          }}
        >
          📁
        </div>

        <div
          style={{
            position: "absolute",
            top: "62%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            padding: "28px",
          }}
        >
          {renderUploadStatus()}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
