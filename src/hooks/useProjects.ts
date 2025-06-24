'use client';

import { useState, useEffect } from 'react';
import { ProjectResponse } from '@/types/project';
import { getAllProjects } from '@/lib/api/projectsClient';
import { ApiError } from '@/lib/apiBase';

export function useProjects(status?: string) {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProjects() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllProjects(status);
      setProjects(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to load projects: ${err.message}`);
      } else {
        setError('Failed to load projects');
      }
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, [status]);

  const refetch = async () => {
    await fetchProjects();
  };

  return { projects, loading, error, refetch };
}
