import axios from 'axios';
import type { MediaFile, UploadPayload } from '../types/media';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const api = axios.create({ baseURL: BASE_URL });

export async function fetchMediaFiles(): Promise<MediaFile[]> {
  const { data } = await api.get<MediaFile[]>('/media');
  return Array.isArray(data) ? data : [];
}

export async function deleteMediaFile(id: string): Promise<void> {
  await api.delete(`/media/${id}`);
}

export async function uploadMediaFile(payload: UploadPayload): Promise<MediaFile> {
  const form = new FormData();
  form.append('file', payload.file);
  form.append('description', payload.description);
  form.append('category', payload.category);
  const { data } = await api.post<MediaFile>('/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
