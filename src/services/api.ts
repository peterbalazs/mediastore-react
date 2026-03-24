import axios from 'axios';
import type { MediaFile, UploadPayload } from '../types/media';
import type {
  ImportJob,
  ImportJobStatistics,
  CreateImportJobPayload,
} from '../types/importJob';
import type { MusicFile } from '../types/music';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/mediastore/api';

const api = axios.create({ baseURL: BASE_URL });

export async function fetchMediaFiles(signal?: AbortSignal): Promise<MediaFile[]> {
  const { data } = await api.get<MediaFile[]>('/images', { signal });
  return Array.isArray(data) ? data : [];
}

export async function deleteMediaFile(id: string): Promise<void> {
  await api.delete(`/images/${id}`);
}

export async function uploadMediaFile(payload: UploadPayload): Promise<void> {
  const form = new FormData();
  form.append('file', payload.file);
  const details = JSON.stringify({
    fileName: payload.fileName,
    imageDescription: payload.description,
    category: payload.category,
  });
  form.append('details', new Blob([details], { type: 'application/json' }));
  await api.post('/images', form);
}

export async function fetchImportJobs(): Promise<ImportJob[]> {
  const { data } = await api.get<ImportJob[]>('/import-jobs');
  return Array.isArray(data) ? data : [];
}

export async function createImportJob(
  payload: CreateImportJobPayload,
): Promise<ImportJob> {
  const { data } = await api.post<ImportJob>('/import-jobs', payload);
  return data;
}

export async function runImportJob(id: string): Promise<ImportJob> {
  const { data } = await api.put<ImportJob>(`/import-jobs/${id}`);
  return data;
}

export async function fetchImportJobStatistics(
  id: string,
): Promise<ImportJobStatistics> {
  const { data } = await api.get<ImportJobStatistics>(`/import-jobs/${id}`);
  return data;
}

export async function acknowledgeImportJob(id: string): Promise<ImportJob> {
  const { data } = await api.put<ImportJob>(`/import-jobs/${id}/acknowledge`);
  return data;
}

export async function fetchMusicFiles(signal?: AbortSignal): Promise<MusicFile[]> {
  const { data } = await api.get<MusicFile[]>('/music', { signal });
  return Array.isArray(data) ? data : [];
}

export async function downloadMusic(url: string): Promise<MusicFile> {
  const { data } = await api.post<MusicFile>('/music/download', { url });
  return data;
}

export async function downloadOriginalFile(file: MediaFile): Promise<void> {
  const { data } = await axios.get(file.imageUrl, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

