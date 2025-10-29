import React, { useRef } from "react";
import { buildFolderStructure, buildMenuItems } from "../lib/utils";
import { CodeFile, framer, MenuItem } from "framer-plugin";

interface ExportFolderDropdownProps {
  codeFiles: CodeFile[];
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
}

export default function ExportFolderDropdown(props: ExportFolderDropdownProps) {
  const folderButtonRef = useRef<HTMLSelectElement>(null);

  const showFolderMenu = async (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!folderButtonRef.current) return;

    const folderMap = buildFolderStructure(props.codeFiles);
    const menuItems = buildMenuItems({
      folderMap,
      parentPath: "",
      codeFiles: props.codeFiles,
      selectedFolder: props.selectedFolder,
      setSelectedFolder: props.setSelectedFolder,
    });

    const allMenuItems: MenuItem[] = [
      {
        label: "All",
        secondaryLabel: `${props.codeFiles.length}`,
        checked: props.selectedFolder === null,
        onAction: () => props.setSelectedFolder(null),
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

  const displayText = props.selectedFolder
    ? props.selectedFolder.replaceAll("/", " → ")
    : "All";

  return (
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
      <div
        onClick={showFolderMenu}
        style={{ width: "100%", cursor: "pointer" }}
      >
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
  );
}
