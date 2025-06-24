import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
// import { AppLayout } from '@/components/AppLayout';
import { getAllProjects } from '@/lib/api/projectsServer';
import { ProjectResponse } from '@/types/project';
import { DashboardClient } from '@/components/DashboardClient';
import { ApiError } from '@/lib/apiBase';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch real projects from API
  let projects: ProjectResponse[] = [];
  let error: string | null = null;

  try {
    projects = await getAllProjects();
  } catch (err) {
    error = (err as ApiError).message;
    console.error('Error fetching projects:', err);
  }

  const activeProjects = projects.filter((p) => p.status === 'active');
  const archivedProjects = projects.filter((p) => p.status === 'archived');

  return (
    <div className='container mx-auto py-8 max-w-[1500px]'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Projects</h1>
        {projects.length > 0 && <DashboardClient hasProjects={true} />}
      </div>

      {/* Error State */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-8'>
          <p className='text-red-800'>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && projects.length === 0 && <DashboardClient hasProjects={false} />}

      {/* Projects Sections - Only show if we have projects */}
      {!error && projects.length > 0 && (
        <>
          {/* Active Projects Section */}
          <div className='mb-8'>
            <Collapsible defaultOpen className='bg-orange-100 rounded-lg'>
              <CollapsibleTrigger className='w-full p-4 flex items-center justify-between hover:bg-orange-200 transition-colors rounded-lg mb-5'>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-orange-800'>Active</span>
                  <span className='text-sm text-orange-600'>{activeProjects.length} clients</span>
                </div>
                <ChevronDown className='h-4 w-4 text-orange-800' />
              </CollapsibleTrigger>

              <CollapsibleContent className='p-6 pt-0'>
                {activeProjects.length === 0 ? (
                  <p className='text-gray-500 text-center py-8'>No active projects</p>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {activeProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Archived Projects Section */}
          <div>
            <Collapsible className='bg-green-100 rounded-lg'>
              <CollapsibleTrigger className='w-full p-4 flex items-center justify-between hover:bg-green-200 transition-colors rounded-lg mb-5'>
                <div className='flex items-center gap-2'>
                  <span className='font-semibold text-green-800'>Archived</span>
                  <span className='text-sm text-green-600'>{archivedProjects.length} clients</span>
                </div>
                <ChevronDown className='h-4 w-4 text-green-800' />
              </CollapsibleTrigger>

              <CollapsibleContent className='p-6 pt-0'>
                {archivedProjects.length === 0 ? (
                  <p className='text-gray-500 text-center py-8'>No archived projects</p>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {archivedProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </>
      )}
    </div>
  );
}
