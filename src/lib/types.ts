export type ImportReplacementRule = { find: string; replace: string };

export type CodeSyncConfig = {
  version?: number;
  importReplacements?: ImportReplacementRule[];
  ignoredFiles?: string[];
  envReplacement?: boolean;
};

export type FramerCodeFile = {
  path?: string;
  name: string;
  setFileContent: (code: string) => Promise<unknown>;
};

export type FileProcessingData = {
  file: File;
  framerPath: string;
  existingFile?: FramerCodeFile;
  createdFile?: FramerCodeFile;
};
