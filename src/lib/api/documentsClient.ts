import { API_BASE_URL, handleApiResponse } from '../apiBase';
import { DocumentResponse, DocumentDeletionResponse, DocumentDownloadResponse } from '@/types/document';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Helper function to create headers with token for JSON
function createAuthHeadersJSON(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Get all documents for a project
export async function getProjectDocuments(projectId: string, token: string, source?: 'email' | 'manual'): Promise<DocumentResponse[]> {
  const headers = createAuthHeadersJSON(token);

  let url = `${API_BASE_URL}/documents/${projectId}`;
  if (source) {
    url += `?source=${source}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<DocumentResponse[]>(response);
}

// Upload document to project
export async function uploadDocument(projectId: string, file: File, token: string): Promise<DocumentResponse> {
  const headers = createAuthHeaders(token);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/documents/${projectId}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return await handleApiResponse<DocumentResponse>(response);
}

// Delete document
export async function deleteDocument(documentId: string, token: string): Promise<DocumentDeletionResponse> {
  const headers = createAuthHeadersJSON(token);

  const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
    headers,
  });

  return await handleApiResponse<DocumentDeletionResponse>(response);
}

// Get document download URL
export async function getDocumentDownload(documentId: string, token: string): Promise<DocumentDownloadResponse> {
  const headers = createAuthHeadersJSON(token);

  const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
    method: 'GET',
    headers,
  });

  return await handleApiResponse<DocumentDownloadResponse>(response);
}
