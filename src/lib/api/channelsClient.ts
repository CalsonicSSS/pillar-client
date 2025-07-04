import { GmailOAuthResponse } from '@/types/oauth';
import { API_BASE_URL, handleApiResponse } from '../apiBase';
import { ChannelResponse, ChannelDeletionResponse, ChannelInitializeResponse, ChannelMetricsResponse } from '@/types/channel';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Get all channels for a project
export async function getProjectChannels(projectId: string, token: string): Promise<ChannelResponse[]> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/channels/project/${projectId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ChannelResponse[]>(response);
}

// Get single channel
export async function getChannel(channelId: string, token: string): Promise<ChannelResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/channels/${channelId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ChannelResponse>(response);
}

// Initialize Gmail channel (create + check for existing OAuth)
export async function initializeGmailChannel(projectId: string, token: string): Promise<ChannelInitializeResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/gmail/channel/initialize/${projectId}`, {
    method: 'POST',
    headers,
  });

  return await handleApiResponse<ChannelInitializeResponse>(response);
}

// Delete channel
export async function deleteChannel(channelId: string, token: string): Promise<ChannelDeletionResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/channels/${channelId}`, {
    method: 'DELETE',
    headers,
  });

  return await handleApiResponse<ChannelDeletionResponse>(response);
}

// Get Gmail OAuth URL for new channel
export async function getGmailOAuthUrl(channelId: string, token: string): Promise<GmailOAuthResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/gmail/channel/oauth/${channelId}`, {
    method: 'POST',
    headers,
  });

  return await handleApiResponse<GmailOAuthResponse>(response);
}

// Re-authenticate Gmail (for expired tokens)
export async function reAuthenticateGmail(token: string): Promise<GmailOAuthResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/gmail/channel/reoauth`, {
    method: 'POST',
    headers,
  });

  return await handleApiResponse<GmailOAuthResponse>(response);
}

// ----------------------------------------------------------------------------

export async function getChannelMetrics(channelId: string, token: string): Promise<ChannelMetricsResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/channels/${channelId}/metrics`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ChannelMetricsResponse>(response);
}
