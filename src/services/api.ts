import axios from 'axios';
import type { MediaFile, UploadPayload } from '../types/media';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/mediastore/api';

const api = axios.create({ baseURL: BASE_URL });

export async function fetchMediaFiles(): Promise<MediaFile[]> {
  const { data } = await api.get<MediaFile[]>('/images');
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
