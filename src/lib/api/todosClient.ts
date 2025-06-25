import { API_BASE_URL, handleApiResponse } from '../apiBase';
import { TodoListResponse, TodoGenerateRequest, TodoListUpdateRequest } from '@/types/todo';

// Helper function to create headers with token
function createAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Generate todo list for project
export async function generateProjectTodoList(projectId: string, todoRequest: TodoGenerateRequest, token: string): Promise<TodoListResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/todo-lists/project/${projectId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(todoRequest),
  });

  return await handleApiResponse<TodoListResponse>(response);
}

// Get existing todo list for project
export async function getProjectTodoList(projectId: string, token: string): Promise<TodoListResponse | null> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/todo-lists/project/${projectId}`, {
    method: 'GET',
    headers,
  });

  // Handle 404 case where no todo list exists
  if (response.status === 404) {
    return null;
  }

  return await handleApiResponse<TodoListResponse>(response);
}

// Update todo list items
export async function updateProjectTodoList(projectId: string, updateData: TodoListUpdateRequest, token: string): Promise<TodoListResponse> {
  const headers = createAuthHeaders(token);

  const response = await fetch(`${API_BASE_URL}/todo-lists/project/${projectId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updateData),
  });

  return await handleApiResponse<TodoListResponse>(response);
}
