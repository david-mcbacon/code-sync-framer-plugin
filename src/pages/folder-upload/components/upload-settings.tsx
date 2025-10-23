import React, { useState, useEffect } from "react";
import { framer } from "framer-plugin";

interface UploadSettingsProps {
  envTarget: string;
  setEnvTarget: (value: string) => void;
  overwriteAll: boolean;
  setOverwriteAll: (value: boolean) => void;
}

export default function UploadSettings({
  envTarget,
  setEnvTarget,
  overwriteAll,
  setOverwriteAll,
}: UploadSettingsProps) {
  const [isLoadingEnv, setIsLoadingEnv] = useState(true);

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

  return (
    <div
      style={{
        marginBottom: "15px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        paddingTop: "4px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyItems: "center",
          alignItems: "center",
          gap: "8px",
          width: "100%",
        }}
      >
        <label
          htmlFor="environmentTarget"
          style={{
            fontSize: "12px",
            color: "var(--framer-color-text)",
            userSelect: "none",
          }}
        >
          Env
        </label>
        <select
          id="environmentTarget"
          value={envTarget}
          onChange={handleEnvChange}
          disabled={isLoadingEnv}
          style={{
            width: "100px",
            padding: "4px 8px",
            borderRadius: "8px",
            border: "1px solid var(--framer-color-bg-tertiary)",
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "var(--framer-color-text)",
            fontSize: "11px",
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
    </div>
  );
}
