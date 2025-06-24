'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen } from 'lucide-react';
import { ProjectCreateModal } from './ProjectCreateModal';

interface DashboardClientProps {
  hasProjects: boolean;
}

export function DashboardClient({ hasProjects }: DashboardClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!hasProjects) {
    // Empty state with create button
    return (
      <>
        <div className='text-center py-16'>
          <FolderOpen className='h-16 w-16 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>No projects yet</h2>
          <p className='text-gray-600 mb-6'>Get started by creating your first project</p>
          <Button className='gap-2' onClick={() => setShowCreateModal(true)}>
            <Plus className='h-4 w-4' />
            Create Your First Project
          </Button>
        </div>

        <ProjectCreateModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      </>
    );
  }

  // Header button when projects exist
  return (
    <>
      <Button className='gap-2' onClick={() => setShowCreateModal(true)}>
        <Plus className='h-4 w-4' />
        Add Project
      </Button>

      <ProjectCreateModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </>
  );
}
