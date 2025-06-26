'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageCircle, ArrowRight, Check } from 'lucide-react';

interface ChannelSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGmail: () => void;
  onSelectSlack: () => void;
  loading?: boolean;
}

export function ChannelSelectionModal({ open, onOpenChange, onSelectGmail, onSelectSlack, loading = false }: ChannelSelectionModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<'gmail' | 'slack' | null>(null);

  const handleSelectChannel = (channelType: 'gmail' | 'slack') => {
    setSelectedChannel(channelType);

    // Small delay for better UX
    setTimeout(() => {
      if (channelType === 'gmail') {
        onSelectGmail();
      } else {
        onSelectSlack();
      }
      setSelectedChannel(null);
    }, 150);
  };

  const channels = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Connect your Gmail account to manage email communications',
      icon: <Mail className='h-8 w-8 text-red-600' />,
      color: 'bg-red-50 border-red-200 hover:bg-red-100',
      features: ['Email conversations', 'Attachment management', 'Message search', 'Auto-sync'],
      status: 'Available',
      statusColor: 'bg-green-100 text-green-800',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Connect your Slack workspace for team communications',
      icon: <MessageCircle className='h-8 w-8 text-purple-600' />,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      features: ['Channel messages', 'Direct messages', 'File sharing', 'Real-time sync'],
      status: 'Demo Mode',
      statusColor: 'bg-blue-100 text-blue-800',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span>Add Communication Channel</span>
            <Badge variant='outline' className='text-xs'>
              Choose Platform
            </Badge>
          </DialogTitle>
          <p className='text-sm text-gray-600'>Select a communication platform to integrate with your project</p>
        </DialogHeader>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 py-4'>
          {channels.map((channel) => (
            <Card
              key={channel.id}
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedChannel === channel.id ? 'border-blue-500 bg-blue-50 shadow-md scale-105' : channel.color
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
              onClick={() => !loading && handleSelectChannel(channel.id as 'gmail' | 'slack')}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    {channel.icon}
                    <div>
                      <CardTitle className='text-lg font-semibold'>{channel.name}</CardTitle>
                      <Badge variant='secondary' className={channel.statusColor}>
                        {channel.status}
                      </Badge>
                    </div>
                  </div>
                  {selectedChannel === channel.id ? (
                    <div className='w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center'>
                      <Check className='h-4 w-4 text-white' />
                    </div>
                  ) : (
                    <ArrowRight className='h-5 w-5 text-gray-400 group-hover:text-gray-600' />
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <p className='text-sm text-gray-600 mb-4 leading-relaxed'>{channel.description}</p>

                <div className='space-y-2'>
                  <p className='text-xs font-medium text-gray-700 uppercase tracking-wider'>Features</p>
                  <div className='space-y-1'>
                    {channel.features.map((feature, index) => (
                      <div key={index} className='flex items-center gap-2 text-sm text-gray-600'>
                        <div className='w-1 h-1 bg-blue-600 rounded-full' />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special badge for Slack demo mode */}
                {/* {channel.id === 'slack' && (
                  <div className='mt-4 flex items-center gap-1 text-xs text-blue-600'>
                    <Star className='h-3 w-3' />
                    <span className='font-medium'>Demo with sample data</span>
                  </div>
                )} */}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
          <p className='text-xs text-gray-500'>More platforms coming soon: Microsoft Teams, Discord, WhatsApp</p>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
