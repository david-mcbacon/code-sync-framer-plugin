import { useState } from "react";
import { handleExport } from "../lib/export-logic";
import { CodeFile } from "framer-plugin";
import { getFilteredFiles } from "../lib/utils";

interface MainContentProps {
  codeFiles: CodeFile[];
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
}

export default function MainContent(props: MainContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const filteredFiles = getFilteredFiles(props.selectedFolder, props.codeFiles);
  const fileCount = filteredFiles.length;

  return (
    <div style={{ flex: 1, width: "100%" }}>
      <div
        style={{
          padding: "40px 20px",
          height: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: "48px",
            marginBottom: "10px",
            opacity: 0.7,
            userSelect: "none",
          }}
        >
          📁
        </div>

        <p
          style={{
            margin: "0",
            color: "var(--framer-color-text-secondary)",
            fontWeight: "500",
            fontSize: "14px",
          }}
        >
          Export code files
        </p>
        <p
          style={{
            marginTop: "5px",
            color: "var(--framer-color-text-tertiary)",
            textWrap: "balance",
          }}
        >
          {props.selectedFolder
            ? fileCount === 1
              ? `Download 1 file from "${props.selectedFolder}".`
              : `Download ${fileCount} files from "${props.selectedFolder}" as a zip file.`
            : fileCount === 1
            ? "Download all code files in this project."
            : "Download all code files in this project as a zip file."}
        </p>
        <button
          className="framer-button-primary"
          style={{ marginTop: "25px" }}
          onClick={() =>
            handleExport({
              selectedFolder: props.selectedFolder,
              setIsLoading,
              codeFiles: filteredFiles,
            })
          }
          disabled={isLoading || fileCount === 0}
        >
          {isLoading ? <div className="framer-spinner" /> : "Export"}
        </button>
      </div>
    </div>
  );
}
