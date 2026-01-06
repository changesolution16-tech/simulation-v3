import { supabase } from './supabase';

export interface HierarchyLevelStats {
  level: number;
  scenarioCount: number;
  uniqueTopics: number;
  endScenarios: number;
  publishedScenarios: number;
  difficultiesAtLevel: string[];
}

export interface RecalculateLevelsResult {
  success: boolean;
  updatedCount: number;
  timestamp: string;
  levelDistribution: Record<number, number>;
}

export async function recalculateHierarchyLevels(): Promise<RecalculateLevelsResult> {
  try {
    const { data, error } = await supabase.rpc('apply_scenario_hierarchy_levels');

    if (error) throw error;

    return data as RecalculateLevelsResult;
  } catch (error) {
    console.error('Error recalculating hierarchy levels:', error);
    throw error;
  }
}

export async function getHierarchyLevelStats(): Promise<HierarchyLevelStats[]> {
  try {
    const { data, error } = await supabase
      .from('scenario_level_stats')
      .select('*')
      .order('hierarchy_level');

    if (error) throw error;

    return (data || []).map((row: any) => ({
      level: row.hierarchy_level,
      scenarioCount: row.scenario_count,
      uniqueTopics: row.unique_topics,
      endScenarios: row.end_scenarios,
      publishedScenarios: row.published_scenarios,
      difficultiesAtLevel: row.difficulties_at_level || []
    }));
  } catch (error) {
    console.error('Error getting hierarchy level stats:', error);
    return [];
  }
}

export async function updateScenarioHierarchyLevel(
  scenarioId: string,
  hierarchyLevel: number | null,
  autoCalculate: boolean = false
): Promise<void> {
  try {
    const { error } = await supabase
      .from('scenarios')
      .update({
        hierarchy_level: hierarchyLevel,
        auto_calculate_level: autoCalculate,
        updated_at: new Date().toISOString()
      })
      .eq('id', scenarioId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating scenario hierarchy level:', error);
    throw error;
  }
}

export function getLevelColor(level: number): string {
  const colors = [
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#6366f1',
    '#f97316'
  ];
  return colors[level % colors.length];
}

export function getLevelBadgeColor(level: number): { bg: string; text: string; border: string } {
  const colorSchemes = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
    { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' }
  ];
  return colorSchemes[level % colorSchemes.length];
}

export function detectCycles(): Promise<{ hasCycle: boolean; cycleNodes: string[] }> {
  return supabase
    .rpc('detect_scenario_cycles')
    .then(({ data, error }) => {
      if (error) throw error;
      return {
        hasCycle: data?.[0]?.has_cycle || false,
        cycleNodes: data?.[0]?.cycle_nodes || []
      };
    });
}
