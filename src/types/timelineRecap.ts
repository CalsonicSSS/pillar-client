export interface RecapSummaryResponse {
  id: string;
  project_id: string;
  summary_type: 'daily' | 'weekly';
  start_date: string;
  end_date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineRecapResponse {
  recent_activity: RecapSummaryResponse[]; // Past 3 days
  past_2_weeks: RecapSummaryResponse[]; // Past 2 weeks
}
