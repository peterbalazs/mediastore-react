export type DuplicateAction = 'KEEP_BOTH' | 'KEEP_ORIGINAL' | 'KEEP_NEW';

export type ImportJobStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ACKNOWLEDGED';

export interface ImportJob {
  id: string;
  creationDate: string;
  sourceFolder: string;
  category: string;
  duplicateAction: DuplicateAction;
  includeSubFolders: boolean;
  jobStatus: ImportJobStatus;
  errorMessage: string | null;
}

export interface ImportJobStatistics {
  totalImagesFound: number;
  totalImagesImported: number;
  totalImagesFailed: number;
  duplicatesFound: number;
}

export interface CreateImportJobPayload {
  sourceFolder: string;
  category: string;
  duplicateAction: DuplicateAction;
  includeSubFolders: boolean;
}
