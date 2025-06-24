import { auth } from '@clerk/nextjs/server';
import { ProjectResponse } from '@/types/project';
import { API_BASE_URL, handleApiResponse } from '../apiBase';

// Server-only function to get auth headers
async function getServerAuthHeaders() {
  const { getToken } = await auth();
  const token = await getToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Get all projects (server-side)
export async function getAllProjects(status?: string): Promise<ProjectResponse[]> {
  const headers = await getServerAuthHeaders();
  const url = status ? `${API_BASE_URL}/projects/?status=${status}` : `${API_BASE_URL}/projects/`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ProjectResponse[]>(response);
}

// Get single project (server-side)
export async function getProject(projectId: string): Promise<ProjectResponse> {
  const headers = await getServerAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ProjectResponse>(response);
}
