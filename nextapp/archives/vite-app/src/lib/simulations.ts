import { supabase } from './supabase';
import { retryWithBackoff, withTimeout } from './retryUtils';
import { resolveVideoFileIdToUrl } from './urlUtils';
import { simulationCache } from './simulationCache';
import {
  Simulation,
  SimulationScenario,
  SimulationWithScenarios,
  SimulationFormData,
  SimulationStatus
} from '../types';

export class SimulationService {
  /**
   * Helper function to resolve video URL from various sources (file ID, library ID, or direct URL)
   */
  private static async resolveVideoUrl(
    url: string | null,
    fileId: string | null,
    source: string | null
  ): Promise<string | null> {
    if (url && url.trim() !== '') {
      return url;
    }

    if (source === 'upload' || source === 'file') {
      if (fileId) {
        const resolvedUrl = await resolveVideoFileIdToUrl(fileId, supabase);
        if (resolvedUrl) {
          console.log(`[SimulationService] Resolved file ID ${fileId} to URL: ${resolvedUrl.substring(0, 80)}...`);
          return resolvedUrl;
        }
      }
    }

    return null;
  }

  static async createSimulation(
    data: SimulationFormData,
    createdBy: string
  ): Promise<Simulation | null> {
    if (!supabase) return null;

    try {
      console.log('[SimulationService] Creating simulation with data:');
      console.log('  - Introduction Page Enabled:', data.introduction_page_enabled);
      console.log('  - Introduction Title:', data.introduction_title || '(not set)');
      console.log('  - Introduction Description:', data.introduction_description ? `${data.introduction_description.substring(0, 50)}...` : '(not set)');
      console.log('  - Introduction Video URL:', data.introduction_video_url || '(not set)');
      console.log('  - Introduction Video Type:', data.introduction_video_type || 'synthesia');

      const insertData = {
        name: data.name,
        display_name: data.display_name,
        description: data.description,
        category_id: data.category_id || null,
        difficulty: data.difficulty,
        estimated_duration_minutes: data.estimated_duration_minutes,
        created_by: createdBy,
        status: 'draft',

        landing_page_enabled: data.landing_page_enabled,
        landing_intro_video_url: data.landing_intro_video_url || null,
        landing_intro_video_type: data.landing_intro_video_type,
        landing_title: data.landing_title || null,
        landing_description: data.landing_description || null,
        landing_objectives: data.landing_objectives || [],
        landing_role_description: data.landing_role_description || null,
        landing_image_url: data.landing_image_url || null,
        landing_image_alt: data.landing_image_alt || null,
        landing_fiction_contract: data.landing_fiction_contract,

        introduction_page_enabled: data.introduction_page_enabled !== false,
        introduction_title: data.introduction_title || null,
        introduction_description: data.introduction_description || null,
        introduction_video_url: data.introduction_video_url || null,
        introduction_video_type: data.introduction_video_type || 'synthesia',

        closing_page_enabled: data.closing_page_enabled,
        closing_video_url: data.closing_video_url || null,
        closing_video_type: data.closing_video_type,
        closing_video_excellent_url: data.closing_video_excellent_url || null,
        closing_video_excellent_type: data.closing_video_excellent_type || 'synthesia',
        closing_video_excellent_file_id: data.closing_video_excellent_file_id || null,
        closing_video_excellent_source: data.closing_video_excellent_source || null,
        closing_video_good_url: data.closing_video_good_url || null,
        closing_video_good_type: data.closing_video_good_type || 'synthesia',
        closing_video_good_file_id: data.closing_video_good_file_id || null,
        closing_video_good_source: data.closing_video_good_source || null,
        closing_video_developing_url: data.closing_video_developing_url || null,
        closing_video_developing_type: data.closing_video_developing_type || 'synthesia',
        closing_video_developing_file_id: data.closing_video_developing_file_id || null,
        closing_video_developing_source: data.closing_video_developing_source || null,
        closing_excellent_threshold: data.closing_excellent_threshold || 85,
        closing_good_threshold: data.closing_good_threshold || 70,
        closing_page_show_before_results: data.closing_page_show_before_results !== false,
        closing_title: data.closing_title,
        closing_analysis_type: data.closing_analysis_type,
        closing_recommendations_enabled: data.closing_recommendations_enabled,

        tags: data.tags || []
      };

      console.log('[SimulationService] Verifying introduction fields in insert payload:');
      console.log('  - introduction_page_enabled:', insertData.introduction_page_enabled);
      console.log('  - introduction_title:', insertData.introduction_title);
      console.log('  - introduction_description:', insertData.introduction_description ? 'SET' : 'NULL');
      console.log('  - introduction_video_url:', insertData.introduction_video_url ? 'SET' : 'NULL');

      const { data: simulation, error } = await supabase
        .from('simulations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[SimulationService] CREATE ERROR:', error);
        throw error;
      }

      console.log('[SimulationService] Simulation created successfully:', simulation.id);
      console.log('[SimulationService] Returned introduction fields:');
      console.log('  - introduction_title:', simulation.introduction_title);
      console.log('  - introduction_description:', simulation.introduction_description ? 'SET' : 'NULL');
      console.log('  - introduction_video_url:', simulation.introduction_video_url ? 'SET' : 'NULL');

      return simulation;
    } catch (error) {
      console.error('[SimulationService] Error creating simulation:', error);
      return null;
    }
  }

  static async getSimulation(simulationId: string): Promise<SimulationWithScenarios | null> {
    if (!supabase) return null;

    const cached = simulationCache.get(simulationId);
    if (cached) {
      return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const startTime = performance.now();

        const { data: simulation, error: simError } = await withTimeout(
          supabase
            .from('simulations')
            .select(`
              *,
              display_name_en,
              display_name_es,
              description_en,
              description_es,
              landing_title_en,
              landing_title_es,
              landing_description_en,
              landing_description_es,
              landing_role_description_en,
              landing_role_description_es,
              closing_title_en,
              closing_title_es
            `)
            .eq('id', simulationId)
            .single(),
          5000,
          'Fetch simulation request timed out'
        );

        if (simError) throw simError;
        if (!simulation) return null;

        const [scenariosResult, optionsResult] = await Promise.all([
          withTimeout(
            supabase
              .from('simulation_scenarios')
              .select(`
                id,
                simulation_id,
                scenario_id,
                is_entry_point,
                is_exit_point,
                sequence_order,
                position_x,
                position_y,
                notes,
                created_at,
                scenarios (
                  id,
                  title,
                  title_en,
                  title_es,
                  description,
                  description_en,
                  description_es,
                  question_text,
                  question_text_en,
                  question_text_es,
                  topic_id,
                  difficulty,
                  is_end_scenario,
                  content_status,
                  prompt_video_url,
                  prompt_video_file_id,
                  prompt_video_source,
                  introduction_video_url,
                  introduction_video_file_id,
                  introduction_video_source,
                  transition_video_url,
                  transition_video_file_id,
                  transition_video_source,
                  fiction_contract_text,
                  metadata,
                  timer_enabled,
                  timer_visible,
                  timer_display_location,
                  timer_type,
                  timer_limit_seconds,
                  show_timer_in_feedback,
                  timer_warning_threshold_seconds,
                  hierarchy_level
                )
              `)
              .eq('simulation_id', simulationId)
              .order('sequence_order', { ascending: true }),
            5000,
            'Fetch simulation scenarios request timed out'
          ),
          withTimeout(
            supabase.rpc('get_simulation_with_scenarios_optimized', { sim_id: simulationId }),
            5000,
            'Fetch optimized simulation data timed out'
          ).catch((err) => {
            console.log('[SimulationService] Optimized RPC not available, using fallback method:', err.message);
            return null;
          })
        ]);

        const { data: simScenarios, error: scenError } = scenariosResult;

        if (scenError) {
          console.error('Error fetching simulation scenarios:', scenError);
          const fallbackResult = {
            ...simulation,
            scenarios: [],
            scenario_count: 0
          } as SimulationWithScenarios;
          simulationCache.set(simulationId, fallbackResult, 60000);
          return fallbackResult;
        }

        const scenarioIds = simScenarios?.map(s => s.scenario_id).filter(Boolean) || [];
        let scenarioOptionsMap: Record<string, any[]> = {};
        let videoUrlsMap: Record<string, any> = {};

        if (scenarioIds.length > 0) {
          const { data: allOptions, error: optionsError } = await withTimeout(
            supabase
              .from('scenario_options')
              .select(`
                id,
                scenario_id,
                option_text,
                option_text_en,
                option_text_es,
                option_order,
                next_scenario_id,
                feedback_beginner,
                feedback_beginner_en,
                feedback_beginner_es,
                feedback_intermediate,
                feedback_intermediate_en,
                feedback_intermediate_es,
                feedback_advanced,
                feedback_advanced_en,
                feedback_advanced_es,
                feedback_video_url_beginner,
                feedback_video_url_intermediate,
                feedback_video_url_advanced,
                feedback_video_source_beginner,
                feedback_video_source_intermediate,
                feedback_video_source_advanced,
                feedback_video_library_id_beginner,
                feedback_video_library_id_intermediate,
                feedback_video_library_id_advanced,
                feedback_video_file_id_beginner,
                feedback_video_file_id_intermediate,
                feedback_video_file_id_advanced,
                feedback_video_embed_code_beginner,
                feedback_video_embed_code_intermediate,
                feedback_video_embed_code_advanced,
                feedback_video_duration,
                feedback_video_thumbnail,
                transition_video_url,
                transition_video_source,
                transition_video_library_id,
                transition_video_file_id,
                transition_video_embed_code,
                transition_video_duration,
                transition_video_thumbnail,
                skill_impacts,
                competency_impacts
              `)
              .in('scenario_id', scenarioIds)
              .order('scenario_id', { ascending: true })
              .order('option_order', { ascending: true }),
            5000,
            'Fetch scenario options request timed out'
          );

          if (optionsError) {
            console.error('Error fetching scenario options:', optionsError);
          } else if (allOptions) {
            const optionIds = allOptions.map(opt => opt.id);

            if (optionIds.length > 0) {
              try {
                const { data: batchVideoUrls, error: batchError } = await supabase.rpc(
                  'get_option_feedback_videos_batch',
                  { option_ids: optionIds }
                );

                if (batchError) {
                  if (batchError.code === 'PGRST204' || batchError.message?.includes('not found')) {
                    console.log('[SimulationService] Batch video RPC not available, using individual resolution');
                  } else {
                    console.warn('[SimulationService] Error calling batch video RPC:', batchError.message);
                  }
                } else if (batchVideoUrls) {
                  batchVideoUrls.forEach((result: any) => {
                    videoUrlsMap[result.option_id] = {
                      beginner: result.beginner_url,
                      intermediate: result.intermediate_url,
                      advanced: result.advanced_url
                    };
                  });
                }
              } catch (error: any) {
                console.log('[SimulationService] Failed to batch resolve video URLs, using individual resolution:', error.message || error);
              }
            }

            scenarioOptionsMap = allOptions.reduce((acc, opt) => {
              if (!acc[opt.scenario_id]) {
                acc[opt.scenario_id] = [];
              }
              acc[opt.scenario_id].push(opt);
              return acc;
            }, {} as Record<string, any[]>);
          }
        }

        const transformedScenarios = await Promise.all(simScenarios?.map(async (simScenario) => {
          if (!simScenario.scenarios) {
            console.error('Missing scenarios data for simulation_scenario:', simScenario.id);
            return null;
          }

          const scenarioData = simScenario.scenarios;

          const resolvedIntroVideoUrl = await this.resolveVideoUrl(
            scenarioData.introduction_video_url,
            scenarioData.introduction_video_file_id,
            scenarioData.introduction_video_source
          );

          const resolvedPromptVideoUrl = await this.resolveVideoUrl(
            scenarioData.prompt_video_url,
            scenarioData.prompt_video_file_id,
            scenarioData.prompt_video_source
          );

          const resolvedTransitionVideoUrl = await this.resolveVideoUrl(
            scenarioData.transition_video_url,
            scenarioData.transition_video_file_id,
            scenarioData.transition_video_source
          );

          const scenarioOptions = scenarioOptionsMap[simScenario.scenario_id] || [];
          const transformedOptions = await Promise.all(scenarioOptions.map(async (opt: any) => {
            const batchResolved = videoUrlsMap[opt.id];

            const resolvedBeginnerVideo = batchResolved?.beginner ||
              await this.resolveVideoUrl(
                opt.feedback_video_url_beginner,
                opt.feedback_video_file_id_beginner,
                opt.feedback_video_source_beginner
              );

            const resolvedIntermediateVideo = batchResolved?.intermediate ||
              await this.resolveVideoUrl(
                opt.feedback_video_url_intermediate,
                opt.feedback_video_file_id_intermediate,
                opt.feedback_video_source_intermediate
              );

            const resolvedAdvancedVideo = batchResolved?.advanced ||
              await this.resolveVideoUrl(
                opt.feedback_video_url_advanced,
                opt.feedback_video_file_id_advanced,
                opt.feedback_video_source_advanced
              );

            const resolvedTransitionVideo = await this.resolveVideoUrl(
              opt.transition_video_url,
              opt.transition_video_file_id,
              opt.transition_video_source
            );

            const feedbackBeginner = typeof opt.feedback_beginner === 'string' ? opt.feedback_beginner : '';
            const feedbackIntermediate = typeof opt.feedback_intermediate === 'string' ? opt.feedback_intermediate : feedbackBeginner;
            const feedbackAdvanced = typeof opt.feedback_advanced === 'string' ? opt.feedback_advanced : feedbackBeginner;

            return {
              id: opt.id,
              text: opt.option_text,
              option_text: opt.option_text,
              option_text_en: opt.option_text_en,
              option_text_es: opt.option_text_es,
              feedback: {
                beginner: feedbackBeginner || '',
                intermediate: feedbackIntermediate || '',
                advanced: feedbackAdvanced || ''
              },
              feedback_beginner: opt.feedback_beginner,
              feedback_beginner_en: opt.feedback_beginner_en,
              feedback_beginner_es: opt.feedback_beginner_es,
              feedback_intermediate: opt.feedback_intermediate,
              feedback_intermediate_en: opt.feedback_intermediate_en,
              feedback_intermediate_es: opt.feedback_intermediate_es,
              feedback_advanced: opt.feedback_advanced,
              feedback_advanced_en: opt.feedback_advanced_en,
              feedback_advanced_es: opt.feedback_advanced_es,
              feedbackVideos: {
                beginner: resolvedBeginnerVideo || opt.feedback_video_url_beginner || null,
                intermediate: resolvedIntermediateVideo || opt.feedback_video_url_intermediate || null,
                advanced: resolvedAdvancedVideo || opt.feedback_video_url_advanced || null
              },
              feedbackVideoMetadata: {
                beginner: {
                  source: opt.feedback_video_source_beginner,
                  libraryId: opt.feedback_video_library_id_beginner,
                  fileId: opt.feedback_video_file_id_beginner,
                  embedCode: opt.feedback_video_embed_code_beginner,
                  url: opt.feedback_video_url_beginner
                },
                intermediate: {
                  source: opt.feedback_video_source_intermediate,
                  libraryId: opt.feedback_video_library_id_intermediate,
                  fileId: opt.feedback_video_file_id_intermediate,
                  embedCode: opt.feedback_video_embed_code_intermediate,
                  url: opt.feedback_video_url_intermediate
                },
                advanced: {
                  source: opt.feedback_video_source_advanced,
                  libraryId: opt.feedback_video_library_id_advanced,
                  fileId: opt.feedback_video_file_id_advanced,
                  embedCode: opt.feedback_video_embed_code_advanced,
                  url: opt.feedback_video_url_advanced
                }
              },
              feedbackVideoDuration: opt.feedback_video_duration,
              feedbackVideoThumbnail: opt.feedback_video_thumbnail,
              transitionVideoUrl: resolvedTransitionVideo || opt.transition_video_url,
              transitionVideoMetadata: {
                source: opt.transition_video_source,
                libraryId: opt.transition_video_library_id,
                fileId: opt.transition_video_file_id,
                embedCode: opt.transition_video_embed_code,
                url: resolvedTransitionVideo || opt.transition_video_url
              },
              transitionVideoDuration: opt.transition_video_duration,
              transitionVideoThumbnail: opt.transition_video_thumbnail,
              nextScenarioId: opt.next_scenario_id,
              skillImpact: opt.skill_impacts || {},
              competency_impacts: opt.competency_impacts || opt.skill_impacts || {}
            };
          }));

          return {
            id: simScenario.id,
            simulation_id: simScenario.simulation_id,
            scenario_id: simScenario.scenario_id,
            is_entry_point: simScenario.is_entry_point,
            is_exit_point: simScenario.is_exit_point,
            sequence_order: simScenario.sequence_order,
            position_x: simScenario.position_x,
            position_y: simScenario.position_y,
            notes: simScenario.notes,
            created_at: simScenario.created_at,
            scenarios: {
              id: scenarioData.id,
              title: scenarioData.title,
              title_en: scenarioData.title_en,
              title_es: scenarioData.title_es,
              description: scenarioData.description,
              description_en: scenarioData.description_en,
              description_es: scenarioData.description_es,
              topicId: scenarioData.topic_id,
              topic_id: scenarioData.topic_id,
              difficulty: scenarioData.difficulty,
              is_end_scenario: scenarioData.is_end_scenario,
              isEndScenario: scenarioData.is_end_scenario,
              content_status: scenarioData.content_status,
              promptVideoUrl: resolvedPromptVideoUrl || scenarioData.prompt_video_url,
              prompt_video_url: resolvedPromptVideoUrl || scenarioData.prompt_video_url,
              introductionVideoUrl: resolvedIntroVideoUrl || scenarioData.introduction_video_url,
              introduction_video_url: resolvedIntroVideoUrl || scenarioData.introduction_video_url,
              transitionVideoUrl: resolvedTransitionVideoUrl || scenarioData.transition_video_url,
              transition_video_url: resolvedTransitionVideoUrl || scenarioData.transition_video_url,
              fiction_contract_text: scenarioData.fiction_contract_text,
              videoPrompt: scenarioData.metadata?.videoPrompt || '',
              timerEnabled: scenarioData.timer_enabled || false,
              timerVisible: scenarioData.timer_visible || false,
              timerDisplayLocation: scenarioData.timer_display_location || 'hidden',
              timerType: scenarioData.timer_type || 'count_up',
              timerLimitSeconds: scenarioData.timer_limit_seconds || null,
              showTimerInFeedback: scenarioData.show_timer_in_feedback !== undefined ? scenarioData.show_timer_in_feedback : true,
              timerWarningThresholdSeconds: scenarioData.timer_warning_threshold_seconds || 30,
              questionText: scenarioData.question_text || 'How would you respond?',
              question_text: scenarioData.question_text,
              question_text_en: scenarioData.question_text_en,
              question_text_es: scenarioData.question_text_es,
              hierarchyLevel: scenarioData.hierarchy_level,
              options: transformedOptions
            }
          };
        }) || []).then(results => results.filter(s => s !== null));

        const sortedScenarios = [...transformedScenarios].sort((a, b) => {
          if (a.is_entry_point && !b.is_entry_point) return -1;
          if (!a.is_entry_point && b.is_entry_point) return 1;
          return a.sequence_order - b.sequence_order;
        });

        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`[SimulationService] Loaded simulation ${simulationId} in ${loadTime.toFixed(0)}ms`);

        const maxLevel = await this.getSimulationMaxLevel(simulationId);

        const result = {
          ...simulation,
          scenarios: sortedScenarios,
          scenario_count: sortedScenarios.length,
          max_level: maxLevel
        } as SimulationWithScenarios;

        simulationCache.set(simulationId, result);
        return result;
      });
    } catch (error) {
      console.error('Error fetching simulation:', error);
      return null;
    }
  }

  static async getAllSimulations(categoryId?: string): Promise<Simulation[]> {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('simulations')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching simulations:', error);
      return [];
    }
  }

  static async getPublishedSimulations(categoryId?: string): Promise<Simulation[]> {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('simulations')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching published simulations:', error);
      return [];
    }
  }

  static async updateSimulation(
    simulationId: string,
    updates: Partial<SimulationFormData>
  ): Promise<boolean> {
    if (!supabase) {
      console.error('[SimulationService] Supabase not configured');
      return false;
    }

    try {
      console.log('[SimulationService] Updating simulation:', simulationId);
      console.log('[SimulationService] Update contains introduction fields:');
      console.log('  - introduction_page_enabled:', updates.introduction_page_enabled !== undefined ? updates.introduction_page_enabled : '(not in update)');
      console.log('  - introduction_title:', updates.introduction_title !== undefined ? updates.introduction_title || '(empty string)' : '(not in update)');
      console.log('  - introduction_description:', updates.introduction_description !== undefined ? (updates.introduction_description ? 'SET' : '(empty string)') : '(not in update)');
      console.log('  - introduction_video_url:', updates.introduction_video_url !== undefined ? (updates.introduction_video_url || '(empty string)') : '(not in update)');
      console.log('  - introduction_video_type:', updates.introduction_video_type !== undefined ? updates.introduction_video_type : '(not in update)');

      const { data, error } = await supabase
        .from('simulations')
        .update(updates)
        .eq('id', simulationId)
        .select('id, introduction_title, introduction_description, introduction_video_url, introduction_page_enabled');

      if (error) {
        console.error('[SimulationService] Update error:', error);
        console.error('[SimulationService] Error code:', error.code);
        console.error('[SimulationService] Error message:', error.message);
        console.error('[SimulationService] Error details:', error.details);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('[SimulationService] Update returned no data');
        return false;
      }

      console.log('[SimulationService] Update successful:', data[0].id);
      console.log('[SimulationService] Returned introduction fields after update:');
      console.log('  - introduction_title:', data[0].introduction_title || '(null)');
      console.log('  - introduction_description:', data[0].introduction_description ? 'SET' : '(null)');
      console.log('  - introduction_video_url:', data[0].introduction_video_url || '(null)');
      console.log('  - introduction_page_enabled:', data[0].introduction_page_enabled);

      simulationCache.invalidate(simulationId);
      console.log('[SimulationService] Cache invalidated for:', simulationId);
      return true;
    } catch (error: any) {
      console.error('[SimulationService] Error updating simulation:', error);
      const errorMessage = error.message || 'Unknown error';
      console.error('[SimulationService] Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: errorMessage
      });
      throw new Error(`Failed to update simulation: ${errorMessage}`);
    }
  }

  static async updateSimulationStatus(
    simulationId: string,
    status: SimulationStatus
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('simulations')
        .update({ status })
        .eq('id', simulationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating simulation status:', error);
      return false;
    }
  }

  static async deleteSimulation(simulationId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      console.log('[SimulationService] Attempting to delete simulation:', simulationId);

      const { data: duplicates, error: duplicatesCheckError } = await supabase
        .from('simulations')
        .select('id, name, display_name')
        .eq('template_source_id', simulationId);

      if (duplicatesCheckError) {
        console.warn('[SimulationService] Error checking for duplicate simulations:', duplicatesCheckError);
      } else if (duplicates && duplicates.length > 0) {
        console.log(`[SimulationService] Found ${duplicates.length} simulations using this as a template source. Their template_source_id will be set to NULL.`);
      }

      const { error: assignmentsError } = await supabase
        .from('training_assignments')
        .delete()
        .eq('simulation_id', simulationId);

      if (assignmentsError) {
        console.error('[SimulationService] Error deleting training assignments:', assignmentsError);
        throw new Error(`Cannot delete simulation: ${assignmentsError.message}`);
      }

      const { error: scenariosError } = await supabase
        .from('simulation_scenarios')
        .delete()
        .eq('simulation_id', simulationId);

      if (scenariosError) {
        console.error('[SimulationService] Error deleting linked scenarios:', scenariosError);
      }

      const { error: competenciesError } = await supabase
        .from('simulation_competencies')
        .delete()
        .eq('simulation_id', simulationId);

      if (competenciesError) {
        console.error('[SimulationService] Error deleting linked competencies:', competenciesError);
      }

      const { error: metricsError } = await supabase
        .from('simulation_metrics')
        .delete()
        .eq('simulation_id', simulationId);

      if (metricsError) {
        console.error('[SimulationService] Error deleting linked metrics:', metricsError);
      }

      const { error } = await supabase
        .from('simulations')
        .delete()
        .eq('id', simulationId);

      if (error) {
        console.error('[SimulationService] Error deleting simulation:', error);
        throw error;
      }

      console.log('[SimulationService] Successfully deleted simulation:', simulationId);
      simulationCache.invalidate(simulationId);
      return true;
    } catch (error: any) {
      console.error('[SimulationService] Error deleting simulation:', error);
      throw new Error(`Failed to delete simulation: ${error.message || 'Unknown error'}`);
    }
  }

  static async addScenarioToSimulation(
    simulationId: string,
    scenarioId: string,
    options: {
      isEntryPoint?: boolean;
      isExitPoint?: boolean;
      sequenceOrder?: number;
      positionX?: number;
      positionY?: number;
      notes?: string;
    } = {}
  ): Promise<SimulationScenario | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('simulation_scenarios')
        .insert({
          simulation_id: simulationId,
          scenario_id: scenarioId,
          is_entry_point: options.isEntryPoint || false,
          is_exit_point: options.isExitPoint || false,
          sequence_order: options.sequenceOrder || 0,
          position_x: options.positionX || 0,
          position_y: options.positionY || 0,
          notes: options.notes || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding scenario to simulation:', error);
      return null;
    }
  }

  static async removeScenarioFromSimulation(
    simulationId: string,
    scenarioId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('simulation_scenarios')
        .delete()
        .eq('simulation_id', simulationId)
        .eq('scenario_id', scenarioId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing scenario from simulation:', error);
      return false;
    }
  }

  static async updateSimulationScenario(
    simulationScenarioId: string,
    updates: Partial<Omit<SimulationScenario, 'id' | 'simulation_id' | 'scenario_id' | 'created_at'>>
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('simulation_scenarios')
        .update(updates)
        .eq('id', simulationScenarioId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating simulation scenario:', error);
      return false;
    }
  }

  static async setEntryPoint(
    simulationId: string,
    scenarioId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      await supabase
        .from('simulation_scenarios')
        .update({ is_entry_point: false })
        .eq('simulation_id', simulationId);

      const { error } = await supabase
        .from('simulation_scenarios')
        .update({ is_entry_point: true })
        .eq('simulation_id', simulationId)
        .eq('scenario_id', scenarioId);

      if (error) throw error;

      await supabase
        .from('simulations')
        .update({ entry_scenario_id: scenarioId })
        .eq('id', simulationId);

      return true;
    } catch (error) {
      console.error('Error setting entry point:', error);
      return false;
    }
  }

  static async duplicateSimulation(
    simulationId: string,
    newName: string,
    createdBy: string
  ): Promise<Simulation | null> {
    if (!supabase) return null;

    try {
      const original = await this.getSimulation(simulationId);
      if (!original) return null;

      const { scenarios, scenario_count, ...simulationData } = original;

      const { data: newSimulation, error: createError } = await supabase
        .from('simulations')
        .insert({
          ...simulationData,
          id: undefined,
          name: newName,
          display_name: `${original.display_name} (Copy)`,
          status: 'draft',
          created_by: createdBy,
          created_at: undefined,
          updated_at: undefined,
          published_at: null,
          is_template: false,
          template_source_id: simulationId
        })
        .select()
        .single();

      if (createError) throw createError;

      for (const simScenario of scenarios) {
        await this.addScenarioToSimulation(
          newSimulation.id,
          simScenario.scenario_id,
          {
            isEntryPoint: simScenario.is_entry_point,
            isExitPoint: simScenario.is_exit_point,
            sequenceOrder: simScenario.sequence_order,
            positionX: simScenario.position_x,
            positionY: simScenario.position_y,
            notes: simScenario.notes
          }
        );
      }

      return newSimulation;
    } catch (error) {
      console.error('Error duplicating simulation:', error);
      return null;
    }
  }

  static async getSimulationsByCategory(categoryId: string): Promise<Simulation[]> {
    return this.getAllSimulations(categoryId);
  }

  static async getSimulationCount(categoryId?: string): Promise<number> {
    if (!supabase) return 0;

    try {
      let query = supabase
        .from('simulations')
        .select('id', { count: 'exact', head: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting simulation count:', error);
      return 0;
    }
  }

  static async getSimulationMaxLevel(simulationId: string): Promise<number> {
    if (!supabase) return 0;

    try {
      const { data, error } = await supabase.rpc('get_simulation_max_level', {
        p_simulation_id: simulationId
      });

      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('not found')) {
          console.log('[SimulationService] get_simulation_max_level RPC not available, using fallback');
        } else {
          console.warn('[SimulationService] Error calling get_simulation_max_level:', error.message);
        }
        throw error;
      }
      return data || 0;
    } catch (error: any) {
      console.log('[SimulationService] Calculating max_level from scenarios (fallback mode)');

      try {
        const { data: scenarios, error: scenariosError } = await supabase
          .from('simulation_scenarios')
          .select(`
            scenarios (
              hierarchy_level
            )
          `)
          .eq('simulation_id', simulationId);

        if (scenariosError) {
          console.error('[SimulationService] Error fetching scenarios for max level:', scenariosError);
          return 0;
        }

        if (scenarios && scenarios.length > 0) {
          const levels = scenarios
            .map((s: any) => s.scenarios?.hierarchy_level)
            .filter((l: any) => l !== null && l !== undefined) as number[];

          if (levels.length > 0) {
            return Math.max(...levels);
          }
        }
      } catch (fallbackError: any) {
        console.error('[SimulationService] Error in fallback max level calculation:', fallbackError.message || fallbackError);
      }

      return 0;
    }
  }
}
