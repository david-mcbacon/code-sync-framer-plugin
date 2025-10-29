import { useState } from "react";
import UploadSettings from "./components/upload-settings";
import OpenSourceFooter from "../../components/open-source-footer";
import DropZone from "./components/drop-zone";

export default function FolderUploadPage() {
  const [overwriteAll, setOverwriteAll] = useState(false);
  const [envTarget, setEnvTarget] = useState<string>("production");
  const [unpackToRoot, setUnpackToRoot] = useState(true);
  const [uploadMode, setUploadMode] = useState<"folder" | "files">("folder");

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
      <UploadSettings
        envTarget={envTarget}
        setEnvTarget={setEnvTarget}
        overwriteAll={overwriteAll}
        setOverwriteAll={setOverwriteAll}
        unpackToRoot={unpackToRoot}
        setUnpackToRoot={setUnpackToRoot}
        uploadMode={uploadMode}
        setUploadMode={setUploadMode}
      />
      <DropZone
        overwriteAll={overwriteAll}
        unpackToRoot={unpackToRoot}
        uploadMode={uploadMode}
      />
      <OpenSourceFooter />
    </div>
  );
}
