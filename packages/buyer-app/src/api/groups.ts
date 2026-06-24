import { api } from './client';

export interface StartGroupParams {
  productId: string;
  durationHours?: number;
}

export async function getGroups(params?: { productId?: string; status?: string }) {
  const response = await api.get('/groups', { params });
  return response.data;
}

export async function getGroupById(id: string) {
  const response = await api.get(`/groups/${id}`);
  return response.data;
}

export async function startGroup(params: StartGroupParams) {
  const response = await api.post('/groups/start', params);
  return response.data;
}

export async function joinGroup(sessionId: string) {
  const response = await api.post(`/groups/${sessionId}/join`);
  return response.data;
}

export async function getLiveCounts() {
  const response = await api.get('/groups/live');
  return response.data;
}
