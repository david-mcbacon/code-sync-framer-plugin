import React, { useState, useEffect, useRef } from "react";
import { handleFolderUpload } from "../lib/upload-logic";

// Array of fun GIFs for the upload process
const gifUrls = [
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTg5d2x2OGsyZTk2ZG1pM3NsaGlnbWpxZnk3d3AzcDJyOWtwbnppYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QBd2kLB5qDmysEXre9/giphy.gif",
];

export default function FolderUpload() {
  const [uploadState, setUploadState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [randomGif, setRandomGif] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set a random GIF on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * gifUrls.length);
    setRandomGif(gifUrls[randomIndex]);
  }, []);

  const onFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check if no .tsx files were found (this is handled inside handleFolderUpload)
    const tsxFiles = Array.from(files).filter((file) =>
      file.name.endsWith(".tsx")
    );
    if (tsxFiles.length === 0) {
      console.log("No .tsx files found in the selected folder.");
      // Clear the file input since no valid files were found
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    await handleFolderUpload(
      files,
      setUploadState,
      setTotalFiles,
      setUploadedCount
    );

    // Clear the file input after upload attempt
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  // Component to render the random GIF
  const RandomGif = () => {
    if (!randomGif) return null;

    return (
      <img
        src={randomGif}
        alt="Fun random GIF"
        style={{
          width: "100%",
          borderRadius: "10px",
          marginTop: "40px",
        }}
        onError={(e) => {
          // Hide GIF if it fails to load
          e.currentTarget.style.display = "none";
        }}
      />
    );
  };

  return (
    <div
      style={{
        paddingTop: "15px",
      }}
    >
      <h4>Upload Folder</h4>
      <p>Upload a folder containing .tsx files to sync with Framer.</p>
      <input
        ref={fileInputRef}
        type="file"
        // @ts-expect-error - webkitdirectory is not a valid attribute
        webkitdirectory=""
        directory=""
        multiple
        onChange={onFolderUpload}
        disabled={uploadState === "loading"}
        style={{
          marginTop: "10px",
          cursor: uploadState === "loading" ? "not-allowed" : "pointer",
          width: "100%",
          opacity: uploadState === "loading" ? 0.6 : 1,
          padding: "0px",
        }}
      />
      {renderUploadStatus()}
      <RandomGif />
    </div>
  );
}
