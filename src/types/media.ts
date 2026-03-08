export type MediaCategory = 'image' | 'video' | 'other';

export interface MediaFile {
  id: string;
  filename: string;
  description: string;
  category: MediaCategory;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

export interface UploadPayload {
  file: File;
  description: string;
  category: MediaCategory;
}
