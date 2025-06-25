import { API_BASE_URL, handleApiResponse } from '../apiBase';
import { TimelineRecapResponse } from '@/types/timelineRecap';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Get timeline recap for project
export async function getProjectTimelineRecap(projectId: string, token: string): Promise<TimelineRecapResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/timeline-recap/project/${projectId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<TimelineRecapResponse>(response);
}

// Initialize timeline recap data structure for project
export async function initializeProjectTimelineRecap(projectId: string, token: string): Promise<TimelineRecapResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/timeline-recap/project/${projectId}/initialize`, {
    method: 'POST',
    headers,
  });

  return await handleApiResponse<TimelineRecapResponse>(response);
}

// Generate AI summaries for timeline recap
export async function generateTimelineRecapSummaries(projectId: string, token: string): Promise<TimelineRecapResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/timeline-recap/project/${projectId}/generate-summaries`, {
    method: 'POST',
    headers,
  });

  return await handleApiResponse<TimelineRecapResponse>(response);
}
