import { useState, useEffect } from "react";
import { framer } from "framer-plugin";
import UploadSettings from "./components/upload-settings";
import OpenSourceFooter from "../../components/open-source-footer";
import DropZone from "./components/drop-zone";

interface FolderUploadPageProps {
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
}

export default function FolderUploadPage({
  isMinimized,
  setIsMinimized,
}: FolderUploadPageProps) {
  const [overwriteAll, setOverwriteAll] = useState(false);
  const [envTarget, setEnvTarget] = useState<string>("production");
  const [unpackToRoot, setUnpackToRoot] = useState(true);
  const [uploadMode, setUploadMode] = useState<"folder" | "files">("folder");

  useEffect(() => {
    if (isMinimized) {
      framer.showUI({
        position: "top left",
        width: 150,
        height: 100,
      });
    } else {
      framer.showUI({
        position: "top left",
        width: 320,
        height: 450,
      });
    }
  }, [isMinimized]);

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleRestore = () => {
    setIsMinimized(false);
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
      onClick={isMinimized ? handleRestore : undefined}
    >
      {!isMinimized && (
        <>
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
        </>
      )}
      <DropZone
        overwriteAll={overwriteAll}
        unpackToRoot={unpackToRoot}
        uploadMode={uploadMode}
        isMinimized={isMinimized}
      />
      {!isMinimized && <OpenSourceFooter />}
      <button
        onClick={handleMinimize}
        style={{
          position: "absolute",
          bottom: isMinimized ? "4px" : "-4px",
          right: isMinimized ? "4px" : "-4px",
          width: "fit-content",
          height: "fit-content",
          borderRadius: "4px",
          // border: "1px solid var(--framer-color-bg-tertiary)",
          backgroundColor: "rgba(255, 255, 255, 0)",
          color: "var(--framer-color-text)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: isMinimized ? "12px" : "16px",
          padding: 2,
          zIndex: 10,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--framer-color-bg-secondary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--framer-color-bg)";
        }}
        title="Minimize"
      >
        −
      </button>
    </div>
  );
}
