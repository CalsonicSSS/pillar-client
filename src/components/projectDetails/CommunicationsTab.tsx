'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Check, AlertCircle, Trash2, MoreHorizontal, ArrowLeft, MessageCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getProjectChannels, initializeGmailChannel, deleteChannel, getGmailOAuthUrl } from '@/lib/api/channelsClient';
import { ChannelResponse } from '@/types/channel';
import { ApiError } from '@/lib/apiBase';
import { ContactManagement } from './ContactManagement';
import { getChannelMetrics } from '@/lib/api/channelsClient';
import { ChannelMetricsResponse } from '@/types/channel';
import { ChannelSelectionModal } from './ChannelSelectionModal';

interface CommunicationsTabProps {
  projectId: string;
}

export function CommunicationsTab({ projectId }: CommunicationsTabProps) {
  const { getToken } = useAuth();
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingChannel, setAddingChannel] = useState(false);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  const [channelMetrics, setChannelMetrics] = useState<Record<string, ChannelMetricsResponse>>({});
  const [metricsLoading, setMetricsLoading] = useState<Record<string, boolean>>({});

  // New state for channel selection modal and Slack metrics tracking
  const [showChannelSelectionModal, setShowChannelSelectionModal] = useState(false);
  const [slackChannelMetrics, setSlackChannelMetrics] = useState<Record<string, ChannelMetricsResponse>>({});

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const channelsData = await getProjectChannels(projectId, token);
      setChannels(channelsData);
    } catch (err) {
      console.error('Error fetching channels:', err);
      if (err instanceof ApiError) {
        setError(`Failed to load channels: ${err.message}`);
      } else {
        setError('Failed to load channels');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [projectId]);

  // Refresh channels when returning from OAuth
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchChannels();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (channels.length > 0) {
      const fetchAllChannelMetrics = async () => {
        const token = await getToken();
        if (!token) return;

        const newMetrics: Record<string, ChannelMetricsResponse> = {};
        const newLoading: Record<string, boolean> = {};

        // Set loading state for all channels
        channels.forEach((channel) => {
          newLoading[channel.id] = true;
        });
        setMetricsLoading(newLoading);

        // Fetch metrics for each channel
        await Promise.all(
          channels.map(async (channel) => {
            try {
              if (channel.channel_type === 'slack') {
                // Use local Slack metrics if available, otherwise default to 0,0
                newMetrics[channel.id] = slackChannelMetrics[channel.id] || { contacts_count: 0, messages_count: 0 };
              } else {
                // Fetch real metrics for Gmail channels
                const metrics = await getChannelMetrics(channel.id, token);
                newMetrics[channel.id] = metrics;
              }
            } catch (err) {
              console.error(`Error fetching metrics for channel ${channel.id}:`, err);
              // Set default values on error
              newMetrics[channel.id] = { contacts_count: 0, messages_count: 0 };
            } finally {
              newLoading[channel.id] = false;
            }
          })
        );

        setChannelMetrics(newMetrics);
        setMetricsLoading(newLoading);
      };

      fetchAllChannelMetrics();
    }
  }, [channels, getToken, slackChannelMetrics]);

  // Callback function to update Slack channel metrics
  const handleSlackMetricsUpdate = (channelId: string, contactsCount: number, messagesCount: number) => {
    const updatedMetrics = {
      contacts_count: contactsCount,
      messages_count: messagesCount,
    };

    // Update both the main metrics state and Slack-specific tracking
    setChannelMetrics((prev) => ({
      ...prev,
      [channelId]: updatedMetrics,
    }));

    setSlackChannelMetrics((prev) => ({
      ...prev,
      [channelId]: updatedMetrics,
    }));
  };

  // Open channel selection modal
  const handleAddChannelClick = () => {
    setShowChannelSelectionModal(true);
  };

  // Handle Gmail channel selection (existing functionality)
  const handleSelectGmail = async () => {
    setShowChannelSelectionModal(false);

    try {
      setAddingChannel(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Initializing Gmail channel for project:', projectId);
      const newChannel = await initializeGmailChannel(projectId, token);

      await fetchChannels();

      if (!newChannel.is_connected) {
        console.log('Channel created but not connected - starting OAuth flow');

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('oauth_project_id', projectId);
          sessionStorage.setItem('oauth_return_url', window.location.href);
        }

        await handleConnectChannel(newChannel.id);
      }
    } catch (err) {
      console.error('Error adding Gmail channel:', err);
      if (err instanceof ApiError) {
        setError(`Failed to add Gmail channel: ${err.message}`);
      } else {
        setError('Failed to add Gmail channel');
      }
    } finally {
      setAddingChannel(false);
    }
  };

  // Handle Slack channel selection (dummy implementation for demo)
  const handleSelectSlack = async () => {
    setShowChannelSelectionModal(false);

    try {
      setAddingChannel(true);
      setError(null);

      // Simulate API call with delay for realistic demo
      console.log('Creating Slack channel (demo mode)...');

      // Show loading for 2 seconds to simulate real API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create dummy Slack channel
      const dummySlackChannel: ChannelResponse = {
        id: `slack_demo_${Date.now()}`,
        project_id: projectId,
        channel_type: 'slack',
        is_connected: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add dummy channel to local state
      setChannels((prev) => [...prev, dummySlackChannel]);

      // Set dummy metrics
      setChannelMetrics((prev) => ({
        ...prev,
        [dummySlackChannel.id]: {
          contacts_count: 0,
          messages_count: 0,
        },
      }));

      // Initialize Slack metrics tracking
      setSlackChannelMetrics((prev) => ({
        ...prev,
        [dummySlackChannel.id]: {
          contacts_count: 0,
          messages_count: 0,
        },
      }));

      console.log('Slack channel created successfully (demo mode)');
    } catch (err) {
      console.error('Error adding Slack channel:', err);
      setError('Failed to add Slack channel');
    } finally {
      setAddingChannel(false);
    }
  };

  const handleConnectChannel = async (channelId: string) => {
    try {
      setConnectingChannel(channelId);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_project_id', projectId);
        sessionStorage.setItem('oauth_return_url', window.location.href);
      }

      console.log('Getting OAuth URL for channel:', channelId);
      const oauthResponse = await getGmailOAuthUrl(channelId, token);

      if (oauthResponse.requires_oauth && oauthResponse.oauth_url) {
        console.log('Redirecting to OAuth URL:', oauthResponse.oauth_url);
        window.location.href = oauthResponse.oauth_url;
      } else {
        await fetchChannels();
        setConnectingChannel(null);
      }
    } catch (err) {
      console.error('Error connecting channel:', err);
      if (err instanceof ApiError) {
        setError(`Failed to connect channel: ${err.message}`);
      } else {
        setError('Failed to connect channel');
      }
      setConnectingChannel(null);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const channel = channels.find((c) => c.id === channelId);

      if (channel?.channel_type === 'slack') {
        // Handle Slack channel deletion (demo mode)
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
        setChannelMetrics((prev) => {
          const newMetrics = { ...prev };
          delete newMetrics[channelId];
          return newMetrics;
        });

        // Remove from Slack metrics tracking
        setSlackChannelMetrics((prev) => {
          const newMetrics = { ...prev };
          delete newMetrics[channelId];
          return newMetrics;
        });

        // Clear selected channel if it was deleted
        if (selectedChannel?.id === channelId) {
          setSelectedChannel(null);
        }
        return;
      }

      // Handle Gmail channel deletion (real API call)
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await deleteChannel(channelId, token);
      await fetchChannels();

      // Clear selected channel if it was deleted
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(null);
      }
    } catch (err) {
      console.error('Error deleting channel:', err);
      if (err instanceof ApiError) {
        setError(`Failed to delete channel: ${err.message}`);
      } else {
        setError('Failed to delete channel');
      }
    }
  };

  const handleManageChannel = (channel: ChannelResponse) => {
    setSelectedChannel(channel);
  };

  const handleBackToChannels = () => {
    setSelectedChannel(null);
  };

  // Helper function to get channel icon
  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'gmail':
        return <Mail className='h-5 w-5' />;
      case 'slack':
        return <MessageCircle className='h-5 w-5' />;
      default:
        return <Mail className='h-5 w-5' />;
    }
  };

  // Helper function to get channel color
  const getChannelColor = (channelType: string) => {
    switch (channelType) {
      case 'gmail':
        return 'bg-red-500';
      case 'slack':
        return 'bg-purple-500';
      default:
        return 'bg-red-500';
    }
  };

  // Helper function to get channel display name
  const getChannelDisplayName = (channelType: string) => {
    switch (channelType) {
      case 'gmail':
        return 'Gmail';
      case 'slack':
        return 'Slack';
      default:
        return channelType.charAt(0).toUpperCase() + channelType.slice(1);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-gray-500'>Loading channels...</div>
      </div>
    );
  }

  // Show contact management view when a channel is selected
  if (selectedChannel) {
    return (
      <div className='space-y-6'>
        {/* Header with back navigation */}
        <div className='flex items-center gap-4'>
          <Button variant='outline' onClick={handleBackToChannels} className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Back to Channels
          </Button>
          <div className='flex items-center gap-3'>
            <div className={`w-8 h-8 ${getChannelColor(selectedChannel.channel_type)} text-white rounded-lg flex items-center justify-center`}>
              {getChannelIcon(selectedChannel.channel_type)}
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>{getChannelDisplayName(selectedChannel.channel_type)} Channel</h3>
              <p className='text-sm text-gray-600'>Manage contacts and conversations</p>
            </div>
          </div>
        </div>

        {/* Contact Management Component */}
        <div className='bg-white border border-gray-200 rounded-lg p-8'>
          <ContactManagement channel={selectedChannel} projectId={projectId} onSlackMetricsUpdate={handleSlackMetricsUpdate} />
        </div>
      </div>
    );
  }

  // Show channels list view
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Connected Channels</h3>
          <p className='text-sm text-gray-600'>Manage communication channels for this project</p>
        </div>
        <Button onClick={handleAddChannelClick} disabled={addingChannel} className='gap-2'>
          <Plus className='h-4 w-4' />
          {addingChannel ? 'Adding...' : 'Add Channel'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{error}</p>
          <Button variant='outline' size='sm' onClick={fetchChannels} className='mt-2'>
            Try Again
          </Button>
        </div>
      )}

      {/* Channels Grid */}
      {channels.length === 0 ? (
        <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
          <Mail className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h4 className='text-lg font-medium text-gray-900 mb-2'>No channels connected</h4>
          <p className='text-gray-600 mb-4'>Connect your first communication channel to start managing conversations</p>
          <Button onClick={handleAddChannelClick} disabled={addingChannel} className='gap-2'>
            <Plus className='h-4 w-4' />
            {addingChannel ? 'Adding Channel...' : 'Add Communication Channel'}
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {channels.map((channel) => {
            const metrics = channelMetrics[channel.id];
            const loading = metricsLoading[channel.id];

            return (
              <Card key={channel.id} className='cursor-pointer hover:shadow-md transition-shadow'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className={`w-10 h-10 ${getChannelColor(channel.channel_type)} text-white rounded-lg flex items-center justify-center`}>
                        {getChannelIcon(channel.channel_type)}
                      </div>
                      <div>
                        <CardTitle className='text-base'>{getChannelDisplayName(channel.channel_type)}</CardTitle>
                        <p className='text-sm text-gray-500'>{channel.channel_type === 'slack' ? 'Team Communication' : 'Email Channel'}</p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {channel.is_connected ? (
                        <Badge variant='default' className='gap-1 bg-green-100 text-green-800 hover:bg-green-100'>
                          <Check className='h-3 w-3' />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant='destructive' className='gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          Disconnected
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleDeleteChannel(channel.id)}>
                            <Trash2 className='h-4 w-4 mr-2' />
                            Delete Channel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className='space-y-3'>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <p className='text-gray-500'>Contacts</p>
                        <p className='font-medium'>{loading ? '...' : metrics ? metrics.contacts_count : '--'}</p>
                      </div>
                      <div>
                        <p className='text-gray-500'>Messages</p>
                        <p className='font-medium'>{loading ? '...' : metrics ? metrics.messages_count : '--'}</p>
                      </div>
                    </div>

                    <div className='pt-2'>
                      {channel.is_connected ? (
                        <Button variant='outline' size='sm' className='w-full' onClick={() => handleManageChannel(channel)}>
                          Manage Channel
                        </Button>
                      ) : (
                        <Button variant='default' size='sm' className='w-full' onClick={() => handleConnectChannel(channel.id)} disabled={connectingChannel === channel.id}>
                          {connectingChannel === channel.id ? 'Connecting...' : 'Connect Channel'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Channel Selection Modal */}
      <ChannelSelectionModal
        open={showChannelSelectionModal}
        onOpenChange={setShowChannelSelectionModal}
        onSelectGmail={handleSelectGmail}
        onSelectSlack={handleSelectSlack}
        loading={addingChannel}
      />
    </div>
  );
}
