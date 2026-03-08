import type { MediaFile } from '../types/media';

export const VIDEO_ENCODERS = new Set([
  'H264', 'H265', 'VP8', 'VP9', 'AV1', 'MPEG2', 'MPEG4', 'PRORES', 'DNxHD', 'THEORA',
]);

export function isVideoFile(file: MediaFile): boolean {
  return VIDEO_ENCODERS.has(file.encoder?.toUpperCase() ?? '') || !!file.container;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
