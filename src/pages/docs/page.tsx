export default function Docs() {
  return (
    <div
      style={{
        paddingTop: "10px",
        paddingBottom: "40px",
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
          named "framer-comps"), the plugin will not create a folder with that
          name in Framer. Instead, it unpacks all contents from the selected
          folder directly to the root of your Framer project.
        </p>
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
              color: "var(--framer-color-tint)",
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
    { "find": "(api.tasks.get)", "replace": "(\"tasks:get\")" }
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
              color: "var(--framer-color-tint)",
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
