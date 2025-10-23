export default function Docs() {
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
      {/* Getting Started */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 6 }}>Getting Started</h4>
        <p>
          This plugin works out of the box without any configuration files.
          Without config files, it creates 1:1 copies of your code files as they
          are. With a config file and environment file, you can enhance how you
          deploy to Framer by customizing imports, ignoring files, and
          performing string replacements.
        </p>
        <p style={{ marginTop: 12 }}>
          On consecutive uploads, the plugin only updates files that have been
          modified since the last upload for efficiency. You can check the
          "Overwrite all files" option to force a complete re-upload of all
          files regardless of their modification status.
        </p>
        <p style={{ marginTop: 12 }}>
          When you select or drop a folder into the drop zone (e.g., a folder
          named "framer-comps"), the behavior depends on the "Unpack to root"
          setting above the upload panel:
        </p>
        <ul
          style={{
            marginTop: 6,
            marginBottom: 12,
            color: "var(--framer-color-text-secondary)",
          }}
        >
          <li>
            <b>1. When checked (default)</b>: Files are unpacked directly to the
            root of your Framer project, without creating a folder with the
            uploaded folder's name.
          </li>
          <li>
            <b>2. When unchecked</b>: A folder with the same name as the
            uploaded folder is created in Framer, and all files are placed
            inside it, preserving the original folder structure.
          </li>
        </ul>
      </div>

      {/* Environment & Configuration */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 6 }}>Environment & Configuration</h4>
        <p>
          Use the environment selector on the upload page above the upload panel
          to choose which env should replace <code>ENV</code> references. The
          selection persists per project via <code>framer.setPluginData</code>{" "}
          so collaborators share the same target. You can still add a config
          file at the root of the uploaded folder (next to your source files):
        </p>

        <p>
          <code
            style={{
              backgroundColor: "var(--framer-color-bg-secondary)",
              padding: "2px 4px",
              borderRadius: 4,
            }}
          >
            framer-code-sync.config.json
          </code>{" "}
          or
          <code
            style={{
              backgroundColor: "var(--framer-color-bg-secondary)",
              padding: "2px 4px",
              borderRadius: 4,
            }}
          >
            {" "}
            framer-code-sync.config.jsonc
          </code>
        </p>
        <p style={{ marginTop: 6 }}>
          JSONC allows comments; both are supported.
        </p>
      </div>

      {/* Config Example */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 6 }}>Config Example</h4>
        <div
          style={{
            padding: 12,
            backgroundColor: "var(--framer-color-bg-secondary)",
            borderRadius: 6,
            height: "fit-content",
            display: "flex",
            flexDirection: "column",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--color-accent)",
              fontSize: 11,
            }}
          >
            framer-code-sync.config.json
          </p>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre",
              fontSize: 10,
              lineHeight: 1.5,
              flex: 1,
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
      "find": "./Mock/Use_current_location.tsx",
      "replace": "https://framer.com/m/UseCurrentLocation-oZyA.js@1l8XdClJld0xwptzsD73"
    }
  ],
  "ignoredFiles": ["./Mock/Use_current_location.tsx"],
  "stringReplacements": [
    { "find": "(api.tasks.get)", "replace": "("tasks:get")" }
  ]
}`}</code>
          </pre>
        </div>
        {/* Notes */}
        <div>
          <ul
            style={{
              // color: "var(--framer-color-text)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <li>
              <b>1. importReplacements</b>: replaces module specifiers (e.g.
              "@x/pkg") with either a <b>relative</b> path to your local bundle
              or a <b>URL</b> for each uploaded file. For example:
            </li>
            <li>
              <b>2. ignoredFiles</b>: entries can be a filename (e.g.
              "Cart.tsx") or a path from the uploaded root (e.g.
              "hooks/Cart.tsx"). Ignored files are not uploaded.
            </li>
            <li>
              <b>3. stringReplacements</b>: performs simple find/replace on file
              contents. Use plain strings for literal matches or regex syntax
              like
              <code>/foo/gi</code> for advanced patterns.
            </li>
            <li>
              <b>4. Relative imports</b>: automatically ensures that all
              relative imports (starting with <code>./</code> or{" "}
              <code>../</code>) end with the <code>.tsx</code> extension, as
              required by the Framer environment.
            </li>
            <li>
              <b>5. Configuration merging</b>: UI settings and config file rules
              are merged together. Config file settings take precedence over UI
              settings when conflicts occur.
            </li>
            <li>
              <b>6. Upload process</b>: Files are created with placeholder
              content first, then updated with the actual transformed content to
              ensure reliable uploads.
            </li>
            <li>
              <b>7. Error handling</b>: If an upload fails, check the browser
              console for detailed error messages. Common issues include
              permission problems or invalid file content.
            </li>
            <li>
              Only <code>.tsx</code> files are uploaded.
            </li>
          </ul>
        </div>
      </div>

      {/* ENV Example */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 6 }}>Env Example</h4>
        <div
          style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: "var(--framer-color-bg-secondary)",
            borderRadius: 6,
            height: "fit-content",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <p
            style={{
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--color-accent)",
              fontSize: 11,
            }}
          >
            Env.tsx
          </p>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre",
              fontSize: 10,
              lineHeight: 1.5,
              flex: 1,
              overflow: "auto",
            }}
          >
            <code>{`export const ENV = {
  BACKEND_URL: {
    development: "http://localhost:8787",
    staging: "https://staging-backend.dev",
    production: "https://production-backend.dev",
  },
  API_KEY: {
    development: "dev-key",
    staging: "staging-key",
    production: "prod-key",
  }
};`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
