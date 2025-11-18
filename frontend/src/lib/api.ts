const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Projects
export const projectsAPI = {
  list: () => fetchAPI('/api/projects'),
  get: (id: string) => fetchAPI(`/api/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    fetchAPI('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string }) =>
    fetchAPI(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/api/projects/${id}`, { method: 'DELETE' }),
};

// Prompts
export const promptsAPI = {
  list: (projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return fetchAPI(`/api/prompts${query}`);
  },
  get: (id: string) => fetchAPI(`/api/prompts/${id}`),
  create: (data: { projectId: string; name: string; description?: string }) =>
    fetchAPI('/api/prompts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string }) =>
    fetchAPI(`/api/prompts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/api/prompts/${id}`, { method: 'DELETE' }),
  createVersion: (id: string, data: { versionTag: string; templateText: string }) =>
    fetchAPI(`/api/prompts/${id}/versions`, { method: 'POST', body: JSON.stringify(data) }),
  getVersions: (id: string) => fetchAPI(`/api/prompts/${id}/versions`),
};

// Datasets
export const datasetsAPI = {
  list: (projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return fetchAPI(`/api/datasets${query}`);
  },
  get: (id: string) => fetchAPI(`/api/datasets/${id}`),
  create: (data: { projectId: string; name: string; description?: string; specJson?: string }) =>
    fetchAPI('/api/datasets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string; specJson?: string }) =>
    fetchAPI(`/api/datasets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/api/datasets/${id}`, { method: 'DELETE' }),
  uploadItems: (id: string, items: any[]) =>
    fetchAPI(`/api/datasets/${id}/items`, { method: 'POST', body: JSON.stringify({ items }) }),
  getItems: (id: string) => fetchAPI(`/api/datasets/${id}/items`),
};

// Experiments
export const experimentsAPI = {
  list: (projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return fetchAPI(`/api/experiments${query}`);
  },
  get: (id: string) => fetchAPI(`/api/experiments/${id}`),
  create: (data: { projectId: string; name: string; description?: string; model: string }) =>
    fetchAPI('/api/experiments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string; model?: string }) =>
    fetchAPI(`/api/experiments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAPI(`/api/experiments/${id}`, { method: 'DELETE' }),
  createRun: (id: string, data: { promptVersionId: string; datasetId: string }) =>
    fetchAPI(`/api/experiments/${id}/runs`, { method: 'POST', body: JSON.stringify(data) }),
  getRuns: (id: string) => fetchAPI(`/api/experiments/${id}/runs`),
  getRun: (id: string, runId: string) => fetchAPI(`/api/experiments/${id}/runs/${runId}`),
  getRunResults: (id: string, runId: string) =>
    fetchAPI(`/api/experiments/${id}/runs/${runId}/results`),
};
