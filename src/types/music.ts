export interface MusicFile {
  id: string;
  fileUuid: string;
  fileName: string;
  title?: string;
  releaseYear?: number;
  album?: string;
  artists?: string[];
  genres?: string[];
  uuid: string;
  streamUrl: string;
  downloadUrl: string;
}

export interface TopItem {
  name: string;
  songCount: number;
}

export interface UpdateMusicPayload {
  fileName?: string;
  title?: string;
  releaseYear?: number | null;
  album?: string;
  artists?: string[];
  genres?: string[];
}

