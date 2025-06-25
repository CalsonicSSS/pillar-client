export interface GmailOAuthResponse {
  oauth_url: string;
  status_message: string;
  requires_oauth: boolean;
}

export interface GmailOAuthCallbackResponse {
  status: string;
  status_message: string;
}
