import { useEffect, useMemo, useState } from "react";
import { framer } from "framer-plugin";

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
      await framer.setPluginData("importReplacements", serialized);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ marginTop: "10px", marginBottom: "20px" }}>
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
              border: "1px solid #ddd",
              borderRadius: 4,
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
                  border: "1px solid #ccc",
                  borderRadius: 4,
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
                onChange={(e) => updateRule(idx, "bundlePath", e.target.value)}
                style={{
                  padding: "6px 8px",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => removeRule(idx)}
                style={{
                  padding: "6px 10px",

                  border: "1px solid #ccc",
                  borderRadius: 4,
                  cursor: "pointer",
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
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + Add Pair
        </button>
        <button
          onClick={saveRules}
          disabled={!isValid || isSaving}
          style={{
            padding: "8px 12px",
            backgroundColor: isValid ? "#2196f3" : "#9e9e9e",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: isValid ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          {isSaving ? "Saving..." : "Save Pairs"}
        </button>
      </div>

      {saveStatus === "success" && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: "#e8f5e8",
            border: "1px solid #4caf50",
            borderRadius: 4,
            color: "#2e7d32",
            fontWeight: 500,
          }}
        >
          ✓ Saved rules to project data
        </div>
      )}
      {saveStatus === "error" && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: 4,
            color: "#c62828",
            fontWeight: 500,
          }}
        >
          ✗ Failed to save. Please try again.
        </div>
      )}
    </div>
  );
}
