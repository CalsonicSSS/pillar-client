import { API_BASE_URL, handleApiResponse } from '../apiBase';
import { ContactResponse, ContactCreate, ContactUpdate, ContactDeletionResponse } from '@/types/contact';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Get all contacts for a channel
export async function getChannelContacts(channelId: string, token: string): Promise<ContactResponse[]> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/contacts/channel/${channelId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ContactResponse[]>(response);
}

// Get single contact
export async function getContact(contactId: string, token: string): Promise<ContactResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<ContactResponse>(response);
}

// Create new contact
export async function createContact(contactData: ContactCreate, token: string): Promise<ContactResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/contacts/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(contactData),
  });

  return await handleApiResponse<ContactResponse>(response);
}

// Update contact
export async function updateContact(contactId: string, updateData: ContactUpdate, token: string): Promise<ContactResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updateData),
  });

  return await handleApiResponse<ContactResponse>(response);
}

// Delete contact
export async function deleteContact(contactId: string, token: string): Promise<ContactDeletionResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
    method: 'DELETE',
    headers,
  });

  return await handleApiResponse<ContactDeletionResponse>(response);
}
