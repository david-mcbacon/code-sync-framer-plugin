import { CodeFile, MenuItem, SeparatorMenuItem } from "framer-plugin";

export const buildFolderStructure = (
  files: CodeFile[]
): Map<string, Set<string>> => {
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

const countFilesInFolder = (
  folderPath: string,
  codeFiles: CodeFile[]
): number => {
  return codeFiles.filter((file) => {
    const path = file.path || file.name;
    return path.startsWith(`${folderPath}/`);
  }).length;
};

export const buildMenuItems = ({
  folderMap,
  parentPath = "",
  codeFiles,
  selectedFolder,
  setSelectedFolder,
}: {
  folderMap: Map<string, Set<string>>;
  parentPath: string;
  codeFiles: CodeFile[];
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
}): MenuItem[] => {
  const subfolders = folderMap.get(parentPath);
  if (!subfolders || subfolders.size === 0) {
    return [];
  }

  return Array.from(subfolders)
    .sort()
    .map((folderPath) => {
      const folderName = folderPath.split("/").pop() || folderPath;
      const children = buildMenuItems({
        folderMap,
        parentPath: folderPath,
        codeFiles,
        selectedFolder,
        setSelectedFolder,
      });
      const fileCount = countFilesInFolder(folderPath, codeFiles);

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
              { type: "separator" } as SeparatorMenuItem,
              ...children,
            ]
          : undefined;

      return {
        label: folderName,
        secondaryLabel: `${fileCount}`,
        checked: selectedFolder === folderPath,
        onAction:
          children.length === 0
            ? () => setSelectedFolder(folderPath)
            : undefined,
        submenu,
      };
    });
};

export const getFilteredFiles = (
  selectedFolder: string | null,
  codeFiles: CodeFile[]
): CodeFile[] => {
  if (!selectedFolder) return codeFiles;

  return codeFiles.filter((file) => {
    const path = file.path || file.name;
    return path.startsWith(`${selectedFolder}/`);
  });
};
