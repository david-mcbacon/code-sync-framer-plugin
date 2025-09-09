import { framer } from "framer-plugin";
import "./App.css";
import { withPermission } from "./utils/permission-utils";

framer.showUI({
  position: "top left",
  width: 360,
  height: 300,
});

export function App() {
  const handleFolderUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    // Convert FileList to Array for easier processing
    const tsxFiles = Array.from(files).filter((file) =>
      file.name.endsWith(".tsx")
    );

    if (tsxFiles.length === 0) {
      console.log("No .tsx files found in the selected folder.");
      return;
    }

    // Get all existing code files in Framer
    const existingFiles = await framer.getCodeFiles();
    const existingFileMap = new Map(
      existingFiles.map((file) => [file.path || file.name, file])
    );

    console.log(`Found ${tsxFiles.length} .tsx files to process`);

    // PHASE 1: Create all files with dummy content
    console.log("Phase 1: Creating files with dummy content...");
    const fileProcessingData: Array<{
      file: File;
      framerPath: string;
      existingFile?: any;
      createdFile?: any;
    }> = [];

    for (const file of tsxFiles) {
      try {
        const fullPath = file.webkitRelativePath || file.name;

        // Remove the first level folder (treat uploaded folder as root)
        const pathParts = fullPath.split("/");
        const framerPath =
          pathParts.length > 1 ? pathParts.slice(1).join("/") : pathParts[0];

        console.log(`Processing: ${fullPath} -> ${framerPath}`);

        // Check if file already exists
        const existingFile = existingFileMap.get(framerPath);

        if (existingFile) {
          // File exists, will update later
          console.log(`File exists, will update: ${framerPath}`);
          fileProcessingData.push({ file, framerPath, existingFile });
        } else {
          // Create new file with dummy content
          console.log(`Creating new file with dummy content: ${framerPath}`);
          const createdFile = await withPermission({
            permission: "createCodeFile",
            action: async () => {
              return await framer.createCodeFile(
                framerPath,
                "export default function Test() { return <div>Test</div> }"
              );
            },
          });
          fileProcessingData.push({ file, framerPath, createdFile });
        }
      } catch (error) {
        console.error(`Error in Phase 1 for file ${file.name}:`, error);
      }
    }

    console.log(
      `Phase 1 completed: ${fileProcessingData.length} files processed`
    );

    // PHASE 2: Replace dummy content with actual content
    console.log("Phase 2: Replacing dummy content with actual content...");
    const updatePromises = fileProcessingData.map(async (data) => {
      try {
        const { file, framerPath, existingFile, createdFile } = data;

        // Read the actual file content
        const actualContent = await readFileContent(file);

        if (existingFile) {
          // Update existing file
          console.log(
            `Updating existing file with actual content: ${framerPath}`
          );
          await existingFile.setFileContent(actualContent);
        } else if (createdFile) {
          // Update newly created file
          console.log(`Updating new file with actual content: ${framerPath}`);
          await createdFile.setFileContent(actualContent);
        }
      } catch (error) {
        console.error(`Error in Phase 2 for file ${data.file.name}:`, error);
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    console.log("Upload completed!");
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleAddOneFile = async () => {
    await withPermission({
      permission: "createCodeFile",
      action: async () => {
        await framer.createCodeFile(
          "hooks-shopify/lol/test.tsx",
          "export default function Test() { return <div>Test</div> }"
        );
      },
    });
  };

  return (
    <main style={{ padding: "20px" }}>
      <h3>Code Sync Plugin</h3>
      <button onClick={handleAddOneFile}>Add One File</button>

      <div style={{ marginBottom: "20px" }}>
        <h4>Upload Folder</h4>
        <p>Upload a folder containing .tsx files to sync with Framer.</p>
        <input
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderUpload}
          style={{
            marginTop: "10px",
            cursor: "pointer",
          }}
        />
      </div>
    </main>
  );
}
