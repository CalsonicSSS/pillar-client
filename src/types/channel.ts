export interface ChannelResponse {
  id: string;
  project_id: string;
  channel_type: string;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChannelCreate {
  project_id: string;
  channel_type: string;
  is_connected: boolean;
}

export interface ChannelUpdate {
  is_connected?: boolean;
}

export interface ChannelDeletionResponse {
  status: string;
  status_message: string;
}

export interface ChannelInitializeResponse {
  id: string;
  project_id: string;
  channel_type: string;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------------

export interface ChannelMetricsResponse {
  contacts_count: number;
  messages_count: number;
}
