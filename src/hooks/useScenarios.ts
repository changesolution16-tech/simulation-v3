'use client';

import { useQuery } from '@tanstack/react-query';

export interface ScenarioOption {
  id: string;
  scenario_id: string;
  text: string;
  next_scenario_id?: string;
  feedback_text?: string;
  feedback_video_url?: string;
  order_index: number;
}

export interface Scenario {
  id: string;
  simulation_id: string;
  title: string;
  question_text: string;
  video_url?: string;
  introduction_video_url?: string;
  hierarchy_level: number;
  order_index: number;
  is_root: boolean;
  created_at: string;
  options?: ScenarioOption[];
}

async function fetchScenarios(simulationId: string): Promise<Scenario[]> {
  const res = await fetch(`/api/scenarios?simulation_id=${simulationId}`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

async function fetchScenarioById(id: string): Promise<Scenario> {
  const res = await fetch(`/api/scenarios/${id}`);
  if (!res.ok) throw new Error('Failed to fetch scenario');
  return res.json();
}

async function fetchScenarioOptions(scenarioId: string): Promise<ScenarioOption[]> {
  const res = await fetch(`/api/scenarios/${scenarioId}/options`);
  if (!res.ok) throw new Error('Failed to fetch scenario options');
  return res.json();
}

export function useScenarios(simulationId: string) {
  return useQuery({
    queryKey: ['scenarios', simulationId],
    queryFn: () => fetchScenarios(simulationId),
    enabled: !!simulationId,
  });
}

export function useScenario(id: string) {
  return useQuery({
    queryKey: ['scenario', id],
    queryFn: () => fetchScenarioById(id),
    enabled: !!id,
  });
}

export function useScenarioOptions(scenarioId: string) {
  return useQuery({
    queryKey: ['scenario-options', scenarioId],
    queryFn: () => fetchScenarioOptions(scenarioId),
    enabled: !!scenarioId,
  });
}
