'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Check, AlertCircle, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getProjectChannels, initializeGmailChannel, deleteChannel, getGmailOAuthUrl } from '@/lib/api/channelsClient';
import { ChannelResponse } from '@/types/channel';
import { ApiError } from '@/lib/apiBase';

interface CommunicationsTabProps {
  projectId: string;
}

export function CommunicationsTab({ projectId }: CommunicationsTabProps) {
  const { getToken } = useAuth();
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingChannel, setAddingChannel] = useState(false);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);

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
        // Page became visible again (user returned from OAuth)
        fetchChannels();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAddChannel = async () => {
    try {
      setAddingChannel(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Initializing Gmail channel for project:', projectId);
      const newChannel = await initializeGmailChannel(projectId, token);

      // Refresh the channels list first
      await fetchChannels();

      // If the channel is not connected, automatically start OAuth flow
      if (!newChannel.is_connected) {
        console.log('Channel created but not connected - starting OAuth flow');

        // Store project context for OAuth return
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('oauth_project_id', projectId);
          sessionStorage.setItem('oauth_return_url', window.location.href);
        }

        await handleConnectChannel(newChannel.id);
      }
    } catch (err) {
      console.error('Error adding channel:', err);
      if (err instanceof ApiError) {
        setError(`Failed to add channel: ${err.message}`);
      } else {
        setError('Failed to add channel');
      }
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

      // Store project context for OAuth return
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
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await deleteChannel(channelId, token);
      await fetchChannels();
    } catch (err) {
      console.error('Error deleting channel:', err);
      if (err instanceof ApiError) {
        setError(`Failed to delete channel: ${err.message}`);
      } else {
        setError('Failed to delete channel');
      }
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-gray-500'>Loading channels...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Connected Channels</h3>
          <p className='text-sm text-gray-600'>Manage communication channels for this project</p>
        </div>
        <Button onClick={handleAddChannel} disabled={addingChannel} className='gap-2'>
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
          <Button onClick={handleAddChannel} disabled={addingChannel} className='gap-2'>
            <Plus className='h-4 w-4' />
            {addingChannel ? 'Adding Gmail Channel...' : 'Add Gmail Channel'}
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {channels.map((channel) => (
            <Card key={channel.id} className='cursor-pointer hover:shadow-md transition-shadow'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center'>
                      <Mail className='h-5 w-5' />
                    </div>
                    <div>
                      <CardTitle className='text-base capitalize'>{channel.channel_type}</CardTitle>
                      <p className='text-sm text-gray-500'>Email Channel</p>
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
                      <p className='font-medium'>--</p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Messages</p>
                      <p className='font-medium'>--</p>
                    </div>
                  </div>

                  <div className='pt-2'>
                    {channel.is_connected ? (
                      <Button variant='outline' size='sm' className='w-full'>
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
          ))}
        </div>
      )}
    </div>
  );
}
