'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface Assignment {
  id: string;
  simulation_id: string;
  cohort_id?: string;
  learner_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  assigned_by: string;
  created_at: string;
  simulation?: {
    title: string;
    description: string;
  };
}

async function fetchUserAssignments(userId: string): Promise<Assignment[]> {
  const res = await fetch(`/api/assignments?learner_id=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch assignments');
  return res.json();
}

export function useUserAssignments() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['assignments', userId],
    queryFn: () => fetchUserAssignments(userId!),
    enabled: !!userId,
  });
}
