import { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { framer, type CodeFile, type MenuItem } from "framer-plugin";

export default function ExportPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
	const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
	const folderButtonRef = useRef<HTMLSelectElement>(null);

	useEffect(() => {
		// Subscribe to code file changes
		const unsubscribe = framer.subscribeToCodeFiles((files) => {
			setCodeFiles([...files]);
		});

		// Cleanup subscription on unmount
		return () => {
			unsubscribe();
		};
	}, []);

	// Clear selected folder if it no longer exists after files change
	useEffect(() => {
		if (selectedFolder && codeFiles.length > 0) {
			const folderStillExists = codeFiles.some((file) => {
				const path = file.path || file.name;
				return path.startsWith(`${selectedFolder}/`);
			});

			if (!folderStillExists) {
				setSelectedFolder(null);
			}
		}
	}, [codeFiles, selectedFolder]);

	const buildFolderStructure = (files: CodeFile[]): Map<string, Set<string>> => {
		const folderMap = new Map<string, Set<string>>();

		files.forEach((file) => {
			const path = file.path || file.name;
			if (path.includes("/")) {
				const parts = path.split("/");
				parts.pop(); // Remove filename

				// Build all folder paths
				let currentPath = "";
				parts.forEach((part) => {
					const parentPath = currentPath;
					currentPath = currentPath ? `${currentPath}/${part}` : part;

					if (!folderMap.has(parentPath)) {
						folderMap.set(parentPath, new Set());
					}
					folderMap.get(parentPath)!.add(currentPath);
				});
			}
		});

		return folderMap;
	};

	const countFilesInFolder = (folderPath: string): number => {
		return codeFiles.filter((file) => {
			const path = file.path || file.name;
			return path.startsWith(`${folderPath}/`);
		}).length;
	};

	const buildMenuItems = (
		folderMap: Map<string, Set<string>>,
		parentPath: string = ""
	): MenuItem[] => {
		const subfolders = folderMap.get(parentPath);
		if (!subfolders || subfolders.size === 0) {
			return [];
		}

		return Array.from(subfolders)
			.sort()
			.map((folderPath) => {
				const folderName = folderPath.split("/").pop() || folderPath;
				const children = buildMenuItems(folderMap, folderPath);
				const fileCount = countFilesInFolder(folderPath);

				// If this folder has subfolders, add "All" option as first item in submenu
				const submenu =
					children.length > 0
						? [
								{
									label: "All",
									secondaryLabel: `${fileCount}`,
									checked: selectedFolder === folderPath,
									onAction: () => setSelectedFolder(folderPath),
								},
								{ type: "separator" as const },
								...children,
							]
						: undefined;

				return {
					label: folderName,
					secondaryLabel: `${fileCount}`,
					checked: selectedFolder === folderPath,
					onAction: children.length === 0 ? () => setSelectedFolder(folderPath) : undefined,
					submenu,
				};
			});
	};

	const showFolderMenu = async (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();

		if (!folderButtonRef.current) return;

		const folderMap = buildFolderStructure(codeFiles);
		const menuItems = buildMenuItems(folderMap);

		const allMenuItems: MenuItem[] = [
			{
				label: "All",
				secondaryLabel: `${codeFiles.length}`,
				checked: selectedFolder === null,
				onAction: () => setSelectedFolder(null),
			},
			{ type: "separator" },
			...menuItems,
		];

		const rect = folderButtonRef.current.getBoundingClientRect();

		await framer.showContextMenu(allMenuItems, {
			location: {
				x: rect.left,
				y: rect.top - 8,
			},
			width: rect.width + 8,
		});
	};

	const getFilteredFiles = (): CodeFile[] => {
		if (!selectedFolder) return codeFiles;

		return codeFiles.filter((file) => {
			const path = file.path || file.name;
			return path.startsWith(`${selectedFolder}/`);
		});
	};

	const handleExport = async () => {
		setIsLoading(true);

		try {
			// Get filtered code files
			const filesToExport = getFilteredFiles();

			if (filesToExport.length === 0) {
				setIsLoading(false);
				framer.notify(
					selectedFolder
						? `No code files found in folder "${selectedFolder}".`
						: "No code files found in this project."
				);
				return;
			}

			const fileCount = filesToExport.length;
			const fileWord = fileCount === 1 ? "file" : "files";

			// If only one file, download it directly without zipping
			if (fileCount === 1) {
				const codeFile = filesToExport[0];
				const fileName = codeFile.path || codeFile.name;
				const blob = new Blob([codeFile.content], { type: "text/plain" });

				// Create a download link and trigger the download
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				setIsLoading(false);
				framer.notify(`Successfully exported ${fileName}!`, { variant: "success" });
				return;
			}

			// Create a new JSZip instance for multiple files
			const zip = new JSZip();

			// Add each code file to the zip
			for (const codeFile of filesToExport) {
				const filePath = codeFile.path || codeFile.name;
				zip.file(filePath, codeFile.content);
			}

			let name = "framer-code-files";

			// If a folder is selected, use the folder name
			if (selectedFolder) {
				const folderName = selectedFolder.split("/").pop() || selectedFolder;
				name = folderName;
			} else {
				// Otherwise, use the project name
				try {
					const projectInfo = await framer.getProjectInfo();
					if (projectInfo.name) {
						name = projectInfo.name;
					}
				} catch (error) {
					console.error("Error getting project info:", error);
				}
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

	const filteredFiles = getFilteredFiles();
	const displayText = selectedFolder ? selectedFolder.replaceAll("/", " → ") : "All";
	const fileCount = filteredFiles.length;

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
			{/* Folder Filter */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					justifyItems: "start",
					alignItems: "start",
					gap: "2px",
					width: "100%",
					paddingTop: "4px",
				}}
			>
				<p
					style={{
						fontSize: "12px",
						color: "var(--framer-color-text-secondary)",
						userSelect: "none",
					}}
				>
					Folder
				</p>
				<div onClick={showFolderMenu} style={{ width: "100%", cursor: "pointer" }}>
					<select
						id="folder"
						ref={folderButtonRef}
						value=""
						tabIndex={-1}
						style={{
							width: "100%",
							padding: "4px 8px",
							borderRadius: "8px",
							border: "1px solid var(--framer-color-bg-tertiary)",
							backgroundColor: "rgba(255,255,255,0.05)",
							minHeight: "26px",
							pointerEvents: "none",
							userSelect: "none",
						}}
					>
						<option value="">{displayText}</option>
					</select>
				</div>
			</div>

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
							textWrap: "balance",
						}}
					>
						{selectedFolder
							? fileCount === 1
								? `Download 1 file from "${selectedFolder}".`
								: `Download ${fileCount} files from "${selectedFolder}" as a zip file.`
							: fileCount === 1
								? "Download all code files in this project."
								: "Download all code files in this project as a zip file."}
					</p>
					<button
						className="framer-button-primary"
						style={{ marginTop: "25px" }}
						onClick={handleExport}
						disabled={isLoading || fileCount === 0}
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
