import { useState } from "react";

type ExportState = "idle" | "loading" | "success" | "error";

export default function ExportPage() {
	const [exportState, setExportState] = useState<ExportState>("idle");

	return (
		<div
			style={{
				height: "100%",
				width: "100%",
				position: "relative",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<div style={{ flex: 1, width: "100%" }}>
				<div
					style={{
						padding: "40px 20px",
						height: "100%",
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						position: "relative",
					}}
				>
					<div
						style={{
							fontSize: "48px",
							marginBottom: "10px",
							opacity: 0.7,
							userSelect: "none",
						}}
					>
						📁
					</div>

					<p
						style={{
							margin: "0",
							color: "var(--framer-color-text-secondary)",
							fontWeight: "500",
							fontSize: "14px",
						}}
					>
						Export code files
					</p>
					<p
						style={{
							marginTop: "5px",
							color: "var(--framer-color-text-tertiary)",
							fontSize: "12px",
							textWrap: "balance",
						}}
					>
						Download all code files in this project as a zip file.
					</p>
					<button className="framer-button-primary" style={{ marginTop: "25px" }}>
						Export
					</button>
				</div>
			</div>
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
