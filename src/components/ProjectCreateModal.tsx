'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProject, initializeProjectTimelineRecap } from '@/lib/api/projectsClient';
import { ProjectCreate } from '@/lib/api/projectsClient';

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectCreateModal({ open, onOpenChange }: ProjectFormModalProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    description: '',
    project_type: 'business',
    project_context_detail: '',
    start_date: new Date().toISOString().split('T')[0] + 'T08:00:00Z',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get token
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('Creating project with data:', formData);

      // Create the project
      const newProject = await createProject(formData, token);
      console.log('Project created:', newProject);

      // Initialize timeline recap for the project
      await initializeProjectTimelineRecap(newProject.id, token);
      console.log('Timeline recap initialized');

      // Close modal and refresh the page
      onOpenChange(false);
      router.refresh();

      // Reset form
      setFormData({
        name: '',
        description: '',
        project_type: 'business',
        project_context_detail: '',
        start_date: new Date().toISOString().split('T')[0] + 'T08:00:00Z',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      // TODO: Show error toast/message
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Project Name *</Label>
            <Input id='name' value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder='Enter project name' required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='project_type'>Project Type *</Label>
            <Select value={formData.project_type} onValueChange={(value: 'business' | 'individual') => setFormData((prev) => ({ ...prev, project_type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='business'>Business</SelectItem>
                <SelectItem value='individual'>Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder='Brief description (optional)'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='project_context_detail'>Project Context *</Label>
            <Textarea
              id='project_context_detail'
              value={formData.project_context_detail}
              onChange={(e) => setFormData((prev) => ({ ...prev, project_context_detail: e.target.value }))}
              placeholder='Describe the project context and details...'
              rows={3}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='start_date'>Start Date *</Label>
            <Input
              id='start_date'
              type='date'
              value={formData.start_date.split('T')[0]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  start_date: e.target.value + 'T08:00:00Z',
                }))
              }
              required
            />
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
