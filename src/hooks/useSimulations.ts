'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Simulation {
  id: string;
  title: string;
  description: string;
  introduction_video_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SimulationInstance {
  id: string;
  simulation_id: string;
  learner_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  current_scenario_id?: string;
  stages_completed: number;
  started_at?: string;
  completed_at?: string;
}

async function fetchSimulations(): Promise<Simulation[]> {
  const res = await fetch('/api/simulations');
  if (!res.ok) throw new Error('Failed to fetch simulations');
  return res.json();
}

async function fetchSimulationById(id: string): Promise<Simulation> {
  const res = await fetch(`/api/simulations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch simulation');
  return res.json();
}

async function fetchSimulationInstance(simulationId: string, learnerId: string): Promise<SimulationInstance> {
  const res = await fetch(`/api/simulations/${simulationId}/instances?learner_id=${learnerId}`);
  if (!res.ok) throw new Error('Failed to fetch simulation instance');
  return res.json();
}

async function createSimulationInstance(simulationId: string): Promise<SimulationInstance> {
  const res = await fetch(`/api/simulations/${simulationId}/instances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to create simulation instance');
  return res.json();
}

export function useSimulations() {
  return useQuery({
    queryKey: ['simulations'],
    queryFn: fetchSimulations,
  });
}

export function useSimulation(id: string) {
  return useQuery({
    queryKey: ['simulation', id],
    queryFn: () => fetchSimulationById(id),
    enabled: !!id,
  });
}

export function useSimulationInstance(simulationId: string, learnerId: string) {
  return useQuery({
    queryKey: ['simulation-instance', simulationId, learnerId],
    queryFn: () => fetchSimulationInstance(simulationId, learnerId),
    enabled: !!simulationId && !!learnerId,
  });
}

export function useCreateSimulationInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSimulationInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulation-instance'] });
    },
  });
}
