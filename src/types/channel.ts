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

export interface GmailChannelInitializeResponse {
  id: string;
  project_id: string;
  channel_type: string;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface GmailOAuthResponse {
  oauth_url: string;
  status_message: string;
  requires_oauth: boolean;
}

export interface GmailOAuthCallbackResponse {
  status: string;
  status_message: string;
}
