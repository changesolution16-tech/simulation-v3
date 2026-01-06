import { supabase } from './supabase';

export interface QueryValidationResult {
  success: boolean;
  data?: any;
  error?: any;
  validationErrors?: string[];
}

export async function executeValidatedQuery<T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  context: string,
  validationFn?: (data: T) => { isValid: boolean; errors: string[] }
): Promise<QueryValidationResult> {
  try {
    console.log(`[QueryHelper] Executing query: ${context}`);
    const { data, error } = await queryFn();

    if (error) {
      console.error(`[QueryHelper] Query failed for ${context}:`, error);

      if (error.code === 'PGRST201') {
        return {
          success: false,
          error,
          validationErrors: [
            'Database query has ambiguous foreign key relationship. Please check query syntax.',
            `Error details: ${error.message}`,
            `Hint: ${error.hint || 'Use explicit foreign key constraint names in your query'}`
          ]
        };
      }

      return {
        success: false,
        error,
        validationErrors: [`Query failed: ${error.message}`]
      };
    }

    if (validationFn && data) {
      const validation = validationFn(data);
      if (!validation.isValid) {
        console.warn(`[QueryHelper] Data validation failed for ${context}:`, validation.errors);
        return {
          success: false,
          data,
          validationErrors: validation.errors
        };
      }
    }

    console.log(`[QueryHelper] Query successful: ${context}`);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`[QueryHelper] Unexpected error in ${context}:`, error);
    return {
      success: false,
      error,
      validationErrors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

export const EXPLICIT_FOREIGN_KEYS = {
  scenario_options: {
    scenario: 'scenarios!scenario_options_scenario_fkey',
    next_scenario: 'scenarios!scenario_options_next_scenario_fkey',
    feedback_video_beginner_file: 'video_files!scenario_options_feedback_video_file_id_beginner_fkey',
    feedback_video_intermediate_file: 'video_files!scenario_options_feedback_video_file_id_intermediate_fkey',
    feedback_video_advanced_file: 'video_files!scenario_options_feedback_video_file_id_advanced_fkey',
    feedback_video_beginner_library: 'video_library!scenario_options_feedback_video_library_id_beginner_fkey',
    feedback_video_intermediate_library: 'video_library!scenario_options_feedback_video_library_id_intermediate_fkey',
    feedback_video_advanced_library: 'video_library!scenario_options_feedback_video_library_id_advanced_fkey',
    transition_video_file: 'video_files!scenario_options_transition_video_file_id_fkey',
    transition_video_library: 'video_library!scenario_options_transition_video_library_id_fkey'
  },
  scenarios: {
    topic: 'topics!scenarios_topic_id_fkey',
    created_by: 'profiles!scenarios_created_by_fkey',
    parent_scenario: 'scenarios!scenarios_parent_scenario_id_fkey',
    prompt_video_file: 'video_files!scenarios_prompt_video_file_id_fkey',
    introduction_video_file: 'video_files!scenarios_introduction_video_file_id_fkey',
    transition_video_file: 'video_files!scenarios_transition_video_file_id_fkey',
    prompt_video_library: 'video_library!scenarios_prompt_video_library_id_fkey',
    introduction_video_library: 'video_library!scenarios_introduction_video_library_id_fkey',
    transition_video_library: 'video_library!scenarios_transition_video_library_id_fkey'
  },
  simulation_scenarios: {
    simulation: 'simulations!simulation_scenarios_simulation_id_fkey',
    scenario: 'scenarios!simulation_scenarios_scenario_id_fkey'
  },
  simulations: {
    created_by: 'profiles!simulations_created_by_fkey',
    category: 'simulation_categories!simulations_category_id_fkey',
    entry_scenario: 'scenarios!simulations_entry_scenario_id_fkey',
    template_source: 'simulations!simulations_template_source_id_fkey'
  },
  cohort_members: {
    cohort: 'cohorts!cohort_members_cohort_id_fkey',
    learner: 'profiles!cohort_members_learner_id_fkey'
  },
  assignment_learners: {
    assignment: 'training_assignments!assignment_learners_assignment_id_fkey',
    learner: 'profiles!assignment_learners_learner_id_fkey',
    graded_by: 'profiles!assignment_learners_graded_by_fkey'
  }
} as const;

export function buildExplicitRelationshipQuery(
  table: keyof typeof EXPLICIT_FOREIGN_KEYS,
  relationships: string[]
): string {
  const fkMap = EXPLICIT_FOREIGN_KEYS[table];
  if (!fkMap) {
    console.warn(`[QueryHelper] No foreign key mappings found for table: ${table}`);
    return '';
  }

  const explicitRelationships = relationships.map(rel => {
    const key = rel as keyof typeof fkMap;
    if (fkMap[key]) {
      return fkMap[key];
    }
    console.warn(`[QueryHelper] No explicit foreign key found for ${table}.${rel}`);
    return rel;
  });

  return explicitRelationships.join(', ');
}

export async function fetchScenarioWithOptions(scenarioId: string): Promise<QueryValidationResult> {
  return executeValidatedQuery(
    async () => {
      const { data: scenario, error: scenarioError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .maybeSingle();

      if (scenarioError) return { data: null, error: scenarioError };

      const { data: options, error: optionsError } = await supabase
        .from('scenario_options')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('option_order');

      if (optionsError) return { data: null, error: optionsError };

      return {
        data: {
          ...scenario,
          options: options || []
        },
        error: null
      };
    },
    'fetchScenarioWithOptions'
  );
}

export async function saveScenarioWithOptions(
  scenarioId: string,
  scenarioData: any,
  options: any[]
): Promise<QueryValidationResult> {
  return executeValidatedQuery(
    async () => {
      const { error: scenarioError } = await supabase
        .from('scenarios')
        .update(scenarioData)
        .eq('id', scenarioId);

      if (scenarioError) return { data: null, error: scenarioError };

      const { data: existingOptions, error: fetchError } = await supabase
        .from('scenario_options')
        .select('id')
        .eq('scenario_id', scenarioId);

      if (fetchError) return { data: null, error: fetchError };

      const existingOptionIds = new Set(existingOptions?.map(o => o.id) || []);
      const currentOptionIds = new Set(options.map(o => o.id).filter(Boolean));

      const optionsToDelete = Array.from(existingOptionIds).filter(id => !currentOptionIds.has(id));

      if (optionsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('scenario_options')
          .delete()
          .in('id', optionsToDelete);

        if (deleteError) {
          console.error('[QueryHelper] Error deleting options:', deleteError);
          return { data: null, error: deleteError };
        }
      }

      const optionsToUpsert = options.map(opt => ({
        ...opt,
        scenario_id: scenarioId
      }));

      const { error: upsertError } = await supabase
        .from('scenario_options')
        .upsert(optionsToUpsert);

      if (upsertError) return { data: null, error: upsertError };

      const { data: verification, error: verifyError } = await supabase
        .from('scenario_options')
        .select('id, next_scenario_id')
        .eq('scenario_id', scenarioId);

      if (verifyError) {
        console.warn('[QueryHelper] Could not verify saved options:', verifyError);
      }

      const expectedConnections = options.filter(o => o.next_scenario_id).length;
      const actualConnections = verification?.filter(o => o.next_scenario_id).length || 0;

      if (expectedConnections !== actualConnections) {
        console.error(
          `[QueryHelper] Connection mismatch after save: expected ${expectedConnections}, got ${actualConnections}`
        );
      }

      return {
        data: {
          scenario: scenarioData,
          options: verification,
          connectionsVerified: expectedConnections === actualConnections
        },
        error: null
      };
    },
    'saveScenarioWithOptions'
  );
}

export async function validateDatabaseConnection(): Promise<boolean> {
  if (!supabase) {
    console.error('[QueryHelper] Supabase client not initialized');
    return false;
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('[QueryHelper] Database connection validation failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[QueryHelper] Database connection test error:', error);
    return false;
  }
}

export async function validateSession(): Promise<{ isValid: boolean; userId?: string; error?: string }> {
  if (!supabase) {
    return { isValid: false, error: 'Supabase client not initialized' };
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return { isValid: false, error: error.message };
    }

    if (!session) {
      return { isValid: false, error: 'No active session' };
    }

    return { isValid: true, userId: session.user.id };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error validating session'
    };
  }
}
