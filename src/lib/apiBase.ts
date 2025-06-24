export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // FastAPI returns JSON with "detail" field for errors
    const errorData = await response.json();
    const message = errorData.detail;
    throw new ApiError(response.status, message);
  }

  return await response.json();
}
