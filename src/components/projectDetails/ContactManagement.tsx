'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Mail, MoreHorizontal, Edit, Trash2, User, MessageSquare } from 'lucide-react';
import { getChannelContacts, createContact, updateContact, deleteContact } from '@/lib/api/contactsClient';
import { ContactResponse, ContactCreate, ContactUpdate } from '@/types/contact';
import { ChannelResponse } from '@/types/channel';
import { ApiError } from '@/lib/apiBase';

interface ContactManagementProps {
  channel: ChannelResponse;
  projectId: string;
}

export function ContactManagement({ channel, projectId }: ContactManagementProps) {
  const { getToken } = useAuth();
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactResponse | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [editContactName, setEditContactName] = useState('');

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const contactsData = await getChannelContacts(channel.id, token);
      setContacts(contactsData);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      if (err instanceof ApiError) {
        setError(`Failed to load contacts: ${err.message}`);
      } else {
        setError('Failed to load contacts');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [channel.id]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactEmail.trim()) return;

    try {
      setFormLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const contactData: ContactCreate = {
        channel_id: channel.id,
        account_identifier: newContactEmail.trim(),
        name: newContactName.trim() || undefined,
      };

      await createContact(contactData, token);

      // Reset form
      setNewContactEmail('');
      setNewContactName('');
      setShowAddModal(false);

      // Refresh contacts
      await fetchContacts();
    } catch (err) {
      console.error('Error creating contact:', err);
      if (err instanceof ApiError) {
        setError(`Failed to create contact: ${err.message}`);
      } else {
        setError('Failed to create contact');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    try {
      setFormLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const updateData: ContactUpdate = {
        name: editContactName.trim() || undefined,
      };

      await updateContact(selectedContact.id, updateData, token);

      // Reset form
      setEditContactName('');
      setSelectedContact(null);
      setShowEditModal(false);

      // Refresh contacts
      await fetchContacts();
    } catch (err) {
      console.error('Error updating contact:', err);
      if (err instanceof ApiError) {
        setError(`Failed to update contact: ${err.message}`);
      } else {
        setError('Failed to update contact');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteContact = async (contact: ContactResponse) => {
    if (!confirm(`Are you sure you want to delete "${contact.name || contact.account_identifier}"?`)) {
      return;
    }

    try {
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await deleteContact(contact.id, token);
      await fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      if (err instanceof ApiError) {
        setError(`Failed to delete contact: ${err.message}`);
      } else {
        setError('Failed to delete contact');
      }
    }
  };

  const openEditModal = (contact: ContactResponse) => {
    setSelectedContact(contact);
    setEditContactName(contact.name || '');
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-gray-500'>Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h4 className='text-lg font-semibold text-gray-900'>Channel Contacts</h4>
          <p className='text-sm text-gray-600'>Manage contacts for this {channel.channel_type} channel</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className='gap-2'>
          <Plus className='h-4 w-4' />
          Add Contact
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{error}</p>
          <Button variant='outline' size='sm' onClick={fetchContacts} className='mt-2'>
            Try Again
          </Button>
        </div>
      )}

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
          <User className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h4 className='text-lg font-medium text-gray-900 mb-2'>No contacts yet</h4>
          <p className='text-gray-600 mb-4'>Add your first contact to start managing conversations</p>
          <Button onClick={() => setShowAddModal(true)} className='gap-2'>
            <Plus className='h-4 w-4' />
            Add Your First Contact
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {contacts.map((contact) => (
            <Card key={contact.id} className='hover:shadow-md transition-shadow'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-semibold'>
                      {contact.name ? contact.name.charAt(0).toUpperCase() : contact.account_identifier.charAt(0).toUpperCase()}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <CardTitle className='text-base truncate'>{contact.name || 'Unnamed Contact'}</CardTitle>
                      <p className='text-sm text-gray-500 truncate'>{contact.account_identifier}</p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => openEditModal(contact)}>
                        <Edit className='h-4 w-4 mr-2' />
                        Edit Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteContact(contact)} className='text-red-600'>
                        <Trash2 className='h-4 w-4 mr-2' />
                        Delete Contact
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                <div className='space-y-3'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <p className='text-gray-500'>Messages</p>
                      <p className='font-medium'>--</p>
                    </div>
                    <div>
                      <p className='text-gray-500'>Last Activity</p>
                      <p className='font-medium'>--</p>
                    </div>
                  </div>

                  <Button variant='outline' size='sm' className='w-full gap-2'>
                    <MessageSquare className='h-4 w-4' />
                    View Messages
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddContact} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address *</Label>
              <Input id='email' type='email' value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} placeholder='contact@example.com' required />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='name'>Contact Name</Label>
              <Input id='name' value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder='John Doe (optional)' />
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button type='button' variant='outline' onClick={() => setShowAddModal(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type='submit' disabled={formLoading}>
                {formLoading ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditContact} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-email'>Email Address</Label>
              <Input id='edit-email' value={selectedContact?.account_identifier || ''} disabled className='bg-gray-50' />
              <p className='text-xs text-gray-500'>Email address cannot be changed</p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-name'>Contact Name</Label>
              <Input id='edit-name' value={editContactName} onChange={(e) => setEditContactName(e.target.value)} placeholder='John Doe' />
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <Button type='button' variant='outline' onClick={() => setShowEditModal(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type='submit' disabled={formLoading}>
                {formLoading ? 'Updating...' : 'Update Contact'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
