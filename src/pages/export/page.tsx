import { useState } from "react";
import JSZip from "jszip";
import { framer } from "framer-plugin";

export default function ExportPage() {
	const [isLoading, setIsLoading] = useState(false);

	const handleExport = async () => {
		setIsLoading(true);

		try {
			// Get all code files from the Framer project
			const codeFiles = await framer.getCodeFiles();

			if (codeFiles.length === 0) {
				setIsLoading(false);
				framer.notify("No code files found in this project.");
				return;
			}

			const fileCount = codeFiles.length;
			const fileWord = fileCount === 1 ? "file" : "files";

			// Create a new JSZip instance
			const zip = new JSZip();

			// Add each code file to the zip
			for (const codeFile of codeFiles) {
				const filePath = codeFile.path || codeFile.name;
				zip.file(filePath, codeFile.content);
			}

			let name = "framer-code-files";

			try {
				const projectInfo = await framer.getProjectInfo();
				if (projectInfo.name) {
					name = projectInfo.name;
				}
			} catch (error) {
				console.error("Error getting project info:", error);
			}

			// Generate the zip file
			const zipBlob = await zip.generateAsync({ type: "blob" });

			// Create a download link and trigger the download
			const url = URL.createObjectURL(zipBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${name}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			setIsLoading(false);
			framer.notify(`Successfully exported ${fileCount} code ${fileWord}!`, { variant: "success" });
		} catch (error) {
			console.error("Export failed:", error);
			setIsLoading(false);
			framer.notify(`Export failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
				variant: "error",
				durationMs: Infinity,
			});
		}
	};

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
					<button
						className="framer-button-primary"
						style={{ marginTop: "25px" }}
						onClick={handleExport}
					>
						{isLoading ? <div className="framer-spinner" /> : "Export"}
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
