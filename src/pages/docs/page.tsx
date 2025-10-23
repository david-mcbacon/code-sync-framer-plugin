export default function DocsPage() {
  return (
    <div
      style={{
        paddingTop: "10px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        color: "var(--framer-color-text)",
      }}
    >
      {/* Overview */}
      <div style={{ marginBottom: 20 }}>
        <p>
          Upload your <code className="one-liner">.tsx</code> files directly to
          Framer with automatic transformations. Works out of the box with 1:1
          file copying, or use a config file to customize imports, ignore files,
          and apply string replacements.
        </p>
      </div>

      {/* Quick Start */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 8 }}>Quick Start</h4>
        <ol style={{ marginTop: 6, marginBottom: 12 }}>
          <li>
            • Select your upload mode (folder or individual files) above the
            upload panel
          </li>
          <li>
            • Choose an environment if you have an{" "}
            <code className="one-liner">Env.tsx</code> file
          </li>
          <li>• Drag and drop files or folders, or use the file picker</li>
          <li>
            • On future uploads, only modified files are re-uploaded for
            efficiency. Check "Overwrite all files" to force a complete
            re-upload.
          </li>
        </ol>
      </div>

      {/* Upload Modes */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 8 }}>Upload Modes</h4>
        <ul style={{ marginTop: 6, marginBottom: 12 }}>
          <li>
            • <b>Folder mode (default)</b>: Select a folder via file picker or
            drag & drop. All <code className="one-liner">.tsx</code> files
            within are uploaded.
          </li>
          <li>
            • <b>Files mode</b>: Select multiple{" "}
            <code className="one-liner">.tsx</code> files directly. Drag & drop
            supports multiple files, folders, or a mix of both.
          </li>
        </ul>
      </div>

      {/* Unpack to Root */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 8 }}>Unpack to Root</h4>
        <p style={{ marginBottom: 8 }}>
          Controls how files are placed in your Framer project:
        </p>
        <ul style={{ marginTop: 6, marginBottom: 0 }}>
          <li>
            • <b>Checked (default)</b>: Files unpack directly to the root,
            without creating a folder
          </li>
          <li>
            • <b>Unchecked</b>: Creates a folder matching the uploaded folder
            name and preserves the internal structure
          </li>
        </ul>
      </div>

      {/* Configuration */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 8 }}>Configuration</h4>
        <p style={{ marginBottom: 8 }}>
          Create a{" "}
          <code className="one-liner">framer-code-sync.config.json</code> (or{" "}
          <code className="one-liner">framer-code-sync.config.jsonc</code>) at
          the root of your uploaded folder to customize the upload process.
          JSONC allows comments. UI settings and config file rules merge
          together, with config file taking precedence.
        </p>

        <div
          style={{
            padding: 12,
            backgroundColor: "var(--framer-color-bg-secondary)",
            borderRadius: 6,
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontWeight: 600,
              marginBottom: 10,
              color: "var(--color-accent)",
              fontSize: 11,
            }}
          >
            framer-code-sync.config.json (example)
          </p>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre",
              fontSize: 10,
              lineHeight: 1.5,
              overflow: "auto",
            }}
          >
            <code>{`{
  "version": 1,
  "importReplacements": [
    {
      "find": "@stripe/stripe-js",
      "replace": "./Bundles/Stripe_bundle.tsx"
    },
    {
      "find": "./mock/helpers",
      "replace": "https://example.com/helpers.js"
    }
  ],
  "ignoredFiles": ["./internal/mock.tsx"],
  "stringReplacements": [
    { "find": "process.env.API_URL", "replace": "\"https://api.example.com\"" }
  ]
}`}</code>
          </pre>
        </div>

        <div>
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <li>
              • <b>importReplacements</b>: Replace module specifiers with a
              relative path (e.g.,{" "}
              <code className="one-liner">./Bundles/Stripe.tsx</code>) or a
              Framer URL
            </li>
            <li>
              • <b>ignoredFiles</b>: Specify filenames (e.g.,{" "}
              <code className="one-liner">mock.tsx</code>) or paths (e.g.,{" "}
              <code className="one-liner">internal/mock.tsx</code>) to exclude
              from upload
            </li>
            <li>
              • <b>stringReplacements</b>: Find and replace text in files. Use
              plain strings for literal matches or regex syntax (e.g.,{" "}
              <code className="one-liner">/pattern/gi</code>) for advanced
              patterns
            </li>
          </ul>
        </div>
      </div>

      {/* Environment Variables */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 8 }}>Environment Variables</h4>
        <p style={{ marginBottom: 8 }}>
          Create an <code className="one-liner">Env.tsx</code> file in your
          upload to define environment-specific values. The plugin replaces{" "}
          <code className="one-liner">ENV</code> references with the selected
          environment's values. Your environment selection is saved per project
          via <code className="one-liner">framer.setPluginData</code>, so
          collaborators share the same target.
        </p>

        <div
          style={{
            padding: 12,
            backgroundColor: "var(--framer-color-bg-secondary)",
            borderRadius: 6,
            marginTop: 12,
          }}
        >
          <p
            style={{
              fontWeight: 600,
              marginBottom: 10,
              color: "var(--color-accent)",
              fontSize: 11,
            }}
          >
            Env.tsx (example)
          </p>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre",
              fontSize: 10,
              lineHeight: 1.5,
              overflow: "auto",
            }}
          >
            <code>{`export const ENV = {
  BACKEND_URL: {
    development: "http://localhost:3000",
    staging: "https://staging-api.example.com",
    production: "https://api.example.com",
  },
  API_KEY: {
    development: "dev-key-123",
    staging: "staging-key-456",
    production: "prod-key-789",
  }
};`}</code>
          </pre>
        </div>
      </div>

      {/* Advanced Features */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 8 }}>Advanced Features</h4>
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <li>
            • <b>Auto .tsx extensions</b>: Relative imports (
            <code className="one-liner">./</code> or{" "}
            <code className="one-liner">../</code>) automatically get{" "}
            <code className="one-liner">.tsx</code> extensions added as required
            by Framer
          </li>
          <li>
            • <b>Upload strategy</b>: Files are created with placeholder content
            first, then updated with actual transformed content for reliability
          </li>
          <li>
            • <b>Only .tsx files</b>: The plugin only uploads{" "}
            <code className="one-liner">.tsx</code> files; other file types are
            ignored
          </li>
        </ul>
      </div>

      {/* Troubleshooting */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>Troubleshooting</h4>
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <li>
            • <b>Upload fails</b>: Check the browser console for detailed error
            messages. Common issues include permission problems or invalid file
            content.
          </li>
          <li>
            • <b>Config not applied</b>: Ensure{" "}
            <code className="one-liner">framer-code-sync.config.json</code> is
            at the root of your uploaded folder
          </li>
          <li>
            • <b>Import errors</b>: Double-check that replacement URLs and local
            paths are correct
          </li>
        </ul>
      </div>
    </div>
  );
}
