export default function Docs() {
  return (
    <div
      style={{
        paddingTop: "15px",
        paddingBottom: "20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      <h4>Configuration via framer-code-sync.config.json/jsonc</h4>
      <p style={{ color: "#ababab", marginTop: "6px" }}>
        This plugin now uses a file-based config. Add a config file at the root
        of the uploaded folder (next to your source files):
      </p>
      <ul style={{ marginTop: 8, color: "#ababab" }}>
        <li>
          <code>framer-code-sync.config.json</code> or
          <code> framer-code-sync.config.jsonc</code>
        </li>
        <li>JSONC allows comments; both are supported.</li>
      </ul>

      <div
        style={{
          marginTop: 12,
          padding: 12,
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 6,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Example</div>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          <code>{`{
  "version": 1,
  "importReplacements": [
    { "search": "@tanstack/react-query", "bundlePath": "./bundles/Tanstack_query.tsx" }
  ],
  "ignoredFiles": [
    "Cart.tsx",
    "hooks/Cart.tsx"
  ],
  "envReplacement": true
}`}</code>
        </pre>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Notes</div>
        <ul
          style={{
            color: "#ababab",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <li>
            <b>importReplacements</b>: replaces module specifiers (e.g.
            "@x/pkg") with a <b>relative</b> path to your local bundle for each
            uploaded file.
          </li>
          <li>
            <b>ignoredFiles</b>: entries can be a filename (e.g. "Cart.tsx") or
            a path from the uploaded root (e.g. "hooks/Cart.tsx"). Ignored files
            are not uploaded.
          </li>
          <li>
            <b>envReplacement</b>: when true, converts ENV.<i>key</i>
            .development to ENV.<i>key</i>.production during upload.
          </li>
          <li>
            Only <code>.tsx</code> files are uploaded.
          </li>
        </ul>
      </div>
    </div>
  );
}
