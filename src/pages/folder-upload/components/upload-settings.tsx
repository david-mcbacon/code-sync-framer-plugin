import React, { useState, useEffect } from "react";
import { framer } from "framer-plugin";

interface UploadSettingsProps {
  envTarget: string;
  setEnvTarget: (value: string) => void;
  overwriteAll: boolean;
  setOverwriteAll: (value: boolean) => void;
  unpackToRoot: boolean;
  setUnpackToRoot: (value: boolean) => void;
}

export default function UploadSettings({
  envTarget,
  setEnvTarget,
  overwriteAll,
  setOverwriteAll,
  unpackToRoot,
  setUnpackToRoot,
}: UploadSettingsProps) {
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);
  const [isLoadingUnpack, setIsLoadingUnpack] = useState(true);

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
              await framer.setPluginData("envReplacementTarget", "production");
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
              await framer.setPluginData("unpackToRoot", "true");
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

  const handleEnvChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setEnvTarget(value);

    try {
      await framer.setPluginData("envReplacementTarget", value);
    } catch (error) {
      console.error("Failed to save environment selection", error);
    }
  };

  const handleUnpackChange = async (checked: boolean) => {
    setUnpackToRoot(checked);

    try {
      await framer.setPluginData("unpackToRoot", checked.toString());
    } catch (error) {
      console.error("Failed to save unpack to root setting", error);
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
          gap: "12px",
          width: "100%",
        }}
      >
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
      {/* RIGHT SIDE */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyItems: "start",
          alignItems: "start",
          gap: "5px",
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
    </div>
  );
}
