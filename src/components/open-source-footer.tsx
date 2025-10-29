export default function OpenSourceFooter() {
  return (
    <div style={{ width: "100%" }}>
      <p
        style={{
          fontSize: "11px",
          lineHeight: "1.3",
          padding: "10px 10px 0px 10px",
          color: "var(--framer-color-text-tertiary)",
          textAlign: "center",
        }}
      >
        It&apos;s open source! Jump into the
        <a
          href="https://github.com/david-mcbacon/code-sync-framer-plugin"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--framer-color-tint)",
          }}
        >
          {" "}
          GitHub repo{" "}
        </a>
        and help make it even better.
      </p>
    </div>
  );
}
