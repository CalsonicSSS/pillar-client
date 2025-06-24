import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getProject } from '@/lib/api/projectsServer';
import { ApiError } from '@/lib/apiBase';
import { ProjectTabs } from '@/components/projectDetails/ProjectTabs';
import Link from 'next/link';

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch real project data
  let project;
  let error: string | null = null;

  try {
    project = await getProject(params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    error = (err as ApiError).message;
    console.error('Error fetching project:', err);
  }

  // If there was an error fetching the project, show error state
  if (error || !project) {
    return (
      <div className='mx-auto py-6 max-w-[1500px]'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
          <div className='flex items-center gap-4 mb-4'>
            <Link href='/dashboard'>
              <Button variant='outline' className='gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <p className='text-red-800'>{error || 'Failed to load project'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto py-6 max-w-[1500px]'>
      {/* Header */}
      <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-6'>
            <Link href='/dashboard'>
              <Button variant='outline' className='gap-2'>
                <ArrowLeft className='h-4 w-4' />
                Back to Dashboard
              </Button>
            </Link>

            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-semibold text-lg'>{project.avatar_letter}</div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>{project.name}</h1>
                <div className='flex items-center gap-3 mt-1'>
                  {project.description && <p className='text-gray-600'>{project.description}</p>}
                  <Badge variant='secondary' className='text-xs capitalize'>
                    {project.project_type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Button variant='ghost' size='sm'>
            <Settings className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className='flex gap-8'>
        {/* Left Sidebar - Timeline Recap */}
        <div className='w-[400px] flex-shrink-0'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <h2 className='font-semibold text-gray-900 mb-4'>Communication Recap</h2>
            <p className='text-gray-500 text-sm'>Timeline recap will be implemented here</p>
          </div>
        </div>

        {/* Main Content Area - Tabs */}
        <div className='flex-1'>
          <ProjectTabs projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
