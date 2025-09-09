import { framer } from "framer-plugin";
import "./App.css";
import FolderUpload from "./components/folder-upload";
import ImportReplacements from "./components/import-replacements";

framer.showUI({
  position: "top left",
  width: 360,
  height: 520,
});

export function App() {
  return (
    <main style={{ padding: "20px" }}>
      <FolderUpload />
      <ImportReplacements />
    </main>
  );
}
