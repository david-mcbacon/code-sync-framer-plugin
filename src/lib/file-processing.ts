export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

// Helper: compute relative path from uploaded folder root
export const getUploadedRelativePath = (
  file: File,
  unpackToRoot: boolean = true
): string => {
  const withRel = file as File & { webkitRelativePath?: string };
  const fullPath = withRel.webkitRelativePath || file.name;
  const pathParts = fullPath.split("/");

  if (unpackToRoot) {
    // Unpack to root: remove the first directory level
    return pathParts.length > 1 ? pathParts.slice(1).join("/") : pathParts[0];
  } else {
    // Keep folder structure: keep the first directory level
    return fullPath;
  }
};
