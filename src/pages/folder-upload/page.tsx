import React, { useState, useRef } from "react";
import {
  processFiles,
  traverseFileTree,
  createFileList,
} from "../../lib/folder-utils";
import UploadSettings from "./components/upload-settings";
import UploadStatus from "./components/upload-status";
import { UploadState } from "../../lib/types";

export default function FolderUploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [overwriteAll, setOverwriteAll] = useState(false);
  const [envTarget, setEnvTarget] = useState<string>("production");
  const [unpackToRoot, setUnpackToRoot] = useState(true);
  const [uploadMode, setUploadMode] = useState<"folder" | "files">("folder");
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

    // IMPORTANT: Capture all entries synchronously first!
    // DataTransferItemList becomes invalid after async operations
    const entries: any[] = [];
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
          entries.push(item);
        }
      }
    }

    // Now process all entries asynchronously
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      try {
        await traverseFileTree(entry, "", files);
      } catch (error) {
        console.error(`Error processing entry ${i}:`, error);
      }
    }

    // Convert array to FileList-like object
    const fileList = createFileList(files);
    await processFiles(
      fileList,
      setUploadState,
      setTotalFiles,
      setUploadedCount,
      overwriteAll,
      unpackToRoot
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
      overwriteAll,
      unpackToRoot
    );

    // Clear the file input after upload attempt
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <UploadSettings
        envTarget={envTarget}
        setEnvTarget={setEnvTarget}
        overwriteAll={overwriteAll}
        setOverwriteAll={setOverwriteAll}
        unpackToRoot={unpackToRoot}
        setUnpackToRoot={setUnpackToRoot}
        uploadMode={uploadMode}
        setUploadMode={setUploadMode}
      />
      {/* DROP ZONE */}
      <div style={{ flex: 1, width: "100%" }}>
        <input
          ref={fileInputRef}
          type="file"
          {...(uploadMode === "folder"
            ? { webkitdirectory: "", directory: "" }
            : {})}
          multiple={uploadMode === "files"}
          onChange={handleFileInputChange}
          style={{ display: "none", height: "100%" }}
        />

        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            padding: "40px 20px",
            height: "100%",
            border: isDragging
              ? "2px dashed var(--color-accent)"
              : uploadState === "error"
              ? "2px dashed var(--color-error)"
              : uploadState === "success" || uploadState === "no-changes"
              ? "2px dashed var(--color-success)"
              : "2px dashed var(--framer-color-bg-tertiary)",
            borderRadius: "8px",
            backgroundColor: isDragging
              ? "rgba(240, 89, 26, 0.05)"
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
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -70px)",
              fontSize: "48px",
              marginBottom: "10px",
              opacity: 0.7,
              userSelect: "none",
            }}
          >
            📁
          </div>

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -20px)",
              width: "100%",
              padding: "24px 12px",
            }}
          >
            <UploadStatus
              uploadState={uploadState}
              isDragging={isDragging}
              uploadedCount={uploadedCount}
              totalFiles={totalFiles}
              setUploadState={setUploadState}
            />
          </div>
        </div>
      </div>
      <p
        style={{
          fontSize: "11px",
          lineHeight: "1.3",
          padding: "10px 5px 0px 5px",
          color: "var(--framer-color-text-tertiary)",
          textAlign: "center",
        }}
      >
        It&apos;s open source! Jump into the
        <a
          href="https://github.com/david-mcbacon/code-sync-framer-plugin"
          style={{
            color: "var(--color-accent)",
          }}
        >
          {" "}
          GitHub repo{" "}
        </a>
        and help make it even better.
      </p>
    </div>
  );
}
