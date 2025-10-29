import { useState } from "react";
import OpenSourceFooter from "../../components/open-source-footer";
import ExportFolderDropdown from "./components/export-folder-dropdown";
import { useClearSelectedFolder, useSubscribeToCodeFiles } from "./lib/hooks";
import MainContent from "./components/main-content";

export default function ExportPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const codeFiles = useSubscribeToCodeFiles();
  useClearSelectedFolder({ selectedFolder, setSelectedFolder, codeFiles });

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
      <ExportFolderDropdown
        codeFiles={codeFiles}
        selectedFolder={selectedFolder}
        setSelectedFolder={setSelectedFolder}
      />
      <MainContent
        codeFiles={codeFiles}
        selectedFolder={selectedFolder}
        setSelectedFolder={setSelectedFolder}
      />
      <OpenSourceFooter />
    </div>
  );
}
