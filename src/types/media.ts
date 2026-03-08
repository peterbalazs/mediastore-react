export interface MediaFile {
  id: string;
  fileName: string;
  description: string;
  category: string;
  uploadDate: string;
  originalFileSize: number;
  imageUrl: string;
  thumbnailUrl?: string;
  imageFileUuid: string;
  thumbnailFileUuid: string;
  encoder?: string | null;
  container?: string | null;
  location?: string | null;
  creationDate?: string | null;
  width?: number | null;
  height?: number | null;
  bitDepth?: number | null;
  pixelFormat?: string | null;
  codec?: string | null;
  formatName?: string | null;
}

export interface UploadPayload {
  file: File;
  fileName: string;
  description: string;
  category: string;
}
