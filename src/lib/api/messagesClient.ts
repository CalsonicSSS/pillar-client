import { API_BASE_URL, handleApiResponse } from '../apiBase';
import { MessageResponse, MessageFilter, MessageUpdate } from '@/types/message';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Get messages with filters
export async function getMessagesWithFilters(filters: MessageFilter, token: string): Promise<MessageResponse[]> {
  const headers = createAuthHeaders(token);

  // Build query parameters
  const queryParams = new URLSearchParams();

  if (filters.project_id) queryParams.set('project_id', filters.project_id);
  if (filters.channel_id) queryParams.set('channel_id', filters.channel_id);
  if (filters.contact_id) queryParams.set('contact_id', filters.contact_id);
  if (filters.thread_id) queryParams.set('thread_id', filters.thread_id);
  if (filters.start_date) queryParams.set('start_date', filters.start_date);
  if (filters.end_date) queryParams.set('end_date', filters.end_date);
  if (filters.is_read !== undefined) queryParams.set('is_read', filters.is_read.toString());
  if (filters.is_from_contact !== undefined) queryParams.set('is_from_contact', filters.is_from_contact.toString());

  queryParams.set('limit', filters.limit.toString());
  queryParams.set('offset', filters.offset.toString());

  const response = await fetch(`${API_BASE_URL}/messages/?${queryParams.toString()}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<MessageResponse[]>(response);
}

// Get single message by ID
export async function getMessage(messageId: string, token: string): Promise<MessageResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<MessageResponse>(response);
}

// Mark message as read
export async function markMessageAsRead(messageId: string, isRead: boolean, token: string): Promise<MessageResponse> {
  const headers = createAuthHeaders(token);

  const updateData: MessageUpdate = {
    is_read: isRead,
  };

  const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updateData),
  });

  return await handleApiResponse<MessageResponse>(response);
}
