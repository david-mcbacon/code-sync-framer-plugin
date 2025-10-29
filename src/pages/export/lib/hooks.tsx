import { CodeFile, framer } from "framer-plugin";
import { useEffect, useState } from "react";

export function useSubscribeToCodeFiles() {
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);

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

  return codeFiles;
}

export function useClearSelectedFolder({
  selectedFolder,
  setSelectedFolder,
  codeFiles,
}: {
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
  codeFiles: CodeFile[];
}) {
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
}
