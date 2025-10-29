import React, { useState, useEffect } from "react";
import { framer } from "framer-plugin";
import { withPermission } from "../../../lib/permission-utils";

interface UploadSettingsProps {
  envTarget: string;
  setEnvTarget: (value: string) => void;
  overwriteAll: boolean;
  setOverwriteAll: (value: boolean) => void;
  unpackToRoot: boolean;
  setUnpackToRoot: (value: boolean) => void;
  uploadMode: "folder" | "files";
  setUploadMode: (value: "folder" | "files") => void;
}

export default function UploadSettings({
  envTarget,
  setEnvTarget,
  overwriteAll,
  setOverwriteAll,
  unpackToRoot,
  setUnpackToRoot,
  uploadMode,
  setUploadMode,
}: UploadSettingsProps) {
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isLoadingUnpack, setIsLoadingUnpack] = useState(true);
  const [isLoadingUploadMode, setIsLoadingUploadMode] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadEnvTarget = async () => {
      try {
        const value = await framer.getPluginData("envReplacementTarget");
        if (!isMounted) return;
        const normalized = value?.trim();
        if (normalized) {
          setEnvTarget(normalized);
        } else {
          setEnvTarget("production");
          if (isMounted) {
            try {
              await withPermission({
                permission: "setPluginData",
                action: async () => {
                  return await framer.setPluginData(
                    "envReplacementTarget",
                    "production"
                  );
                },
                errorMessage: "Failed to persist default environment selection",
              });
            } catch (persistError) {
              console.error(
                "Failed to persist default environment selection",
                persistError
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to load environment selection", error);
      } finally {
        if (isMounted) {
          setIsLoadingEnv(false);
        }
      }
    };

    void loadEnvTarget();

    return () => {
      isMounted = false;
    };
  }, [setEnvTarget]);

  useEffect(() => {
    let isMounted = true;

    const loadUnpackToRoot = async () => {
      try {
        const value = await framer.getPluginData("unpackToRoot");
        if (!isMounted) return;
        const normalized = value?.trim();
        if (normalized === "true" || normalized === "false") {
          setUnpackToRoot(normalized === "true");
        } else {
          setUnpackToRoot(true);
          if (isMounted) {
            try {
              await withPermission({
                permission: "setPluginData",
                action: async () => {
                  return await framer.setPluginData("unpackToRoot", "true");
                },
                errorMessage:
                  "Failed to persist default unpack to root setting",
              });
            } catch (persistError) {
              console.error(
                "Failed to persist default unpack to root setting",
                persistError
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to load unpack to root setting", error);
      } finally {
        if (isMounted) {
          setIsLoadingUnpack(false);
        }
      }
    };

    void loadUnpackToRoot();

    return () => {
      isMounted = false;
    };
  }, [setUnpackToRoot]);

  useEffect(() => {
    let isMounted = true;

    const loadUploadMode = async () => {
      try {
        const value = await framer.getPluginData("uploadMode");
        if (!isMounted) return;
        const normalized = value?.trim();
        if (normalized === "folder" || normalized === "files") {
          setUploadMode(normalized);
        } else {
          setUploadMode("folder");
          if (isMounted) {
            try {
              await withPermission({
                permission: "setPluginData",
                action: async () => {
                  return await framer.setPluginData("uploadMode", "folder");
                },
                errorMessage: "Failed to persist default upload mode setting",
              });
            } catch (persistError) {
              console.error(
                "Failed to persist default upload mode setting",
                persistError
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to load upload mode setting", error);
      } finally {
        if (isMounted) {
          setIsLoadingUploadMode(false);
        }
      }
    };

    void loadUploadMode();

    return () => {
      isMounted = false;
    };
  }, [setUploadMode]);

  const handleEnvChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setEnvTarget(value);

    try {
      await withPermission({
        permission: "setPluginData",
        action: async () => {
          return await framer.setPluginData("envReplacementTarget", value);
        },
        errorMessage: "Failed to save environment selection",
      });
    } catch (error) {
      console.error("Failed to save environment selection", error);
    }
  };

  const handleUnpackChange = async (checked: boolean) => {
    setUnpackToRoot(checked);

    try {
      await withPermission({
        permission: "setPluginData",
        action: async () => {
          return await framer.setPluginData("unpackToRoot", checked.toString());
        },
        errorMessage: "Failed to save unpack to root setting",
      });
    } catch (error) {
      console.error("Failed to save unpack to root setting", error);
    }
  };

  const handleUploadModeChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value as "folder" | "files";
    setUploadMode(value);

    try {
      await withPermission({
        permission: "setPluginData",
        action: async () => {
          return await framer.setPluginData("uploadMode", value);
        },
        errorMessage: "Failed to save upload mode setting",
      });
    } catch (error) {
      console.error("Failed to save upload mode setting", error);
    }
  };

  return (
    <div
      style={{
        marginBottom: "10px",
        display: "flex",
        alignItems: "start",
        gap: "10px",
        paddingTop: "4px",
        width: "100%",
        height: "fit-content",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
        }}
      >
        {/* Upload Mode */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyItems: "start",
            alignItems: "start",
            gap: "2px",
            width: "100%",
          }}
        >
          <label
            htmlFor="uploadMode"
            style={{
              fontSize: "12px",
              color: "var(--framer-color-text-secondary)",
              userSelect: "none",
            }}
          >
            Upload Mode
          </label>
          <select
            id="uploadMode"
            value={uploadMode}
            onChange={handleUploadModeChange}
            disabled={isLoadingUploadMode}
            style={{
              width: "100%",
              padding: "4px 8px",
              borderRadius: "8px",
              border: "1px solid var(--framer-color-bg-tertiary)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "var(--framer-color-text)",
              fontSize: "12px",
              cursor: isLoadingUploadMode ? "wait" : "pointer",
              minHeight: "26px",
            }}
          >
            <option value="folder" style={{ color: "#000" }}>
              Folder
            </option>
            <option value="files" style={{ color: "#000" }}>
              Files
            </option>
          </select>
        </div>

        {/* Overwrite all files */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <input
            type="checkbox"
            id="overwriteAll"
            checked={overwriteAll}
            onChange={(e) => setOverwriteAll(e.target.checked)}
            style={{
              width: "16px",
              height: "16px",
              cursor: "pointer",
            }}
          />
          <label
            htmlFor="overwriteAll"
            style={{
              fontSize: "12px",
              cursor: "pointer",
              userSelect: "none",
              color: "var(--framer-color-text)",
            }}
          >
            Overwrite all files
          </label>
        </div>

        {/* Unpack to root */}
      </div>
      {/* RIGHT SIDE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyItems: "start",
            alignItems: "start",
            gap: "2px",
            width: "100%",
          }}
        >
          <label
            htmlFor="environmentTarget"
            style={{
              fontSize: "12px",
              color: "var(--framer-color-text-secondary)",
              userSelect: "none",
            }}
          >
            Environment
          </label>
          <select
            id="environmentTarget"
            value={envTarget}
            onChange={handleEnvChange}
            disabled={isLoadingEnv}
            style={{
              width: "100%",
              padding: "4px 8px",
              borderRadius: "8px",
              border: "1px solid var(--framer-color-bg-tertiary)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "var(--framer-color-text)",
              fontSize: "12px",
              cursor: isLoadingEnv ? "wait" : "pointer",
              minHeight: "26px",
            }}
          >
            <option value="development" style={{ color: "#000" }}>
              Development
            </option>
            <option value="staging" style={{ color: "#000" }}>
              Staging
            </option>
            <option value="production" style={{ color: "#000" }}>
              Production
            </option>
          </select>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
          }}
        >
          <input
            type="checkbox"
            id="unpackToRoot"
            checked={unpackToRoot}
            onChange={(e) => handleUnpackChange(e.target.checked)}
            disabled={isLoadingUnpack}
            style={{
              width: "16px",
              height: "16px",
              cursor: isLoadingUnpack ? "wait" : "pointer",
            }}
          />
          <label
            htmlFor="unpackToRoot"
            style={{
              fontSize: "12px",
              cursor: isLoadingUnpack ? "wait" : "pointer",
              userSelect: "none",
              color: "var(--framer-color-text)",
            }}
          >
            Unpack to root
          </label>
        </div>
      </div>
    </div>
  );
}
