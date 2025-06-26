'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Sparkles, MessageSquare, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getProjectTimelineRecap, generateTimelineRecapSummaries, initializeProjectTimelineRecap } from '@/lib/api/timelineRecapClient';
import { TimelineRecapResponse, RecapSummaryResponse } from '@/types/timelineRecap';
import { ApiError } from '@/lib/apiBase';

interface TimelineRecapSidebarProps {
  projectId: string;
}

export function TimelineRecapSidebar({ projectId }: TimelineRecapSidebarProps) {
  const { getToken } = useAuth();
  const [timelineData, setTimelineData] = useState<TimelineRecapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for tracking expanded cards
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const fetchTimelineRecap = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const recapData = await getProjectTimelineRecap(projectId, token);
      setTimelineData(recapData);
    } catch (err) {
      console.error('Error fetching timeline recap:', err);
      if (err instanceof ApiError) {
        // If 404 or similar, try to initialize first
        if (err.status === 404 || err.message.includes('not found')) {
          await handleInitializeRecap();
        } else {
          setError(`Failed to load timeline: ${err.message}`);
        }
      } else {
        setError('Failed to load timeline recap');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeRecap = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const initializedData = await initializeProjectTimelineRecap(projectId, token);
      setTimelineData(initializedData);
    } catch (err) {
      console.error('Error initializing timeline recap:', err);
      if (err instanceof ApiError) {
        setError(`Failed to initialize timeline: ${err.message}`);
      } else {
        setError('Failed to initialize timeline recap');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummaries = async () => {
    try {
      setGenerating(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const updatedData = await generateTimelineRecapSummaries(projectId, token);
      setTimelineData(updatedData);
    } catch (err) {
      console.error('Error generating summaries:', err);
      if (err instanceof ApiError) {
        setError(`Failed to generate summaries: ${err.message}`);
      } else {
        setError('Failed to generate summaries');
      }
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchTimelineRecap();
  }, [projectId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) {
      return 'Today';
    } else if (diffInDays < 2) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)} days ago`;
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  };

  const hasGeneratableContent =
    timelineData &&
    (timelineData.recent_activity.some((item) => item.content === 'To be summarized') || timelineData.past_2_weeks.some((item) => item.content === 'To be summarized'));

  // Helper function to determine if content should be truncated
  const shouldTruncateContent = (content: string) => {
    const lines = content.split('\n').filter((line) => line.trim());
    return lines.length > 2 || content.length > 150;
  };

  // Helper function to get truncated content
  const getTruncatedContent = (content: string) => {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length > 2) {
      return lines.slice(0, 2).join('\n') + '...';
    }
    if (content.length > 150) {
      return content.substring(0, 150) + '...';
    }
    return content;
  };

  // Toggle card expansion
  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  // Render expandable content
  const renderExpandableContent = (recap: RecapSummaryResponse) => {
    const isExpanded = expandedCards.has(recap.id);
    const shouldTruncate = shouldTruncateContent(recap.content);
    const displayContent = isExpanded || !shouldTruncate ? recap.content : getTruncatedContent(recap.content);

    return (
      <div className='text-sm text-gray-700'>
        {recap.content === 'To be summarized' ? (
          <div className='flex items-center gap-2 text-blue-600'>
            <Sparkles className='h-3 w-3' />
            <span className='italic'>Ready to generate summary</span>
          </div>
        ) : recap.content === 'Unavailable' ? (
          <span className='text-gray-400 italic'>No activity during this period</span>
        ) : (
          <div className='space-y-1'>
            {displayContent
              .split('\n')
              .filter((line) => line.trim())
              .map((line, index) => (
                <div key={index} className='text-sm'>
                  {line.startsWith('•') ? (
                    <div className='flex items-start gap-2'>
                      <span className='text-blue-600 mt-0.5'>•</span>
                      <span>{line.substring(1).trim()}</span>
                    </div>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              ))}

            {shouldTruncate && (
              <button onClick={() => toggleCardExpansion(recap.id)} className='flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors mt-3'>
                {isExpanded ? (
                  <>
                    <ChevronUp className='h-3 w-3' />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className='h-3 w-3' />
                    Show More
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <div className='flex items-center justify-center py-8'>
          <div className='text-gray-500'>Loading timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='font-semibold text-gray-900 flex items-center gap-2'>
          <MessageSquare className='h-5 w-5 text-blue-600' />
          Communication Recap
        </h2>
        {hasGeneratableContent && (
          <Button size='sm' onClick={handleGenerateSummaries} disabled={generating} className='gap-2'>
            <Sparkles className='h-4 w-4' />
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
          <div className='flex items-start gap-2'>
            <AlertCircle className='h-4 w-4 text-red-600 mt-0.5 flex-shrink-0' />
            <div>
              <p className='text-red-800 text-sm'>{error}</p>
              <Button variant='outline' size='sm' onClick={fetchTimelineRecap} className='mt-2'>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Content */}
      {timelineData && !error && (
        <div className='space-y-6'>
          {/* Recent Activity Section */}
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Clock className='h-4 w-4 text-orange-600' />
              <span className='font-medium text-gray-900'>Recent Activity</span>
              <Badge variant='secondary' className='text-xs'>
                Past 3 days
              </Badge>
            </div>

            <div className='space-y-5'>
              {timelineData.recent_activity.length === 0 ? (
                <p className='text-gray-500 text-sm italic'>No recent activity</p>
              ) : (
                timelineData.recent_activity.map((recap) => (
                  <Card key={recap.id} className='border-l-4 border-l-orange-400'>
                    <CardContent className='p-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-xs font-medium text-gray-600'>{formatDate(recap.start_date)}</span>
                        <Badge variant='outline' className='text-xs'>
                          Daily
                        </Badge>
                      </div>
                      {renderExpandableContent(recap)}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Past 2 Weeks Section */}
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <Calendar className='h-4 w-4 text-green-600' />
              <span className='font-medium text-gray-900'>Weekly Summary</span>
              <Badge variant='secondary' className='text-xs'>
                Past 2 weeks
              </Badge>
            </div>

            <div className='space-y-5'>
              {timelineData.past_2_weeks.length === 0 ? (
                <p className='text-gray-500 text-sm italic'>No weekly summaries</p>
              ) : (
                timelineData.past_2_weeks.map((recap) => (
                  <Card key={recap.id} className='border-l-4 border-l-green-400'>
                    <CardContent className='p-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-xs font-medium text-gray-600'>{formatDateRange(recap.start_date, recap.end_date)}</span>
                        <Badge variant='outline' className='text-xs'>
                          Weekly
                        </Badge>
                      </div>
                      {renderExpandableContent(recap)}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className='pt-2 border-t border-gray-100'>
            <p className='text-xs text-gray-500'>Timeline updates automatically based on project communications</p>
          </div>
        </div>
      )}
    </div>
  );
}
