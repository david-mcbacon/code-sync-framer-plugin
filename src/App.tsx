import { framer } from "framer-plugin";
import "./App.css";
import FolderUpload from "./components/folder-upload";
import ImportReplacements from "./components/import-replacements";
import { useState } from "react";

framer.showUI({
  position: "top left",
  width: 360,
  height: 520,
});

export function App() {
  const [activeTab, setActiveTab] = useState("upload");
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        padding: "0px 15px 15px 15px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 0,
          width: "100%",
        }}
      >
        <div
          className={`tab-left ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </div>
        <div
          className={`tab-right ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </div>
      </div>

      {activeTab === "upload" && <FolderUpload />}
      {activeTab === "settings" && <ImportReplacements />}
    </main>
  );
}
