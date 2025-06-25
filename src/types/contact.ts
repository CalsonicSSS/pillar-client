export interface ContactResponse {
  id: string;
  channel_id: string;
  account_identifier: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  channel_id: string;
  account_identifier: string;
  name?: string;
}

export interface ContactUpdate {
  name?: string;
}

export interface ContactDeletionResponse {
  status: string;
  status_message: string;
}

export interface ContactMetricsResponse {
  messages_count: number;
  last_activity?: string; // ISO datetime string
}
