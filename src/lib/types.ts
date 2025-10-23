export type ImportReplacementRule = { find: string; replace: string };

export type StringReplacementRule = { find: string; replace: string };

export type EnvReplacementRule = {
  from: string;
  to: string;
};

export type CodeSyncConfig = {
  version?: number;
  importReplacements?: ImportReplacementRule[];
  ignoredFiles?: string[];
  stringReplacements?: StringReplacementRule[];
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

export type UploadState =
  | "idle"
  | "loading"
  | "success"
  | "error"
  | "no-changes";
