import { framer } from "framer-plugin";
import "./App.css";
import { useState } from "react";
import FolderUploadPage from "./pages/upload/page";
import DocsPage from "./pages/docs/page";
import ExportPage from "./pages/export/page";

framer.showUI({
  position: "top left",
  width: 320,
  height: 450,
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
          height: "fit-content",
          paddingBottom: "10px",
          backgroundColor: "var(--framer-color-bg)",
        }}
      >
        <div
          className={`tab-left ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </div>
        <div
          className={`tab-middle ${activeTab === "export" ? "active" : ""}`}
          onClick={() => setActiveTab("export")}
        >
          Export
        </div>
        <div
          className={`tab-right ${activeTab === "docs" ? "active" : ""}`}
          onClick={() => setActiveTab("docs")}
        >
          Docs
        </div>
      </div>
      <div style={{ height: "100%", width: "100%", overflowY: "auto" }}>
        {activeTab === "upload" && <FolderUploadPage />}
        {activeTab === "export" && <ExportPage />}
        {activeTab === "docs" && <DocsPage />}
      </div>
    </main>
  );
}
