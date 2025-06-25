import { API_BASE_URL, handleApiResponse } from '../apiBase';
import { GmailMessageFetchRequest, GmailMessageFetchResponse } from '@/types/messageFetch';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Fetch and store Gmail messages for contacts
export async function fetchGmailMessages(fetchRequest: GmailMessageFetchRequest, token: string): Promise<GmailMessageFetchResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/gmail/message/fetch`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fetchRequest),
  });

  return await handleApiResponse<GmailMessageFetchResponse>(response);
}
