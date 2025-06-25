'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectResponse } from '@/types/project';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Archive, SendToBack } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectUpdateModal } from './ProjectUpdateModal';
import { updateProject } from '@/lib/api/projectsClient';
import { useAuth } from '@clerk/nextjs';
import { ApiError } from '@/lib/apiBase';

interface ProjectCardProps {
  project: ProjectResponse;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleCardClick = () => {
    // Navigate to project detail page
    router.push(`/projects/${project.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking menu
  };

  const handleArchiveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    const newStatus = project.status === 'active' ? 'archived' : 'active';
    const actionText = project.status === 'active' ? 'archive' : 'unarchive';

    if (!confirm(`Are you sure you want to ${actionText} "${project.name}"?`)) {
      return;
    }

    try {
      setUpdating(true);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await updateProject(project.id, { status: newStatus }, token);

      // Refresh the page to show updated project status
      router.refresh();
    } catch (err) {
      console.error(`Error ${actionText}ing project:`, err);
      // TODO: Show error toast/message
      alert(`Failed to ${actionText} project. Please try again.`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Card className='cursor-pointer hover:shadow-md transition-shadow relative'>
        <div onClick={handleCardClick}>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold'>{project.avatar_letter}</div>
                <div>
                  <h3 className='font-semibold text-gray-900'>{project.name}</h3>
                  <p className='text-sm text-gray-500 capitalize'>{project.project_type}</p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant='secondary' className='text-xs'>
                  {project.project_type}
                </Badge>
                <div onClick={handleActionClick}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0' disabled={updating}>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                        <Edit className='h-4 w-4 mr-2' />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleArchiveToggle} disabled={updating}>
                        {project.status === 'active' ? (
                          <>
                            <Archive className='h-4 w-4 mr-2' />
                            {updating ? 'Archiving...' : 'Archive Project'}
                          </>
                        ) : (
                          <>
                            <SendToBack className='h-4 w-4 mr-2' />
                            {updating ? 'Unarchiving...' : 'Unarchive Project'}
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className='pt-0'>
            {project.description && <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{project.description}</p>}

            <div className='grid grid-cols-3 gap-4 text-center'>
              <div>
                <p className='text-sm text-gray-500'>Unread</p>
                <p className='font-semibold text-blue-600'>--</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Connected Channels</p>
                <p className='font-semibold'>--</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Documents</p>
                <p className='font-semibold'>--</p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      <ProjectUpdateModal open={showEditModal} onOpenChange={setShowEditModal} project={project} />
    </>
  );
}
