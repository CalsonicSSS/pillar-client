export interface ProjectResponse {
  id: string;
  name: string;
  description?: string;
  project_type: 'business' | 'individual';
  project_context_detail: string;
  status: 'active' | 'archived';
  start_date: string;
  avatar_letter: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
