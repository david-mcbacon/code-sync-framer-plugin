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

  return (
    <div
      style={{
        height: "100%",
        width: "100%",

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
  );
}
