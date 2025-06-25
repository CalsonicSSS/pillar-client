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

export interface ProjectCreate {
  name: string;
  description?: string;
  project_type: 'business' | 'individual';
  project_context_detail: string;
  start_date: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: 'active' | 'archived';
  project_context_detail?: string;
  project_type?: 'business' | 'individual';
}

// -------------------------------------------

export interface ProjectMetricsResponse {
  connected_channels_count: number;
  documents_count: number;
  contacts_count: number;
  start_date: string;
}
