import { framer } from "framer-plugin";
import "./App.css";
import FolderUpload from "./components/folder-upload";
import { useState } from "react";
import Docs from "./components/docs";

framer.showUI({
  position: "top left",
  width: 300,
  height: 420,
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
        }}
      >
        <div
          className={`tab-left ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </div>
        <div
          className={`tab-right ${activeTab === "docs" ? "active" : ""}`}
          onClick={() => setActiveTab("docs")}
        >
          Docs
        </div>
      </div>
      <div style={{ height: "100%", width: "100%" }}>
        {activeTab === "upload" && <FolderUpload />}
        {activeTab === "docs" && <Docs />}
      </div>
    </main>
  );
}
