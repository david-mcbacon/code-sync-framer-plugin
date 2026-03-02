import { framer } from "framer-plugin";
import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { withPermission } from "./lib/permission-utils";
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
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const value = await framer.getPluginData("isMinimized");
        if (!isMounted) return;
        const normalized = value?.trim();
        if (normalized === "true" || normalized === "false") {
          setIsMinimized(normalized === "true");
        }
      } catch (error) {
        console.error("Failed to load minimized state", error);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const setIsMinimizedAndPersist = useCallback((value: boolean) => {
    setIsMinimized(value);
    void withPermission({
      permission: "setPluginData",
      action: async () => {
        return await framer.setPluginData("isMinimized", value.toString());
      },
      errorMessage: "Failed to persist minimized state",
    });
  }, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        padding: isMinimized ? "0px" : "0px 15px 15px 15px",
      }}
    >
      {!isMinimized && (
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
      )}
      <div style={{ height: "100%", width: "100%", overflowY: "auto" }}>
        {activeTab === "upload" && (
          <FolderUploadPage
            isMinimized={isMinimized}
            setIsMinimized={setIsMinimizedAndPersist}
          />
        )}
        {activeTab === "export" && <ExportPage />}
        {activeTab === "docs" && <DocsPage />}
      </div>
    </main>
  );
}
