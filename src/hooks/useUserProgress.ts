'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface CompetencyProgress {
  competency_id: string;
  competency_name: string;
  current_level: number;
  total_assessments: number;
  last_updated: string;
}

export interface LearnerResponse {
  id: string;
  instance_id: string;
  scenario_id: string;
  option_id: string;
  response_time_ms?: number;
  created_at: string;
}

export interface UserProgress {
  completedSimulations: number;
  inProgressSimulations: number;
  competencies: CompetencyProgress[];
  recentActivity: LearnerResponse[];
}

async function fetchUserProgress(userId: string): Promise<UserProgress> {
  const [competenciesRes, instancesRes] = await Promise.all([
    fetch(`/api/competencies/learner/${userId}`),
    fetch(`/api/simulations?learner_id=${userId}`),
  ]);

  if (!competenciesRes.ok || !instancesRes.ok) {
    throw new Error('Failed to fetch user progress');
  }

  const competencies = competenciesRes.ok ? await competenciesRes.json() : [];
  const instances = instancesRes.ok ? await instancesRes.json() : [];

  const completedSimulations = (instances || []).filter((i: any) => i.status === 'completed').length;
  const inProgressSimulations = (instances || []).filter((i: any) => i.status === 'in_progress').length;

  return {
    completedSimulations,
    inProgressSimulations,
    competencies: competencies || [],
    recentActivity: [],
  };
}

export function useUserProgress() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['user-progress', userId],
    queryFn: () => fetchUserProgress(userId!),
    enabled: !!userId,
  });
}
