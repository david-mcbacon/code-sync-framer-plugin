export default function Docs() {
  return (
    <div
      style={{
        paddingTop: "15px",
        paddingBottom: "40px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        color: "var(--framer-color-text)",
      }}
    >
      <h4>Environment & Configuration</h4>
      <p style={{ marginTop: "6px" }}>
        Use the environment selector on the upload page above the upload panel
        to choose which env should replace <code>ENV</code> references. The
        selection persists per project via <code>framer.setPluginData</code> so
        collaborators share the same target. You can still add a config file at
        the root of the uploaded folder (next to your source files):
      </p>
      <ul style={{ marginTop: 8 }}>
        <li>
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
        </li>
        <li>JSONC allows comments; both are supported.</li>
      </ul>

      {/* Config Example */}
      <div style={{ fontWeight: 600, marginTop: 16 }}>Config Example</div>
      <div
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: "var(--framer-color-bg-secondary)",
          borderRadius: 6,
          height: "400px",
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

      {/* ENV Example */}
      <div style={{ fontWeight: 600, marginTop: 16 }}>Env Example</div>
      <div
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: "var(--framer-color-bg-secondary)",
          borderRadius: 6,
          height: "400px",
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
  }
};`}</code>
        </pre>
      </div>

      {/* Notes */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Notes</div>
        <ul
          style={{
            color: "var(--framer-color-text)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <li>
            <b>importReplacements</b>: replaces module specifiers (e.g.
            "@x/pkg") with either a <b>relative</b> path to your local bundle or
            a <b>URL</b> for each uploaded file. For example:
          </li>
          <li>
            <b>ignoredFiles</b>: entries can be a filename (e.g. "Cart.tsx") or
            a path from the uploaded root (e.g. "hooks/Cart.tsx"). Ignored files
            are not uploaded.
          </li>
          <li>
            <b>stringReplacements</b>: performs simple find/replace on file
            contents. Use plain strings for literal matches or regex syntax like
            <code>/foo/gi</code> for advanced patterns.
          </li>
          <li>
            Only <code>.tsx</code> files are uploaded.
          </li>
        </ul>
      </div>
    </div>
  );
}
