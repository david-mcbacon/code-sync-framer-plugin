export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

// Helper: compute relative path from uploaded folder root
export const getUploadedRelativePath = (file: File): string => {
  const withRel = file as File & { webkitRelativePath?: string };
  const fullPath = withRel.webkitRelativePath || file.name;
  const pathParts = fullPath.split("/");
  return pathParts.length > 1 ? pathParts.slice(1).join("/") : pathParts[0];
};
