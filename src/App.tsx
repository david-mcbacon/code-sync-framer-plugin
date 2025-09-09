import { framer } from "framer-plugin";
import "./App.css";
import FolderUpload from "./components/folder-upload";

framer.showUI({
  position: "top left",
  width: 360,
  height: 300,
});

export function App() {
  return (
    <main style={{ padding: "20px" }}>
      <FolderUpload />
    </main>
  );
}
