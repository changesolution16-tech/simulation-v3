import { MoodleContext, MoodleUser } from '../lib/moodle';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type VideoSource = 'url' | 'embed' | 'upload' | 'library';

export type VideoFile = {
  id: string;
  original_filename: string;
  storage_path: string;
  storage_bucket: string;
  file_size: number;
  mime_type: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  thumbnail_path?: string;
  thumbnail_url?: string;
  upload_status: 'uploading' | 'completed' | 'failed' | 'processing';
  uploaded_by: string;
  is_public: boolean;
  created_at: string;
};

export type VideoInput = {
  source: VideoSource;
  url?: string;
  embedCode?: string;
  fileId?: string;
  file?: File;
  libraryId?: string;
  videoType?: 'introduction' | 'prompt' | 'feedback' | 'transition' | 'supplementary';
};

export type SoftSkillTopic = {
  id: string;
  title: string;
  description: string;
  icon: string;
  availableDifficulties: Difficulty[];
};

export type ScenarioOption = {
  id: string;
  text: string;
  feedback: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  feedbackVideos?: {
    beginner?: string;
    intermediate?: string;
    advanced?: string;
  };
  feedbackVideoMetadata?: {
    beginner?: {
      source?: string;
      libraryId?: string;
      fileId?: string;
      embedCode?: string;
      url?: string;
    };
    intermediate?: {
      source?: string;
      libraryId?: string;
      fileId?: string;
      embedCode?: string;
      url?: string;
    };
    advanced?: {
      source?: string;
      libraryId?: string;
      fileId?: string;
      embedCode?: string;
      url?: string;
    };
  };
  feedbackVideoDuration?: number;
  feedbackVideoThumbnail?: string;
  transitionVideoUrl?: string;
  transitionVideoMetadata?: {
    source?: string;
    libraryId?: string;
    fileId?: string;
    embedCode?: string;
    url?: string;
  };
  transitionVideoDuration?: number;
  transitionVideoThumbnail?: string;
  nextScenarioId: string | null;
  skillImpact: {
    [key: string]: number;
  };
  learningRecommendations?: {
    resources: {
      title: string;
      type: 'article' | 'video' | 'book' | 'course';
      url?: string;
      description: string;
    }[];
    practiceExercises: string[];
    nextSteps: string[];
  };
  competency_impacts?: {
    [key: string]: any;
  };
};

export type TimerDisplayLocation = 'hidden' | 'question_page' | 'feedback_page' | 'results_page' | 'all';
export type TimerType = 'count_up' | 'countdown' | 'none';

export type Scenario = {
  id: string;
  title: string;
  description: string;
  topicId: string;
  difficulty: Difficulty;
  options: ScenarioOption[];
  isEndScenario: boolean;
  videoPrompt?: string;
  videoUrl?: string;
  introductionVideoUrl?: string;
  introductionVideoDuration?: number;
  introductionVideoThumbnail?: string;
  promptVideoUrl?: string;
  promptVideoDuration?: number;
  promptVideoThumbnail?: string;
  transitionVideoUrl?: string;
  transitionVideoDuration?: number;
  isVideoRequired?: boolean;
  overallFeedback?: {
    strengths: string[];
    areasForImprovement: string[];
    skillDevelopmentPath: string[];
  };
  landingPageContent?: {
    beginner?: LandingPageContent;
    intermediate?: LandingPageContent;
    advanced?: LandingPageContent;
  };
  fictionContractText?: string;
  timerEnabled?: boolean;
  timerVisible?: boolean;
  timerDisplayLocation?: TimerDisplayLocation;
  timerType?: TimerType;
  timerLimitSeconds?: number;
  showTimerInFeedback?: boolean;
  timerWarningThresholdSeconds?: number;
  hierarchyLevel?: number | null;
  autoCalculateLevel?: boolean;
  questionText?: string;
};

export type LearnerProgress = {
  userId: string;
  completedScenarios: {
    scenarioId: string;
    selectedOptionId: string;
    timestamp: number;
  }[];
  skillLevels: {
    [key: string]: number;
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: 'learner' | 'instructor' | 'admin';
  institution?: string;
  department?: string;
  position?: string;
  is_active?: boolean;
  password_last_changed?: string;
  last_login_at?: string;
  failed_login_attempts?: number;
  progress: LearnerProgress;
  moodleContext?: MoodleContext;
  moodleUser?: MoodleUser;
};

export type VideoWatchStatus = {
  videoType: 'prompt' | 'feedback' | 'transition' | 'introduction';
  scenarioId?: string;
  optionId?: string;
  watchPercentage: number;
  completed: boolean;
  watchDuration: number;
  wasSkipped?: boolean;
  skipReason?: string;
};

export type StorageQuota = {
  user_id: string;
  total_quota: number;
  used_space: number;
  max_files: number;
  file_count: number;
  last_calculated_at: string;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
};

export type PreviewSession = {
  isActive: boolean;
  startScenarioId: string | null;
  difficulty: Difficulty | null;
  topicId: string | null;
  pathHistory: {
    scenarioId: string;
    scenarioTitle: string;
    selectedOptionId: string | null;
    optionText: string | null;
    timestamp: number;
  }[];
  skillImpacts: {
    [key: string]: number;
  };
  videoWatchStatus: {
    [key: string]: VideoWatchStatus;
  };
};

export type LearningObjective = {
  text: string;
  category?: string;
};

export type LandingPageContent = {
  videoUrl?: string;
  title?: string;
  description?: string;
  objectives: LearningObjective[];
  roleDescription?: string;
  estimatedDuration?: number;
  imageUrl?: string;
  imageAlt?: string;
};

export type LandingPageProgress = {
  id: string;
  userId: string;
  topicId: string;
  difficulty: Difficulty;
  videoWatched: boolean;
  videoWatchPercentage: number;
  videoSkipped: boolean;
  fictionContractAgreed: boolean;
  fictionContractAgreedAt?: string;
  lastSectionViewed?: string;
  readyToStart: boolean;
  currentScenarioId?: string;
  lastInteractionAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ResumePoint = {
  exists: boolean;
  location: 'landing_page' | 'scenario' | 'results';
  topicId: string;
  difficulty: Difficulty;
  currentScenarioId?: string;
  lastInteractionAt?: string;
};

export type SimulationStatus = 'draft' | 'review' | 'published' | 'archived';

export type VideoType = 'youtube' | 'synthesia' | 'vimeo' | 'file';

export type AnalysisType = 'score' | 'skill' | 'journey' | 'comprehensive';

export type SimulationCategory = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Simulation = {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category_id?: string;
  difficulty: Difficulty;
  estimated_duration_minutes: number;
  status: SimulationStatus;
  created_by?: string;

  landing_page_enabled: boolean;
  landing_intro_video_url?: string;
  landing_intro_video_type: VideoType;
  landing_title?: string;
  landing_description?: string;
  landing_objectives: LearningObjective[];
  landing_role_description?: string;
  landing_fiction_contract: string;
  landing_image_url?: string;
  landing_image_alt?: string;

  introduction_page_enabled: boolean;
  introduction_title?: string;
  introduction_description?: string;
  introduction_video_url?: string;
  introduction_video_type?: VideoType;

  closing_page_enabled: boolean;
  closing_video_url?: string;
  closing_video_type: VideoType;
  closing_video_excellent_url?: string;
  closing_video_excellent_type?: VideoType;
  closing_video_excellent_file_id?: string;
  closing_video_excellent_source?: VideoSource;
  closing_video_good_url?: string;
  closing_video_good_type?: VideoType;
  closing_video_good_file_id?: string;
  closing_video_good_source?: VideoSource;
  closing_video_developing_url?: string;
  closing_video_developing_type?: VideoType;
  closing_video_developing_file_id?: string;
  closing_video_developing_source?: VideoSource;
  closing_excellent_threshold: number;
  closing_good_threshold: number;
  closing_page_show_before_results: boolean;
  closing_title: string;
  closing_analysis_type: AnalysisType;
  closing_feedback_templates: Record<string, any>;
  closing_recommendations_enabled: boolean;

  entry_scenario_id?: string;

  tags: string[];
  is_template: boolean;
  template_source_id?: string;
  version: number;

  max_level?: number;

  created_at: string;
  updated_at: string;
  published_at?: string;
};

export type SimulationScenario = {
  id: string;
  simulation_id: string;
  scenario_id: string;
  is_entry_point: boolean;
  is_exit_point: boolean;
  sequence_order: number;
  position_x: number;
  position_y: number;
  notes?: string;
  created_at: string;
};

export type SimulationWithScenarios = Simulation & {
  scenarios: (SimulationScenario & { scenarios: Scenario })[];
  scenario_count: number;
};

export type SimulationFormData = {
  name: string;
  display_name: string;
  description: string;
  category_id: string;
  difficulty: Difficulty;
  estimated_duration_minutes: number;

  landing_page_enabled: boolean;
  landing_intro_video_url: string;
  landing_intro_video_type: VideoType;
  landing_title: string;
  landing_description: string;
  landing_objectives: LearningObjective[];
  landing_role_description: string;
  landing_image_url: string;
  landing_image_alt: string;
  landing_fiction_contract: string;

  introduction_page_enabled: boolean;
  introduction_title: string;
  introduction_description: string;
  introduction_video_url: string;
  introduction_video_type: VideoType;

  closing_page_enabled: boolean;
  closing_video_url: string;
  closing_video_type: VideoType;
  closing_video_excellent_url: string;
  closing_video_excellent_type: VideoType;
  closing_video_excellent_file_id?: string;
  closing_video_excellent_source?: VideoSource;
  closing_video_good_url: string;
  closing_video_good_type: VideoType;
  closing_video_good_file_id?: string;
  closing_video_good_source?: VideoSource;
  closing_video_developing_url: string;
  closing_video_developing_type: VideoType;
  closing_video_developing_file_id?: string;
  closing_video_developing_source?: VideoSource;
  closing_excellent_threshold: number;
  closing_good_threshold: number;
  closing_page_show_before_results: boolean;
  closing_title: string;
  closing_analysis_type: AnalysisType;
  closing_recommendations_enabled: boolean;

  tags: string[];
};

export type BravinDimensionCode = 'BOLDNESS' | 'RESPONSIBILITY' | 'ACCOUNTABILITY' | 'VISION' | 'INTEGRITY' | 'NURTURANCE';

export interface BravinDimension {
  id: string;
  code: BravinDimensionCode;
  name: string;
  description: string;
  assessment_criteria: Array<{
    criterion: string;
    weight: number;
  }>;
  weight: number;
  min_score: number;
  max_score: number;
  display_order: number;
  color_hex?: string;
  icon_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BravinLearnerScore {
  id: string;
  learner_id: string;
  dimension_id: string;
  current_score: number;
  total_assessments: number;
  highest_score?: number;
  lowest_score?: number;
  average_score?: number;
  trend?: 'improving' | 'stable' | 'declining';
  growth_rate?: number;
  last_assessed_at?: string;
  first_assessed_at: string;
  created_at: string;
  updated_at: string;
  dimension?: BravinDimension;
}

export type PressureLevel = 'low' | 'medium' | 'high' | 'critical';
export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'very_complex';
export type TransparencyLevel = 'hidden' | 'partial' | 'transparent' | 'vulnerable';
export type RecoveryDifficulty = 'easy' | 'moderate' | 'difficult' | 'severe';
export type ReasoningQuality = 'weak' | 'adequate' | 'strong' | 'exemplary';
export type EmotionalComplexity = 'simple' | 'moderate' | 'complex' | 'highly_complex';
export type InterpersonalChallengeLevel = 'low' | 'medium' | 'high' | 'critical';
export type VisibilityLevel = 'individual' | 'team' | 'department' | 'organization';
export type InfluenceScope = 'limited' | 'moderate' | 'significant' | 'transformative';

export interface BravinDecisionAssessment {
  id: string;
  learner_id: string;
  simulation_instance_id?: string;
  scenario_id?: string;
  option_id?: string;
  decision_timestamp: string;

  boldness_impact?: number;
  responsibility_impact?: number;
  accountability_impact?: number;
  vision_impact?: number;
  integrity_impact?: number;
  nurturance_impact?: number;

  trust_impact_score?: number;
  ethical_quality_score?: number;
  ei_recognition_score?: number;
  ei_response_score?: number;
  cultural_alignment_score?: number;

  pressure_level?: PressureLevel;
  complexity_level?: ComplexityLevel;
  stakeholder_count?: number;
  time_pressure_seconds?: number;

  decision_rationale?: string;
  context_notes?: Record<string, any>;
  created_at: string;
}

export type TrustEventType = 'trust_built' | 'trust_damaged' | 'trust_repaired' | 'trust_maintained';

export interface TrustImpactEvent {
  id: string;
  learner_id: string;
  decision_assessment_id?: string;
  event_type: TrustEventType;
  impact_magnitude: number;

  boundaries_impact?: number;
  reliability_impact?: number;
  accountability_impact?: number;
  vault_confidentiality_impact?: number;
  integrity_impact?: number;
  non_judgment_impact?: number;
  generosity_impact?: number;

  psychological_safety_indicator?: boolean;
  team_cohesion_impact?: number;
  transparency_level?: TransparencyLevel;
  stakeholders_affected?: string[];

  recovery_possible?: boolean;
  recovery_difficulty?: RecoveryDifficulty;

  event_description?: string;
  created_at: string;
}

export interface EthicalDecisionQualityAssessment {
  id: string;
  learner_id: string;
  decision_assessment_id?: string;

  values_alignment_score: number;
  performance_impact_score: number;
  stakeholder_consideration_score: number;
  long_term_thinking_score: number;

  under_pressure?: boolean;
  pressure_source?: string;
  pressure_intensity?: number;

  values_performance_balance?: number;
  ethical_framework_used?: string;
  reasoning_quality?: ReasoningQuality;

  short_term_consequences?: Record<string, any>;
  long_term_consequences?: Record<string, any>;
  unintended_consequences?: Record<string, any>;

  notes?: string;
  created_at: string;
}

export interface EmotionalIntelligenceAssessment {
  id: string;
  learner_id: string;
  decision_assessment_id?: string;

  self_awareness_score?: number;
  self_regulation_score?: number;
  motivation_score?: number;
  empathy_score?: number;
  social_skills_score?: number;

  emotion_recognition_accuracy?: number;
  emotional_cue_identification?: any[];
  empathetic_response_quality?: number;
  emotional_regulation_demonstrated?: boolean;

  authentic_dialogue_created?: boolean;
  psychological_space_provided?: boolean;
  active_listening_indicators?: any[];

  emotional_complexity?: EmotionalComplexity;
  interpersonal_challenge_level?: InterpersonalChallengeLevel;

  notes?: string;
  created_at: string;
}

export type CulturalStewardshipActionType =
  | 'culture_protection'
  | 'culture_shaping'
  | 'values_advocacy'
  | 'cultural_influence'
  | 'norm_challenging'
  | 'culture_modeling';

export interface CulturalStewardshipLog {
  id: string;
  learner_id: string;
  decision_assessment_id?: string;

  action_type: CulturalStewardshipActionType;
  action_impact: number;

  bravin_values_reinforced?: string[];
  cultural_norms_influenced?: string[];
  team_culture_impact?: number;
  organizational_culture_impact?: number;

  visibility_level?: VisibilityLevel;
  influence_scope?: InfluenceScope;

  role_modeling_quality?: number;
  values_consistency_score?: number;
  cultural_courage_demonstrated?: boolean;

  action_description?: string;
  created_at: string;
}

export interface BravinScenarioOptionMapping {
  id: string;
  scenario_id: string;
  option_id: string;

  boldness_impact?: number;
  responsibility_impact?: number;
  accountability_impact?: number;
  vision_impact?: number;
  integrity_impact?: number;
  nurturance_impact?: number;

  trust_impact_config?: Record<string, any>;
  ethical_quality_config?: Record<string, any>;
  ei_indicators_config?: Record<string, any>;
  cultural_stewardship_config?: Record<string, any>;

  pressure_level?: PressureLevel;
  complexity_level?: ComplexityLevel;

  configured_by?: string;
  configuration_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BravinAssessmentResult {
  overall_alignment_score: number;
  dimension_scores: {
    boldness: number;
    responsibility: number;
    accountability: number;
    vision: number;
    integrity: number;
    nurturance: number;
  };
  trust_impact_rating: number;
  ethical_decision_quality: number;
  emotional_intelligence_index: number;
  cultural_stewardship_score: number;

  strengths: BravinDimensionCode[];
  development_areas: BravinDimensionCode[];

  trust_events_summary: {
    trust_built: number;
    trust_damaged: number;
    trust_repaired: number;
    trust_maintained: number;
  };

  decision_count: number;
  assessment_date: string;
}