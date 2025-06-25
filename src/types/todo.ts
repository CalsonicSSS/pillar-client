export interface TodoItem {
  id: string;
  description: string;
  is_completed: boolean;
  completed_at?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TodoListResponse {
  id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  summary: string;
  items: TodoItem[];
  created_at: string;
  updated_at: string;
}

export interface TodoGenerateRequest {
  start_date: string;
  end_date: string;
}

export interface TodoListUpdateRequest {
  items: TodoItem[];
}
