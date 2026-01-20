import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Difficulty, LearnerProgress, Scenario, SoftSkillTopic, User, PreviewSession, LandingPageContent, LandingPageProgress, ResumePoint, SimulationCategory } from '../types';
import { TOPICS } from '../data/topics';
import { SCENARIOS } from '../data/scenarios';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sanitizeVideoUrl } from '../lib/urlUtils';
import { checkRateLimit, resetRateLimit, formatResetTime } from '../lib/rateLimiter';
import { validateEmail } from '../lib/jwtVerification';

const mapRoleFromDb = (role: string): 'student' | 'instructor' | 'admin' => {
  return role === 'learner' ? 'student' : role as 'student' | 'instructor' | 'admin';
};

export interface SimulationSession {
  simulationId: string;
  instanceId: string | null;
  currentScenarioIndex: number;
  selectedOptionId: string | null;
  decisionHistory: Array<{
    scenarioId: string;
    optionId: string;
    timestamp: number;
  }>;
  competencyScores: Record<string, number>;
  startedAt: number;
  currentLevel?: number;
  levelsCompleted?: number;
}

interface SimulationState {
  // User state
  currentUser: User | null;
  isAuthenticated: boolean;

  // Simulation state
  selectedTopic: SoftSkillTopic | null;
  selectedDifficulty: Difficulty | null;
  currentScenario: Scenario | null;
  scenarioHistory: {
    scenarioId: string;
    selectedOptionId: string;
    timestamp: number;
  }[];

  // Active simulation session state
  activeSession: SimulationSession | null;

  // Admin state
  scenarios: Scenario[];

  // Category state
  categories: SimulationCategory[];
  categoriesLoaded: boolean;

  // Preview state
  previewSession: PreviewSession;

  // Actions
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectTopic: (topicId: string) => void;
  selectDifficulty: (difficulty: Difficulty) => void;
  startSimulation: () => void;
  selectOption: (optionId: string) => void;
  resetSimulation: () => void;
  getTopics: () => SoftSkillTopic[];
  getScenarioById: (id: string) => Scenario | undefined;
  getUserProgress: () => LearnerProgress | undefined;

  // Category actions
  loadCategories: () => Promise<void>;
  getCategories: () => SimulationCategory[];

  // Session management actions
  initializeSession: (simulationId: string, instanceId: string | null) => void;
  updateSessionScenarioIndex: (index: number) => void;
  updateSessionSelectedOption: (optionId: string | null) => void;
  addSessionDecision: (scenarioId: string, optionId: string) => void;
  updateSessionCompetencyScores: (scores: Record<string, number>) => void;
  clearSession: () => void;

  // Admin actions
  loadScenarios: () => Promise<void>;
  updateScenario: (id: string, data: Partial<Scenario>) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  addScenario: (data?: Partial<Scenario>) => Promise<void>;

  // Preview actions
  startPreview: (scenarioId: string, difficulty: Difficulty, topicId: string) => void;
  selectPreviewOption: (optionId: string) => void;
  exitPreview: () => void;
  resetPreview: () => void;

  // Landing page actions
  loadLandingPage: (topicId: string, difficulty: Difficulty) => Promise<LandingPageContent | null>;
  saveLandingPageProgress: (progress: Partial<LandingPageProgress>) => Promise<void>;
  getResumePoint: (userId: string, topicId: string) => Promise<ResumePoint | null>;
  clearResumePoint: (userId: string, topicId: string, difficulty: Difficulty) => Promise<void>;
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      isAuthenticated: false,
      selectedTopic: null,
      selectedDifficulty: null,
      currentScenario: null,
      scenarioHistory: [],
      activeSession: null,
      scenarios: SCENARIOS,
      categories: [],
      categoriesLoaded: false,
      previewSession: {
        isActive: false,
        startScenarioId: null,
        difficulty: null,
        topicId: null,
        pathHistory: [],
        skillImpacts: {}
      },
      
      // Actions
      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
      
      login: async (email, password) => {
        if (!email || !password) {
          return false;
        }

        if (!validateEmail(email)) {
          console.error('Invalid email format');
          return false;
        }

        const rateLimitCheck = checkRateLimit(email);
        if (!rateLimitCheck.allowed) {
          const resetTimeStr = rateLimitCheck.resetTime
            ? formatResetTime(rateLimitCheck.resetTime)
            : 'soon';
          console.error(`Too many login attempts. Please try again in ${resetTimeStr}`);
          return false;
        }

        // If Supabase is configured, try to use it
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (error || !user) {
              console.error('Login failed:', error?.message || 'Unknown error');
              return false;
            }

            resetRateLimit(email);

            // Get user profile from Supabase
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profileError || !profile) {
              return false;
            }

            // Check if account is active
            if (profile.is_active === false) {
              console.error('Account is deactivated');
              await supabase.auth.signOut();
              return false;
            }

            // Check if account is locked
            if (profile.account_locked_until) {
              const lockoutTime = new Date(profile.account_locked_until);
              if (lockoutTime > new Date()) {
                console.error('Account is temporarily locked until:', lockoutTime);
                await supabase.auth.signOut();
                return false;
              }
            }

            const userData: User = {
              id: user.id,
              name: profile.full_name || 'User',
              email: user.email!,
              username: profile.username,
              role: mapRoleFromDb(profile.role),
              institution: profile.institution,
              department: profile.department,
              position: profile.position,
              is_active: profile.is_active,
              password_last_changed: profile.password_last_changed,
              last_login_at: profile.last_login_at,
              failed_login_attempts: profile.failed_login_attempts,
              progress: profile.progress || {
                userId: user.id,
                completedScenarios: [],
                skillLevels: {}
              }
            };

            // Update last login timestamp
            try {
              await supabase.rpc('update_last_login', { user_id: user.id });
            } catch (rpcError) {
              console.warn('Failed to update last login timestamp:', rpcError);
            }

            console.log('Setting user in store:', { role: userData.role, username: userData.username, is_active: userData.is_active });
            set({ currentUser: userData, isAuthenticated: true });
            return true;
          } catch (error) {
            console.error('Login error:', error);
            return false;
          }
        } else {
          console.warn('Supabase not configured - Demo mode disabled');
          return false;
        }
      },
      
      logout: async () => {
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.warn('Supabase logout failed:', error);
          }
        }
        
        set({ 
          currentUser: null, 
          isAuthenticated: false,
          selectedTopic: null,
          selectedDifficulty: null,
          currentScenario: null,
          scenarioHistory: []
        });
      },
      
      selectTopic: (topicId) => {
        const topic = TOPICS.find(t => t.id === topicId);
        set({ selectedTopic: topic || null });
      },
      
      selectDifficulty: (difficulty) => {
        set({ selectedDifficulty: difficulty });
      },
      
      startSimulation: () => {
        const { selectedTopic, selectedDifficulty } = get();
        
        if (!selectedTopic || !selectedDifficulty) return;
        
        // Find the first scenario for the selected topic and difficulty
        const firstScenario = SCENARIOS.find(
          s => s.topicId === selectedTopic.id && s.difficulty === selectedDifficulty
        );
        
        if (firstScenario) {
          set({ currentScenario: firstScenario, scenarioHistory: [] });
        }
      },
      
      selectOption: (optionId) => {
        const { currentScenario, currentUser } = get();
        
        if (!currentScenario || !currentUser) return;
        
        // Find the selected option
        const selectedOption = currentScenario.options.find(o => o.id === optionId);
        
        if (!selectedOption) return;
        
        // Record the selection in history
        const historyEntry = {
          scenarioId: currentScenario.id,
          selectedOptionId: optionId,
          timestamp: Date.now()
        };
        
        // Update user's skill levels based on the option's impact
        const updatedUser = { ...currentUser };
        Object.entries(selectedOption.skillImpact).forEach(([skill, impact]) => {
          if (!updatedUser.progress.skillLevels[skill]) {
            updatedUser.progress.skillLevels[skill] = 0;
          }
          updatedUser.progress.skillLevels[skill] += impact;
          
          // Ensure skill levels don't go below 0
          if (updatedUser.progress.skillLevels[skill] < 0) {
            updatedUser.progress.skillLevels[skill] = 0;
          }
        });
        
        // Add to completed scenarios
        updatedUser.progress.completedScenarios.push(historyEntry);
        
        // Update user progress in Supabase if available
        if (isSupabaseConfigured && supabase) {
          supabase
            .from('profiles')
            .update({ progress: updatedUser.progress })
            .eq('id', currentUser.id)
            .then(({ error }) => {
              if (error) console.error('Error updating progress:', error);
            });
        }
        
        // Load next scenario if available
        let nextScenario = null;
        if (selectedOption.nextScenarioId) {
          nextScenario = SCENARIOS.find(s => s.id === selectedOption.nextScenarioId);
        }
        
        set({
          scenarioHistory: [...get().scenarioHistory, historyEntry],
          currentUser: updatedUser,
          currentScenario: nextScenario
        });
      },
      
      resetSimulation: () => {
        set({
          selectedTopic: null,
          selectedDifficulty: null,
          currentScenario: null,
          scenarioHistory: []
        });
      },
      
      getTopics: () => TOPICS,

      getScenarioById: (id) => SCENARIOS.find(s => s.id === id),

      getUserProgress: () => get().currentUser?.progress,

      // Category actions
      loadCategories: async () => {
        if (!isSupabaseConfigured || !supabase) {
          console.warn('Supabase not configured - using empty categories');
          set({ categories: [], categoriesLoaded: true });
          return;
        }

        try {
          const { data, error } = await supabase
            .from('simulation_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (error) {
            console.error('Error loading categories:', error);
            set({ categories: [], categoriesLoaded: true });
            return;
          }

          set({ categories: data || [], categoriesLoaded: true });
        } catch (error) {
          console.error('Error loading categories:', error);
          set({ categories: [], categoriesLoaded: true });
        }
      },

      getCategories: () => {
        const { categories, categoriesLoaded } = get();

        // Auto-load categories if not loaded yet
        if (!categoriesLoaded) {
          get().loadCategories();
        }

        return categories;
      },
      
      // Admin actions
      loadScenarios: async () => {
        if (!isSupabaseConfigured || !supabase) {
          // Use local scenarios if Supabase is not configured
          set({ scenarios: SCENARIOS });
          return;
        }

        try {
          const { data: scenariosData, error: scenariosError } = await supabase
            .from('scenarios')
            .select('*')
            .order('created_at', { ascending: false });

          if (scenariosError) throw scenariosError;

          const { data: optionsData, error: optionsError } = await supabase
            .from('scenario_options')
            .select('*')
            .order('option_order');

          if (optionsError) throw optionsError;

          const { data: metricsData, error: metricsError } = await supabase
            .from('scenario_option_metrics')
            .select('scenario_id, option_id, metric_id, score_value, score_description, is_primary_metric');

          if (metricsError) {
            console.error('Error loading metrics:', metricsError);
          }

          const scenariosWithOptions = (scenariosData || []).map((scenario: any) => {
            const scenarioOptions = (optionsData || [])
              .filter((opt: any) => opt.scenario_id === scenario.id)
              .map((opt: any) => {
                const feedbackBeginner = typeof opt.feedback_beginner === 'string' ? opt.feedback_beginner : '';
                const feedbackIntermediate = typeof opt.feedback_intermediate === 'string' ? opt.feedback_intermediate : feedbackBeginner;
                const feedbackAdvanced = typeof opt.feedback_advanced === 'string' ? opt.feedback_advanced : feedbackBeginner;

                const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
                if (uuidPattern.test(feedbackBeginner) || uuidPattern.test(feedbackIntermediate) || uuidPattern.test(feedbackAdvanced)) {
                  console.error(`WARNING: Option ${opt.id} has UUID in feedback field! This indicates data corruption.`, {
                    beginner: feedbackBeginner,
                    intermediate: feedbackIntermediate,
                    advanced: feedbackAdvanced
                  });
                }

                const sanitizedBeginnerUrl = opt.feedback_video_url_beginner ? sanitizeVideoUrl(opt.feedback_video_url_beginner) : undefined;
                const sanitizedIntermediateUrl = opt.feedback_video_url_intermediate ? sanitizeVideoUrl(opt.feedback_video_url_intermediate) : undefined;
                const sanitizedAdvancedUrl = opt.feedback_video_url_advanced ? sanitizeVideoUrl(opt.feedback_video_url_advanced) : undefined;

                const optionMetrics = (metricsData || [])
                  .filter((m: any) => m.option_id === opt.id)
                  .map((m: any) => ({
                    metricId: m.metric_id,
                    scoreValue: m.score_value,
                    scoreDescription: m.score_description || '',
                    isPrimaryMetric: m.is_primary_metric
                  }));

                return {
                  id: opt.id,
                  text: opt.option_text,
                  feedback: {
                    beginner: feedbackBeginner || '',
                    intermediate: feedbackIntermediate || '',
                    advanced: feedbackAdvanced || ''
                  },
                  feedbackVideos: {
                    beginner: sanitizedBeginnerUrl,
                    intermediate: sanitizedIntermediateUrl,
                    advanced: sanitizedAdvancedUrl
                  },
                  feedbackVideoDuration: opt.feedback_video_duration || undefined,
                  feedbackVideoThumbnail: opt.feedback_video_thumbnail || undefined,
                  transitionVideoUrl: opt.transition_video_url ? sanitizeVideoUrl(opt.transition_video_url) : undefined,
                  transitionVideoDuration: opt.transition_video_duration || undefined,
                  transitionVideoThumbnail: opt.transition_video_thumbnail || undefined,
                  nextScenarioId: opt.next_scenario_id,
                  skillImpact: opt.skill_impacts || {},
                  competency_impacts: opt.competency_impacts || {},
                  metricScores: optionMetrics
                };
              });

            return {
              id: scenario.id,
              title: scenario.title,
              description: scenario.description,
              questionText: scenario.question_text || 'How would you respond?',
              topicId: scenario.topic_id,
              difficulty: scenario.difficulty,
              simulation_id: scenario.simulation_id || undefined,
              options: scenarioOptions,
              isEndScenario: scenario.is_end_scenario || false,
              videoPrompt: scenario.metadata?.videoPrompt,
              videoUrl: scenario.metadata?.videoUrl ? sanitizeVideoUrl(scenario.metadata.videoUrl) : undefined,
              introductionVideoUrl: scenario.introduction_video_url ? sanitizeVideoUrl(scenario.introduction_video_url) : undefined,
              introductionVideoDuration: scenario.introduction_video_duration || undefined,
              introductionVideoThumbnail: scenario.introduction_video_thumbnail || undefined,
              promptVideoUrl: scenario.prompt_video_url ? sanitizeVideoUrl(scenario.prompt_video_url) : undefined,
              promptVideoDuration: scenario.prompt_video_duration || undefined,
              promptVideoThumbnail: scenario.prompt_video_thumbnail || undefined,
              transitionVideoUrl: scenario.transition_video_url ? sanitizeVideoUrl(scenario.transition_video_url) : undefined,
              transitionVideoDuration: scenario.transition_video_duration || undefined,
              isVideoRequired: scenario.is_video_required !== undefined ? scenario.is_video_required : false,
              timerEnabled: scenario.timer_enabled || false,
              timerVisible: scenario.timer_visible || false,
              timerDisplayLocation: scenario.timer_display_location || 'hidden',
              timerType: scenario.timer_type || 'count_up',
              timerLimitSeconds: scenario.timer_limit_seconds || undefined,
              showTimerInFeedback: scenario.show_timer_in_feedback !== undefined ? scenario.show_timer_in_feedback : true,
              timerWarningThresholdSeconds: scenario.timer_warning_threshold_seconds || 30,
              hierarchyLevel: scenario.hierarchy_level ?? null,
              autoCalculateLevel: scenario.auto_calculate_level ?? true
            };
          });

          set({ scenarios: scenariosWithOptions });
        } catch (error) {
          console.error('Error loading scenarios:', error);
          // Fallback to local scenarios
          set({ scenarios: SCENARIOS });
          throw error;
        }
      },
      
      updateScenario: async (id, data) => {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase not configured');
        }
        
        try {
          const { error } = await supabase
            .from('scenarios')
            .update(data)
            .eq('id', id);
            
          if (error) throw error;
          
          // Refresh scenarios
          get().loadScenarios();
        } catch (error) {
          console.error('Error updating scenario:', error);
          throw error;
        }
      },
      
      deleteScenario: async (id) => {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase not configured');
        }
        
        try {
          const { error } = await supabase
            .from('scenarios')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          
          // Refresh scenarios
          get().loadScenarios();
        } catch (error) {
          console.error('Error deleting scenario:', error);
          throw error;
        }
      },
      
      addScenario: async (data = {}) => {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase not configured');
        }

        try {
          const newScenario: Partial<Scenario> = {
            title: 'New Scenario',
            description: 'Enter scenario description',
            topicId: 'communication',
            difficulty: 'beginner',
            options: [],
            isEndScenario: false,
            ...data
          };

          const { error } = await supabase
            .from('scenarios')
            .insert(newScenario);

          if (error) throw error;

          // Refresh scenarios
          get().loadScenarios();
        } catch (error) {
          console.error('Error adding scenario:', error);
          throw error;
        }
      },

      // Preview actions
      startPreview: (scenarioId, difficulty, topicId) => {
        const scenario = get().scenarios.find(s => s.id === scenarioId);
        if (!scenario) return;

        const topic = TOPICS.find(t => t.id === topicId);

        set({
          previewSession: {
            isActive: true,
            startScenarioId: scenarioId,
            difficulty,
            topicId,
            pathHistory: [],
            skillImpacts: {}
          },
          currentScenario: scenario,
          selectedDifficulty: difficulty,
          selectedTopic: topic || null
        });
      },

      selectPreviewOption: (optionId) => {
        const { currentScenario, previewSession, scenarios } = get();

        if (!currentScenario || !previewSession.isActive) return;

        const selectedOption = currentScenario.options.find(o => o.id === optionId);
        if (!selectedOption) return;

        const updatedSkillImpacts = { ...previewSession.skillImpacts };
        Object.entries(selectedOption.skillImpact).forEach(([skill, impact]) => {
          if (!updatedSkillImpacts[skill]) {
            updatedSkillImpacts[skill] = 0;
          }
          updatedSkillImpacts[skill] += impact;
        });

        const pathEntry = {
          scenarioId: currentScenario.id,
          scenarioTitle: currentScenario.title,
          selectedOptionId: optionId,
          optionText: selectedOption.text,
          timestamp: Date.now()
        };

        let nextScenario = null;
        if (selectedOption.nextScenarioId) {
          nextScenario = scenarios.find(s => s.id === selectedOption.nextScenarioId);

          if (!nextScenario) {
            console.warn('[Store] Next scenario not found:', selectedOption.nextScenarioId);
          }
        } else if (!currentScenario.isEndScenario) {
          console.warn('[Store] Option has no nextScenarioId and current scenario is not marked as end scenario');
        }

        set({
          previewSession: {
            ...previewSession,
            pathHistory: [...previewSession.pathHistory, pathEntry],
            skillImpacts: updatedSkillImpacts
          },
          currentScenario: nextScenario
        });
      },

      exitPreview: () => {
        set({
          previewSession: {
            isActive: false,
            startScenarioId: null,
            difficulty: null,
            topicId: null,
            pathHistory: [],
            skillImpacts: {}
          },
          currentScenario: null,
          selectedTopic: null,
          selectedDifficulty: null
        });
      },

      resetPreview: () => {
        const { previewSession, scenarios } = get();
        if (!previewSession.startScenarioId || !previewSession.difficulty || !previewSession.topicId) return;

        const scenario = scenarios.find(s => s.id === previewSession.startScenarioId);
        const topic = TOPICS.find(t => t.id === previewSession.topicId);

        set({
          previewSession: {
            ...previewSession,
            pathHistory: [],
            skillImpacts: {}
          },
          currentScenario: scenario || null,
          selectedDifficulty: previewSession.difficulty,
          selectedTopic: topic || null
        });
      },

      loadLandingPage: async (topicId: string, difficulty: Difficulty) => {
        if (!isSupabaseConfigured || !supabase) {
          return null;
        }

        try {
          const { data, error } = await supabase
            .from('scenarios')
            .select('*')
            .eq('topic_id', topicId)
            .eq('difficulty', difficulty)
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          if (!data) return null;

          return {
            videoUrl: data[`landing_page_video_${difficulty}`],
            title: data[`landing_page_title_${difficulty}`] || data.title,
            description: data[`landing_page_description_${difficulty}`] || data.description,
            objectives: data[`landing_page_objectives_${difficulty}`] || [],
            roleDescription: data[`role_description_${difficulty}`],
            estimatedDuration: data[`estimated_duration_${difficulty}`] || 20
          };
        } catch (error) {
          console.error('Error loading landing page:', error);
          return null;
        }
      },

      saveLandingPageProgress: async (progress: Partial<LandingPageProgress>) => {
        if (!isSupabaseConfigured || !supabase) {
          return;
        }

        const { currentUser } = get();
        if (!currentUser) return;

        try {
          const { data: existing } = await supabase
            .from('landing_page_progress')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('topic_id', progress.topicId!)
            .eq('difficulty', progress.difficulty!)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('landing_page_progress')
              .update({
                ...progress,
                last_interaction_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('landing_page_progress')
              .insert({
                user_id: currentUser.id,
                ...progress,
                last_interaction_at: new Date().toISOString()
              });
          }
        } catch (error) {
          console.error('Error saving landing page progress:', error);
        }
      },

      getResumePoint: async (userId: string, topicId: string) => {
        if (!isSupabaseConfigured || !supabase) {
          return null;
        }

        try {
          const { data, error } = await supabase
            .from('landing_page_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('topic_id', topicId)
            .order('last_interaction_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error || !data) return null;

          const location = data.ready_to_start && data.current_scenario_id
            ? 'scenario'
            : data.fiction_contract_agreed
              ? 'scenario'
              : 'landing_page';

          return {
            exists: true,
            location,
            topicId: data.topic_id,
            difficulty: data.difficulty as Difficulty,
            currentScenarioId: data.current_scenario_id,
            lastInteractionAt: data.last_interaction_at
          };
        } catch (error) {
          console.error('Error getting resume point:', error);
          return null;
        }
      },

      clearResumePoint: async (userId: string, topicId: string, difficulty: Difficulty) => {
        if (!isSupabaseConfigured || !supabase) {
          return;
        }

        try {
          await supabase
            .from('landing_page_progress')
            .delete()
            .eq('user_id', userId)
            .eq('topic_id', topicId)
            .eq('difficulty', difficulty);
        } catch (error) {
          console.error('Error clearing resume point:', error);
        }
      },

      // Session management actions
      initializeSession: (simulationId: string, instanceId: string | null) => {
        set({
          activeSession: {
            simulationId,
            instanceId,
            currentScenarioIndex: 0,
            selectedOptionId: null,
            decisionHistory: [],
            competencyScores: {},
            startedAt: Date.now()
          }
        });
      },

      updateSessionScenarioIndex: (index: number) => {
        const { activeSession } = get();
        if (!activeSession) return;

        set({
          activeSession: {
            ...activeSession,
            currentScenarioIndex: index,
            selectedOptionId: null
          }
        });
      },

      updateSessionSelectedOption: (optionId: string | null) => {
        const { activeSession } = get();
        if (!activeSession) return;

        set({
          activeSession: {
            ...activeSession,
            selectedOptionId: optionId
          }
        });
      },

      addSessionDecision: (scenarioId: string, optionId: string) => {
        const { activeSession } = get();
        if (!activeSession) return;

        set({
          activeSession: {
            ...activeSession,
            decisionHistory: [
              ...activeSession.decisionHistory,
              {
                scenarioId,
                optionId,
                timestamp: Date.now()
              }
            ]
          }
        });
      },

      updateSessionCompetencyScores: (scores: Record<string, number>) => {
        const { activeSession } = get();
        if (!activeSession) return;

        set({
          activeSession: {
            ...activeSession,
            competencyScores: scores
          }
        });
      },

      clearSession: () => {
        set({ activeSession: null });
      }
    }),
    {
      name: 'moodle-simulation-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        selectedTopic: state.selectedTopic,
        selectedDifficulty: state.selectedDifficulty,
        scenarios: state.scenarios,
        activeSession: state.activeSession
      })
    }
  )
);