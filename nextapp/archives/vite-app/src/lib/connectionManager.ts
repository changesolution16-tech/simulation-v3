import { supabase } from './supabase';

export interface ConnectionStatus {
  scenarioId: string;
  totalOptions: number;
  connectedOptions: number;
  connections: Array<{
    optionId: string;
    optionText: string;
    nextScenarioId: string | null;
    hasConnection: boolean;
    targetTitle?: string;
  }>;
}

export interface ConnectionIntegrity {
  isValid: boolean;
  totalOptions: number;
  optionsWithConnections: number;
  orphanedConnections: number;
  issues: {
    orphanedConnections: number;
    orphanedBranches: number;
    branchCount: number;
    optionsCount: number;
  };
}

export interface AtomicUpdateResult {
  success: boolean;
  scenarioId: string;
  connectionsBefore: number;
  connectionsAfter: number;
  optionsDeleted: number;
  optionsUpdated: number;
}

export async function getConnectionStatus(scenarioId: string): Promise<ConnectionStatus | null> {
  try {
    console.log('[ConnectionManager] Fetching connection status for:', scenarioId);

    const { data, error } = await supabase.rpc('get_scenario_connection_status', {
      p_scenario_id: scenarioId
    });

    if (error) {
      console.error('[ConnectionManager] Error fetching connection status:', error);
      return null;
    }

    if (!data) {
      console.log('[ConnectionManager] No connection status data returned');
      return {
        scenarioId,
        totalOptions: 0,
        connectedOptions: 0,
        connections: []
      };
    }

    const connections = data.connections || [];

    for (const conn of connections) {
      if (conn.next_scenario_id) {
        const { data: targetScenario } = await supabase
          .from('scenarios')
          .select('title')
          .eq('id', conn.next_scenario_id)
          .maybeSingle();

        if (targetScenario) {
          conn.targetTitle = targetScenario.title;
        }
      }
    }

    return {
      scenarioId: data.scenario_id,
      totalOptions: data.total_options || 0,
      connectedOptions: data.connected_options || 0,
      connections: connections.map((c: any) => ({
        optionId: c.option_id,
        optionText: c.option_text,
        nextScenarioId: c.next_scenario_id,
        hasConnection: c.has_connection,
        targetTitle: c.targetTitle
      }))
    };
  } catch (error) {
    console.error('[ConnectionManager] Unexpected error fetching connection status:', error);
    return null;
  }
}

export async function verifyConnectionIntegrity(scenarioId: string): Promise<ConnectionIntegrity | null> {
  try {
    console.log('[ConnectionManager] Verifying connection integrity for:', scenarioId);

    const { data, error } = await supabase.rpc('verify_scenario_connections_integrity', {
      p_scenario_id: scenarioId
    });

    if (error) {
      console.error('[ConnectionManager] Error verifying connection integrity:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        isValid: true,
        totalOptions: 0,
        optionsWithConnections: 0,
        orphanedConnections: 0,
        issues: {
          orphanedConnections: 0,
          orphanedBranches: 0,
          branchCount: 0,
          optionsCount: 0
        }
      };
    }

    const result = data[0];
    return {
      isValid: result.is_valid,
      totalOptions: result.total_options,
      optionsWithConnections: result.options_with_connections,
      orphanedConnections: result.orphaned_connections,
      issues: result.issues
    };
  } catch (error) {
    console.error('[ConnectionManager] Unexpected error verifying connection integrity:', error);
    return null;
  }
}

export async function atomicUpdateScenarioWithOptions(
  scenarioId: string,
  scenarioData: {
    title: string;
    description: string;
    topicId: string;
    difficulty: string;
    isEndScenario: boolean;
    positionX?: number;
    positionY?: number;
    contentStatus?: string;
  },
  options: Array<{
    id: string;
    optionText: string;
    optionOrder: number;
    nextScenarioId?: string | null;
    feedbackBeginner: string;
    feedbackIntermediate: string;
    feedbackAdvanced: string;
    skillImpacts: Record<string, number>;
  }>
): Promise<AtomicUpdateResult | null> {
  try {
    console.log('[ConnectionManager] Atomic update for scenario:', scenarioId);
    console.log('[ConnectionManager] Options to save:', options.length);
    console.log('[ConnectionManager] Options with connections:', options.filter(o => o.nextScenarioId).length);

    const optionsJsonb = options.map(opt => ({
      id: opt.id,
      option_text: opt.optionText,
      option_order: opt.optionOrder,
      next_scenario_id: opt.nextScenarioId || null,
      feedback_beginner: opt.feedbackBeginner,
      feedback_intermediate: opt.feedbackIntermediate,
      feedback_advanced: opt.feedbackAdvanced,
      skill_impacts: JSON.stringify(opt.skillImpacts)
    }));

    const { data, error } = await supabase.rpc('atomic_update_scenario_with_options', {
      p_scenario_id: scenarioId,
      p_title: scenarioData.title,
      p_description: scenarioData.description,
      p_topic_id: scenarioData.topicId,
      p_difficulty: scenarioData.difficulty,
      p_is_end_scenario: scenarioData.isEndScenario,
      p_position_x: scenarioData.positionX || 0,
      p_position_y: scenarioData.positionY || 0,
      p_content_status: scenarioData.contentStatus || 'draft',
      p_options: optionsJsonb
    });

    if (error) {
      console.error('[ConnectionManager] Error in atomic update:', error);
      return null;
    }

    console.log('[ConnectionManager] Atomic update result:', data);

    return {
      success: data.success,
      scenarioId: data.scenario_id,
      connectionsBefore: data.connections_before,
      connectionsAfter: data.connections_after,
      optionsDeleted: data.options_deleted,
      optionsUpdated: data.options_updated
    };
  } catch (error) {
    console.error('[ConnectionManager] Unexpected error in atomic update:', error);
    return null;
  }
}

export interface OptionWithConnection {
  id: string;
  text: string;
  nextScenarioId: string | null;
  targetScenarioTitle?: string;
  hasConnection: boolean;
}

export async function getOptionsWithConnectionDetails(scenarioId: string): Promise<OptionWithConnection[]> {
  try {
    const { data: options, error } = await supabase
      .from('scenario_options')
      .select('id, option_text, next_scenario_id, option_order')
      .eq('scenario_id', scenarioId)
      .order('option_order');

    if (error) {
      console.error('[ConnectionManager] Error fetching options:', error);
      return [];
    }

    if (!options) return [];

    const optionsWithDetails: OptionWithConnection[] = [];

    for (const option of options) {
      let targetTitle: string | undefined;

      if (option.next_scenario_id) {
        const { data: targetScenario } = await supabase
          .from('scenarios')
          .select('title')
          .eq('id', option.next_scenario_id)
          .maybeSingle();

        if (targetScenario) {
          targetTitle = targetScenario.title;
        }
      }

      optionsWithDetails.push({
        id: option.id,
        text: option.option_text,
        nextScenarioId: option.next_scenario_id,
        targetScenarioTitle: targetTitle,
        hasConnection: !!option.next_scenario_id
      });
    }

    return optionsWithDetails;
  } catch (error) {
    console.error('[ConnectionManager] Error getting options with connection details:', error);
    return [];
  }
}

export function formatConnectionSummary(status: ConnectionStatus): string {
  const percentage = status.totalOptions > 0
    ? Math.round((status.connectedOptions / status.totalOptions) * 100)
    : 0;

  return `${status.connectedOptions}/${status.totalOptions} options connected (${percentage}%)`;
}

export function getConnectionHealthColor(status: ConnectionStatus): string {
  if (status.totalOptions === 0) return 'gray';

  const percentage = (status.connectedOptions / status.totalOptions) * 100;

  if (percentage === 100) return 'green';
  if (percentage >= 50) return 'yellow';
  if (percentage > 0) return 'orange';
  return 'red';
}

export function hasOrphanedConnections(integrity: ConnectionIntegrity): boolean {
  return integrity.orphanedConnections > 0 || integrity.issues.orphanedConnections > 0;
}

export function getIntegrityMessage(integrity: ConnectionIntegrity): string {
  if (integrity.isValid) {
    return `All connections valid (${integrity.optionsWithConnections} connected options)`;
  }

  const issues: string[] = [];

  if (integrity.orphanedConnections > 0) {
    issues.push(`${integrity.orphanedConnections} orphaned connection(s)`);
  }

  if (integrity.issues.orphanedBranches > 0) {
    issues.push(`${integrity.issues.orphanedBranches} orphaned branch(es)`);
  }

  return `Connection issues: ${issues.join(', ')}`;
}
