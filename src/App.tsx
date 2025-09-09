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

    // Process all files in parallel for better performance
    const filePromises = tsxFiles.map(async (file) => {
      try {
        const content = await readFileContent(file);
        const fullPath = file.webkitRelativePath || file.name;

        // Remove the first level folder (treat uploaded folder as root)
        const pathParts = fullPath.split("/");
        const framerPath =
          pathParts.length > 1 ? pathParts.slice(1).join("/") : pathParts[0];

        console.log(`Processing: ${fullPath} -> ${framerPath}`);

        // Check if file already exists
        const existingFile = existingFileMap.get(framerPath);

        if (existingFile) {
          // Update existing file
          console.log(`Updating existing file: ${framerPath}`);
          await existingFile.setFileContent(content);
        } else {
          // Create new file
          console.log(`Creating new file: ${framerPath}`);
          await withPermission({
            permission: "createCodeFile",
            action: async () => {
              await framer.createCodeFile(framerPath, content);
            },
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    });

    // Wait for all files to be processed in parallel
    await Promise.all(filePromises);

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
