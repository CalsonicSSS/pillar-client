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
import { updateProject } from '@/lib/api/projectsClient';
import { ProjectResponse, ProjectUpdate } from '@/types/project';

interface ProjectEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectResponse;
}

export function ProjectUpdateModal({ open, onOpenChange, project }: ProjectEditModalProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectUpdate>({
    name: project.name,
    description: project.description || '',
    project_type: project.project_type,
    project_context_detail: project.project_context_detail,
    status: project.status,
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

      console.log('Updating project with data:', formData);

      // Update the project
      await updateProject(project.id, formData, token);
      console.log('Project updated successfully');

      // Close modal and refresh the page
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating project:', error);
      // TODO: Show error toast/message
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
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
            <Label htmlFor='status'>Status *</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'archived') => setFormData((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='archived'>Archived</SelectItem>
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

          <div className='flex justify-end gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Updating...' : 'Update Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
