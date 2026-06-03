import { useCallback, useEffect, useState } from 'react';
import { createProject, listProjects, type CreateProjectInput, type ProjectSummary } from '../platform/projects';

export interface RecentProjects {
  projects: ProjectSummary[];
  loading: boolean;
  reload: () => void;
  create: (input: CreateProjectInput) => Promise<ProjectSummary>;
}

export function useRecentProjects(): RecentProjects {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    listProjects()
      .then((list) => setProjects(list))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const create = useCallback(async (input: CreateProjectInput) => {
    const summary = await createProject(input);
    reload();
    return summary;
  }, [reload]);

  return { projects, loading, reload, create };
}
