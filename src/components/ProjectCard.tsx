'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectResponse, ProjectMetricsResponse } from '@/types/project';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Archive, SendToBack } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ProjectUpdateModal } from './ProjectUpdateModal';
import { updateProject, getProjectMetrics } from '@/lib/api/projectsClient';
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

  // New state for metrics
  const [metrics, setMetrics] = useState<ProjectMetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Fetch project metrics when component mounts
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setMetricsLoading(true);
        setMetricsError(null);

        const token = await getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const projectMetrics = await getProjectMetrics(project.id, token);
        setMetrics(projectMetrics);
      } catch (err) {
        console.error('Error fetching project metrics:', err);
        setMetricsError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchMetrics();
  }, [project.id, getToken]);

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

  const handleEditProject = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setShowEditModal(true);
  };

  const handleUpdateSuccess = () => {
    setShowEditModal(false);
    router.refresh(); // Refresh to show updated project
  };

  // Helper function to format date
  const formatStartDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Card className='cursor-pointer hover:shadow-md transition-shadow duration-200' onClick={handleCardClick}>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-blue-600 text-white rounded-md flex items-center justify-center text-sm font-semibold'>{project.avatar_letter}</div>
              <div>
                <h3 className='font-semibold text-gray-900 text-sm'>{project.name}</h3>
                <Badge variant='secondary' className='text-xs'>
                  {project.project_type}
                </Badge>
              </div>
            </div>

            <div onClick={handleActionClick}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={handleEditProject} disabled={updating}>
                    <Edit className='h-4 w-4 mr-2' />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchiveToggle} disabled={updating}>
                    {project.status === 'active' ? (
                      <>
                        <Archive className='h-4 w-4 mr-2' />
                        Archive
                      </>
                    ) : (
                      <>
                        <SendToBack className='h-4 w-4 mr-2' />
                        Unarchive
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          <p className='text-sm text-gray-600 mb-4 line-clamp-2'>{project.description || 'this is for client side test'}</p>

          <div className='grid grid-cols-3 gap-4 text-center'>
            <div>
              <div className='text-lg font-semibold text-gray-900'>{metricsLoading ? '...' : metricsError ? '--' : metrics?.connected_channels_count ?? 0}</div>
              <div className='text-sm text-gray-500'>Channels</div>
            </div>

            <div>
              <div className='text-lg font-semibold text-gray-900'>{metricsLoading ? '...' : metricsError ? '--' : metrics?.documents_count ?? 0}</div>
              <div className='text-sm text-gray-500'>Documents</div>
            </div>

            <div>
              <div className='text-lg font-semibold text-gray-900'>{metricsLoading ? '...' : metricsError ? '--' : metrics?.contacts_count ?? 0}</div>
              <div className='text-sm text-gray-500'>Contacts</div>
            </div>
          </div>

          {/* Start Date - shown at bottom */}
          <div className='mt-4 pt-3 border-t border-gray-100'>
            <div className='text-sm text-gray-500 flex items-center'>
              <p className='font-semibold text-gray-900 me-2'>Start Date:</p> {metrics ? formatStartDate(metrics.start_date) : metricsLoading ? '...' : 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Project Update Modal */}
      <ProjectUpdateModal open={showEditModal} onOpenChange={setShowEditModal} project={project} />
    </>
  );
}
