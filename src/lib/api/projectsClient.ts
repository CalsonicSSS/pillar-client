import { ProjectCreate, ProjectResponse, ProjectUpdate, ProjectMetricsResponse } from '@/types/project';
import { API_BASE_URL, handleApiResponse } from '../apiBase';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Create new project
export async function createProject(projectData: ProjectCreate, token: string): Promise<ProjectResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/projects/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(projectData),
  });

  return await handleApiResponse<ProjectResponse>(response);
}

// Get single project
export async function getProject(projectId: string, token: string): Promise<ProjectResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ProjectResponse>(response);
}

// Update project
export async function updateProject(projectId: string, updateData: ProjectUpdate, token: string): Promise<ProjectResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updateData),
  });

  return await handleApiResponse<ProjectResponse>(response);
}

// Initialize timeline recap for project
export async function initializeProjectTimelineRecap(projectId: string, token: string): Promise<any> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/timeline-recap/project/${projectId}/initialize`, {
    method: 'POST',
    headers,
  });

  return await handleApiResponse<any>(response);
}

// ##################################################################################################

export async function getProjectMetrics(projectId: string, token: string): Promise<ProjectMetricsResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/metrics`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ProjectMetricsResponse>(response);
}
