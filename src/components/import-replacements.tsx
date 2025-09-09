import { useEffect, useMemo, useState } from "react";
import { framer } from "framer-plugin";
import { withPermission } from "../utils/permission-utils";

type ImportReplacementRule = {
  search: string;
  bundlePath: string; // path from project root to custom bundle (e.g. ./bundles/Tanstack_query.tsx)
};

export default function ImportReplacements() {
  const [rules, setRules] = useState<ImportReplacementRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [ignoredFiles, setIgnoredFiles] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await framer.getPluginData("importReplacements");
        if (raw) {
          const parsed: ImportReplacementRule[] = JSON.parse(raw);
          if (Array.isArray(parsed)) setRules(parsed);
        }
      } catch {
        // ignore parse errors and start with empty rules
      }
      try {
        const ignoredRaw = await framer.getPluginData("ignoredFiles");
        if (ignoredRaw) {
          const parsedIgnored: string[] = JSON.parse(ignoredRaw);
          if (Array.isArray(parsedIgnored)) setIgnoredFiles(parsedIgnored);
        }
      } catch {
        // ignore parse errors and start with empty list
      }
    })();
  }, []);

  const addRule = () => {
    setRules((prev) => [...prev, { search: "", bundlePath: "" }]);
  };

  const updateRule = (
    index: number,
    key: keyof ImportReplacementRule,
    value: string
  ) => {
    setRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const isValid = useMemo(() => {
    if (!Array.isArray(rules)) return false;
    return rules.every(
      (r) =>
        typeof r.search === "string" &&
        r.search.trim() &&
        typeof r.bundlePath === "string" &&
        r.bundlePath.trim()
    );
  }, [rules]);

  const saveRules = async () => {
    try {
      setIsSaving(true);
      setSaveStatus("idle");
      const serialized = JSON.stringify(rules);
      await withPermission({
        permission: "setPluginData",
        action: async () => {
          return await framer.setPluginData("importReplacements", serialized);
        },
      });

      const ignoredFiltered = ignoredFiles
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);
      await withPermission({
        permission: "setPluginData",
        action: async () => {
          return await framer.setPluginData(
            "ignoredFiles",
            JSON.stringify(ignoredFiltered)
          );
        },
      });

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        paddingTop: "15px",
        paddingBottom: "60px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "auto",
        }}
      >
        <h4>Import Replacement Rules</h4>
        <p style={{ color: "#ababab", marginTop: "6px" }}>
          Add pairs to replace library imports with your local bundles when
          uploading.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontWeight: 500 }}>
                  Search (library to replace)
                </label>
                <input
                  type="text"
                  placeholder="e.g. @tanstack/react-query"
                  value={rule.search}
                  onChange={(e) => updateRule(idx, "search", e.target.value)}
                  style={{
                    padding: "6px 8px",
                    width: "100%",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontWeight: 500 }}>
                  Root path (from project root to custom bundle)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ./bundles/Tanstack_query.tsx"
                  value={rule.bundlePath}
                  onChange={(e) =>
                    updateRule(idx, "bundlePath", e.target.value)
                  }
                  style={{
                    padding: "6px 8px",
                    width: "100%",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => removeRule(idx)}
                  style={{
                    padding: "6px 10px",
                    cursor: "pointer",
                    backgroundColor: "#82140c",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 10,
          }}
        >
          <button
            onClick={addRule}
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--framer-color-bg-tertiary)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + Add Pair
          </button>
        </div>

        <div style={{ marginTop: 18 }}>
          <h4>Ignored files</h4>
          <p style={{ color: "#ababab", marginTop: "6px" }}>
            Files listed here will be skipped during upload and import rewrites.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ignoredFiles.map((name, idx) => (
              <div
                key={idx}
                style={{
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="e.g. Cart.tsx or hooks/Cart.tsx"
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setIgnoredFiles((prev) => {
                      const next = [...prev];
                      next[idx] = v;
                      return next;
                    });
                  }}
                  style={{
                    padding: "6px 8px",
                    width: "100%",
                  }}
                />
                <button
                  onClick={() =>
                    setIgnoredFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  style={{
                    padding: "6px 10px",
                    cursor: "pointer",
                    backgroundColor: "#82140c",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 10 }}>
            <button
              onClick={() => setIgnoredFiles((prev) => [...prev, ""])}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              + Add Ignored File
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={saveRules}
        disabled={!isValid || isSaving}
        style={{
          position: "absolute",
          bottom: 25,
          left: 0,
          padding: "8px 12px",
          backgroundColor: "var(--framer-color-tint-dark)",
          color: "white",
          border: "none",
          cursor: isValid ? "pointer" : "not-allowed",
          fontWeight: 600,
          width: "100%",
        }}
      >
        {isSaving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
