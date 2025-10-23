import React from "react";
import { UploadState } from "../../../lib/types";

interface UploadStatusProps {
  uploadState: UploadState;
  isDragging: boolean;
  uploadedCount: number;
  totalFiles: number;
  setUploadState: React.Dispatch<React.SetStateAction<UploadState>>;
}

export default function UploadStatus({
  uploadState,
  isDragging,
  uploadedCount,
  totalFiles,
  setUploadState,
}: UploadStatusProps) {
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
            {isDragging ? "Drop folder here" : "Drag folder or click to browse"}
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
}
