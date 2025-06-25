'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MessageSquare, Paperclip, User, Download, Search, Filter, Calendar } from 'lucide-react';
import { getMessagesWithFilters } from '@/lib/api/messagesClient';
import { MessageResponse, MessageFilter } from '@/types/message';
import { ContactResponse } from '@/types/contact';
import { ChannelResponse } from '@/types/channel';
import { ApiError } from '@/lib/apiBase';

interface MessageDisplayProps {
  contact: ContactResponse;
  channel: ChannelResponse;
  projectId: string;
  onBack: () => void;
}

export function MessageDisplay({ contact, channel, projectId, onBack }: MessageDisplayProps) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [messageDirection, setMessageDirection] = useState<'all' | 'from_contact' | 'from_me'>('all');
  const [readStatus, setReadStatus] = useState<'all' | 'read' | 'unread'>('all');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const filters: MessageFilter = {
        project_id: projectId,
        channel_id: channel.id,
        contact_id: contact.id,
        limit: 100,
        offset: 0,
      };

      const messagesData = await getMessagesWithFilters(filters, token);

      // Sort messages by date (newest first for email-like experience)
      const sortedMessages = messagesData.sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());

      setMessages(sortedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err instanceof ApiError) {
        setError(`Failed to load messages: ${err.message}`);
      } else {
        setError('Failed to load messages');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [contact.id, channel.id, projectId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAttachmentClick = (attachment: any) => {
    if (attachment.document_id) {
      // Open attachment in new tab (we'll implement download API later)
      console.log('Opening attachment:', attachment.filename);
      // TODO: Implement document download URL generation
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-gray-500'>Loading messages...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='outline' onClick={onBack} className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Back to Contacts
          </Button>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-semibold'>
              {contact.name ? contact.name.charAt(0).toUpperCase() : contact.account_identifier.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>{contact.name || 'Unnamed Contact'}</h3>
              <p className='text-sm text-gray-600'>{contact.account_identifier}</p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Badge variant='secondary' className='gap-1'>
            <MessageSquare className='h-3 w-3' />
            {
              messages.filter((message) => {
                const matchesSearch =
                  !searchTerm ||
                  message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  message.body_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  message.sender_account.toLowerCase().includes(searchTerm.toLowerCase());

                const messageDate = new Date(message.registered_at);
                const matchesDateRange = (!startDate || messageDate >= new Date(startDate)) && (!endDate || messageDate <= new Date(endDate + 'T23:59:59'));

                const matchesDirection =
                  messageDirection === 'all' || (messageDirection === 'from_contact' && message.is_from_contact) || (messageDirection === 'from_me' && !message.is_from_contact);

                const matchesReadStatus = readStatus === 'all' || (readStatus === 'read' && message.is_read) || (readStatus === 'unread' && !message.is_read);

                return matchesSearch && matchesDateRange && matchesDirection && matchesReadStatus;
              }).length
            }{' '}
            of {messages.length} Messages
          </Badge>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input placeholder='Search messages...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
        </div>
        <Button
          variant={showFilters || startDate || endDate || messageDirection !== 'all' || readStatus !== 'all' ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className='gap-2'
        >
          <Filter className='h-4 w-4' />
          Filters
          {(startDate || endDate || messageDirection !== 'all' || readStatus !== 'all') && (
            <Badge variant='secondary' className='ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs'>
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Expandable Filters Panel */}
      {showFilters && (
        <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Date Range */}
            <div className='space-y-2'>
              <Label htmlFor='start-date' className='text-sm font-medium'>
                From Date
              </Label>
              <Input id='start-date' type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className='text-sm' />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='end-date' className='text-sm font-medium'>
                To Date
              </Label>
              <Input id='end-date' type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className='text-sm' />
            </div>

            {/* Message Direction */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Message Direction</Label>
              <Select value={messageDirection} onValueChange={(value: any) => setMessageDirection(value)}>
                <SelectTrigger className='text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Messages</SelectItem>
                  <SelectItem value='from_contact'>From Contact</SelectItem>
                  <SelectItem value='from_me'>From Me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Read Status */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Read Status</Label>
              <Select value={readStatus} onValueChange={(value: any) => setReadStatus(value)}>
                <SelectTrigger className='text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Messages</SelectItem>
                  <SelectItem value='read'>Read Only</SelectItem>
                  <SelectItem value='unread'>Unread Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className='flex items-center gap-2 pt-2 border-t border-gray-200'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setMessageDirection('all');
                setReadStatus('all');
                setSearchTerm('');
              }}
            >
              Clear All Filters
            </Button>
            <Button size='sm' onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{error}</p>
          <Button variant='outline' size='sm' onClick={fetchMessages} className='mt-2'>
            Try Again
          </Button>
        </div>
      )}

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
          <MessageSquare className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h4 className='text-lg font-medium text-gray-900 mb-2'>No messages found</h4>
          <p className='text-gray-600'>No conversation history with this contact yet.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {messages
            .filter((message) => {
              // Search filter
              const matchesSearch =
                !searchTerm ||
                message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.body_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.sender_account.toLowerCase().includes(searchTerm.toLowerCase());

              // Date range filter
              const messageDate = new Date(message.registered_at);
              const matchesDateRange = (!startDate || messageDate >= new Date(startDate)) && (!endDate || messageDate <= new Date(endDate + 'T23:59:59'));

              // Message direction filter
              const matchesDirection =
                messageDirection === 'all' || (messageDirection === 'from_contact' && message.is_from_contact) || (messageDirection === 'from_me' && !message.is_from_contact);

              // Read status filter
              const matchesReadStatus = readStatus === 'all' || (readStatus === 'read' && message.is_read) || (readStatus === 'unread' && !message.is_read);

              return matchesSearch && matchesDateRange && matchesDirection && matchesReadStatus;
            })
            .map((message) => (
              <Card key={message.id} className='hover:shadow-md transition-shadow'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1 min-w-0'>
                      <div className='w-8 h-8 bg-gray-500 text-white rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0'>
                        {message.is_from_contact ? contact.name ? contact.name.charAt(0).toUpperCase() : 'C' : <User className='h-4 w-4' />}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='font-medium text-gray-900 truncate'>{message.is_from_contact ? contact.name || contact.account_identifier : 'You'}</span>
                          <span className='text-sm text-gray-500'>→</span>
                          <span className='text-sm text-gray-600 truncate'>{message.recipient_accounts.join(', ')}</span>
                        </div>
                        <h4 className='font-medium text-gray-900 truncate'>{message.subject || '(No Subject)'}</h4>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 flex-shrink-0 ml-4'>
                      {message.attachments.length > 0 && (
                        <Badge variant='outline' className='gap-1 text-xs'>
                          <Paperclip className='h-3 w-3' />
                          {message.attachments.length}
                        </Badge>
                      )}
                      <span className='text-sm text-gray-500 whitespace-nowrap'>{formatDate(message.registered_at)}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Message Body Preview */}
                  {message.body_text && (
                    <div className='mb-4'>
                      <p className='text-gray-700 text-sm leading-relaxed'>{truncateText(message.body_text, 300)}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {message.attachments.length > 0 && (
                    <div className='border-t pt-3'>
                      <p className='text-sm font-medium text-gray-900 mb-2'>Attachments ({message.attachments.length})</p>
                      <div className='space-y-2'>
                        {message.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className='flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors'
                            onClick={() => handleAttachmentClick(attachment)}
                          >
                            <div className='w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center flex-shrink-0'>
                              <Paperclip className='h-4 w-4' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm font-medium text-gray-900 truncate'>{attachment.filename}</p>
                              <p className='text-xs text-gray-500'>{formatFileSize(attachment.file_size)}</p>
                            </div>
                            <Download className='h-4 w-4 text-gray-400' />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
