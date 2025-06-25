export interface GmailMessageFetchRequest {
  project_id: string;
  channel_id: string;
  contact_ids: string[];
}

export interface GmailMessageFetchResponse {
  status: string;
  status_message: string;
}
