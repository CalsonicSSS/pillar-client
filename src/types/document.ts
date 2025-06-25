export interface DocumentResponse {
  id: string;
  project_id: string;
  folder_id?: string;
  safe_file_name: string;
  original_file_name?: string;
  file_path: string;
  file_type: string;
  file_size: number;
  source: 'email' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface DocumentDeletionResponse {
  status: string;
  status_message: string;
}

export interface DocumentDownloadResponse {
  download_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}
