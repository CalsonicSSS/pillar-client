export interface AttachmentInfo {
  filename: string;
  file_type: string;
  file_size: number;
  attachment_id: string;
  document_id?: string;
}

export interface MessageResponse {
  id: string;
  platform_message_id: string;
  contact_id: string;
  sender_account: string;
  recipient_accounts: string[];
  cc_accounts: string[];
  subject?: string;
  body_text?: string;
  body_html?: string;
  registered_at: string;
  thread_id?: string;
  is_read: boolean;
  is_from_contact: boolean;
  attachments: AttachmentInfo[];
  created_at: string;
  updated_at: string;
}

export interface MessageFilter {
  project_id?: string;
  channel_id?: string;
  contact_id?: string;
  thread_id?: string;
  start_date?: string;
  end_date?: string;
  is_read?: boolean;
  is_from_contact?: boolean;
  limit: number;
  offset: number;
}

export interface MessageUpdate {
  is_read: boolean;
}
